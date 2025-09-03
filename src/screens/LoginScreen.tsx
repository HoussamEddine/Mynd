import React, { useState } from 'react';
import Animated, { 
  FadeInUp,
  FadeOutDown,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, type AuthUser } from '../services/authService';
import { 
  sanitizeInput, 
  validateEmail,
  validatePassword,
  logSecurityEvent,
  createRateLimiter,
  getDeviceFingerprint 
} from '../services/securityService';
import { theme } from '../constants'
const { colors } = theme.foundations;;
import { Text } from '../components/base/Text';
import { PrimaryButton } from '../components/PrimaryButton';

const FIRST_TIME_USER_KEY = '@first_time_user';

// Rate limiters
const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000);
const googleSignupRateLimiter = createRateLimiter(10, 10 * 60 * 1000);

interface LoginScreenProps {
  onComplete: (user: AuthUser) => void;
  onBack: () => void;
  onShowSignup: () => void;
}

export default function LoginScreen({ onComplete, onBack, onShowSignup }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    
    const deviceFingerprint = await getDeviceFingerprint();
    if (!googleSignupRateLimiter.checkLimit(deviceFingerprint)) {
      const remainingTime = Math.ceil(googleSignupRateLimiter.getRemainingTime(deviceFingerprint) / 1000 / 60);
      Alert.alert('Too Many Attempts', `Please wait ${remainingTime} minutes before trying Google Sign-In again.`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await authService.signInWithGoogle();
      
      if (result.error) {
        if (result.error === 'cancelled') {
          return;
        }
        Alert.alert('Google Sign In Failed', result.error);
      } else if (result.user) {
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'false');
        onComplete(result.user);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect to Google. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    Alert.alert('Coming Soon', 'Apple sign-in will be available soon!');
  };

  // Check if email exists in database
  const handleEmailVerification = async () => {
    if (!formData.email) {
      setValidationErrors({ email: 'Please enter your email address' });
      return;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setValidationErrors({ email: emailValidation.error! });
      return;
    }

    setIsLoading(true);

    try {
      // Try to sign in with a dummy password to check if user exists
      const result = await authService.signIn({
        email: formData.email,
        password: 'dummy_password_check'
      });

      // If we get invalid credentials, user exists
      if (result.error && result.error.includes('Invalid login credentials')) {
        setUserExists(true);
        setShowPasswordField(true);
        setValidationErrors({});
      } else if (result.error && result.error.includes('Email not confirmed')) {
        Alert.alert('Email not confirmed', 'Please check your email and confirm your account before signing in.');
      } else if (result.error) {
        // User doesn't exist, redirect to signup
        Alert.alert('Account not found', 'No account found with this email. Please sign up first.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: onShowSignup }
        ]);
      } else if (result.user) {
        // This shouldn't happen with dummy password, but handle it
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'false');
        onComplete(result.user);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (isLoading) return;

    const deviceFingerprint = await getDeviceFingerprint();
    
    if (!loginRateLimiter.checkLimit(deviceFingerprint)) {
      const remainingTime = Math.ceil(loginRateLimiter.getRemainingTime(deviceFingerprint) / 1000 / 60);
      Alert.alert('Too Many Attempts', `Please wait ${remainingTime} minutes before trying again.`);
      return;
    }

    // Validation
    const errors: Record<string, string> = {};
    
    const sanitizedData = {
      email: sanitizeInput(formData.email.toLowerCase()),
      password: formData.password,
    };

    if (!sanitizedData.email) {
      errors.email = 'Email is required';
    } else {
      const emailValidation = validateEmail(sanitizedData.email);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error!;
      }
    }

    if (!sanitizedData.password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.signIn({
        email: sanitizedData.email,
        password: sanitizedData.password,
      });

      if (result.error) {
        if (result.error.includes('Invalid login credentials')) {
          Alert.alert('Invalid Credentials', 'The email or password you entered is incorrect.');
        } else {
          Alert.alert('Login Failed', result.error);
        }
      } else if (result.user) {
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'false');
        onComplete(result.user);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showEmailFormHandler = () => {
    setShowEmailForm(true);
  };

  const hideEmailFormHandler = () => {
    setShowEmailForm(false);
    setShowPasswordField(false);
    setUserExists(false);
    setFormData({ email: '', password: '' });
    setValidationErrors({});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background || '#FFFFFF'} translucent={false} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              <Text variant="bold" style={styles.heroTitle}>
                Welcome Back to Mynd
              </Text>
              
              <Text style={styles.heroSubtitle}>
                Continue your transformation journey.
              </Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              {showEmailForm ? (
                /* Email Form */
                <View style={styles.formSection}>
                  {/* Email Input - Always shown first */}
                  <View style={[styles.inputWrapper, validationErrors.email && styles.inputError]}>
                    <Feather name="mail" size={20} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor={colors.textMuted}
                      value={formData.email}
                      onChangeText={(text) => {
                        const sanitized = sanitizeInput(text.toLowerCase());
                        setFormData(prev => ({ ...prev, email: sanitized }));
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({ ...prev, email: '' }));
                        }
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      maxLength={254}
                    />
                  </View>
                  {validationErrors.email && (
                    <Text style={styles.errorText}>{validationErrors.email}</Text>
                  )}

                  {/* Show continue button when user hasn't entered password yet */}
                  {!showPasswordField && (
                    <PrimaryButton
                      title="Continue"
                      onPress={handleEmailVerification}
                      loading={isLoading}
                      style={styles.continueButton}
                    />
                  )}

                  {/* Password Field - shown when user exists */}
                  {showPasswordField && (
                    <>
                      <View style={[styles.inputWrapper, validationErrors.password && styles.inputError]}>
                        <Feather name="lock" size={20} color={colors.primary} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Password"
                          placeholderTextColor={colors.textMuted}
                          value={formData.password}
                          onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, password: text }));
                            if (validationErrors.password) {
                              setValidationErrors(prev => ({ ...prev, password: '' }));
                            }
                          }}
                          secureTextEntry
                          autoComplete="current-password"
                          maxLength={128}
                        />
                      </View>
                      {validationErrors.password && (
                        <Text style={styles.errorText}>{validationErrors.password}</Text>
                      )}

                      <PrimaryButton
                        title="Login"
                        onPress={handleEmailLogin}
                        loading={isLoading}
                      />
                    </>
                  )}

                  <Pressable style={styles.backToOptionsButton} onPress={hideEmailFormHandler}>
                    <Feather name="arrow-left" size={16} color={colors.primary} />
                    <Text style={styles.backToOptionsText}>Back to options</Text>
                  </Pressable>
                </View>
              ) : (
                /* Social Options */
                <View style={styles.optionsSection}>
                  <Pressable 
                    style={[styles.socialButton, isLoading && styles.disabledButton]} 
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <View style={styles.socialButtonContent}>
                      <View style={styles.googleIconContainer}>
                        <Feather name="chrome" size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.socialButtonText}>
                        Login with Google
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={20} color="#64748B" />
                  </Pressable>

                  {Platform.OS === 'ios' && (
                    <Pressable style={styles.socialButton} onPress={handleAppleLogin}>
                      <View style={styles.socialButtonContent}>
                        <View style={styles.appleIconContainer}>
                          <Feather name="command" size={18} color="#FFFFFF" />
                        </View>
                        <Text style={styles.socialButtonText}>
                          Login with Apple
                        </Text>
                      </View>
                      <Feather name="arrow-right" size={20} color="#64748B" />
                    </Pressable>
                  )}

                  <Pressable style={styles.socialButton} onPress={showEmailFormHandler}>
                    <View style={styles.socialButtonContent}>
                      <View style={styles.emailIconContainer}>
                        <Feather name="mail" size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.socialButtonText}>
                        Login with Email
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={20} color="#64748B" />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?
              </Text>
              
              <PrimaryButton
                title="Sign up"
                onPress={onShowSignup}
                variant="secondary"
                style={styles.switchButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 24,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: '#a78bfa',
  },
  heroTitle: {
    fontSize: 26,
    color: colors.textPrimary || '#1F2937',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textSecondary || '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  mainContent: {
    flex: 1,
    paddingVertical: 12,
  },
  formSection: {
    gap: 16,
  },
  optionsSection: {
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    height: 64,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary || '#1F2937',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    marginLeft: 8,
    fontWeight: '500',
  },
  continueButton: {
    marginTop: 16,
  },
  backToOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
    marginTop: 16,
  },
  backToOptionsText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 20,
    height: 68,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.05,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flex: 1,
    marginRight: 12,
  },
  googleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary || '#1F2937',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'left',
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 16,
  },
  footerText: {
    fontSize: 16,
    color: colors.textMuted || '#9CA3AF',
    textAlign: 'center',
  },
  switchButton: {
    height: 56,
  },
});