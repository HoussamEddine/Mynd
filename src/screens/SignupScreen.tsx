import React, { useState, useCallback, useEffect } from 'react';
import Animated, { 
  FadeInUp,
  FadeOutDown,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, AntDesign, FontAwesome } from '@expo/vector-icons';
import SoundWaveSpinner from '../components/SoundWaveSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, type AuthUser } from '../services/authService';
import { supabase } from '../lib/supabase';
import { 
  sanitizeInput, 
  validateEmail, 
  validatePassword, 
  validateName,
  logSecurityEvent,
  createRateLimiter,
  getDeviceFingerprint 
} from '../services/securityService';
import { theme, ScreenWrapper } from '../constants';
import { Text } from '../components/base/Text';
import SocialAuthButton from '../components/SocialAuthButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardingStepsScreen from '../screens/OnboardingStepsScreen';
import OnboardingQuestionsFlow from '../screens/OnboardingQuestionsFlow';
import VoiceCloneIntroScreen from '../screens/VoiceCloneIntroScreen';
import VoiceCloneScreen from '../screens/VoiceCloneScreen';
import AppTabs from '../navigation/AppTabs';
import { LinearGradient } from 'expo-linear-gradient';

const { foundations, components, utils } = theme;
const { colors, spacing, radii: borderRadius, shadows } = foundations;
const { typography, layout } = components;
const { width } = Dimensions.get('window');

const FIRST_TIME_USER_KEY = '@first_time_user';

// Rate limiters with more granular control
const signupRateLimiter = createRateLimiter(3, 30 * 60 * 1000); // 3 attempts per 30 minutes
const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const emailVerificationLimiter = createRateLimiter(3, 5 * 60 * 1000); // 3 attempts per 5 minutes
const socialAuthLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

interface SignupScreenProps {
  onComplete: (user: AuthUser) => void;
  onBack: () => void;
  onShowSignIn: () => void;
  onShowEmailSignup: () => void;
  isLoginFlow?: boolean;
}

export default function SignupScreen({ 
  onComplete, 
  onBack, 
  onShowSignIn,
  onShowEmailSignup,
  isLoginFlow = false 
}: SignupScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(isLoginFlow);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Animation values
  const contentOpacity = useSharedValue(1);
  const contentTranslateY = useSharedValue(0);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  // Removed automatic redirect - users should always have choice to sign up

  const handleGoogleAuth = async () => {
    if (isGoogleLoading || isAppleLoading || isEmailLoading) return;

    const deviceFingerprint = await getDeviceFingerprint();
    if (!socialAuthLimiter.checkLimit(deviceFingerprint)) {
      const remainingTime = Math.ceil(socialAuthLimiter.getRemainingTime(deviceFingerprint) / 1000 / 60);
      Alert.alert('Too Many Attempts', `Please wait ${remainingTime} minutes before trying Google Sign-In again.`);
      return;
    }
    
    setIsGoogleLoading(true);
    
    try {
      const result = await authService.signInWithGoogle();
      
      if (result.error) {
        if (result.error === 'cancelled') {
          return;
        }
        Alert.alert('Google Sign In Failed', result.error);
      } else if (result.user) {
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'true');
        onComplete(result.user);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect to Google. Please check your internet connection and try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    if (isGoogleLoading || isAppleLoading || isEmailLoading) return;

    const deviceFingerprint = await getDeviceFingerprint();
    if (!socialAuthLimiter.checkLimit(deviceFingerprint)) {
      const remainingTime = Math.ceil(socialAuthLimiter.getRemainingTime(deviceFingerprint) / 1000 / 60);
      Alert.alert('Too Many Attempts', `Please wait ${remainingTime} minutes before trying Apple Sign-In again.`);
      return;
    }
    
    setIsAppleLoading(true);
    
    try {
      const result = await authService.signInWithApple();
      
      if (result.error) {
        if (result.error === 'cancelled') {
          return;
        }
        Alert.alert('Apple Sign In Failed', result.error);
      } else if (result.user) {
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'true');
        onComplete(result.user);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect to Apple Sign-in. Please check your internet connection and try again.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    if (isLoading) return;

    const deviceFingerprint = await getDeviceFingerprint();
    if (!emailVerificationLimiter.checkLimit(deviceFingerprint)) {
      const remainingTime = Math.ceil(emailVerificationLimiter.getRemainingTime(deviceFingerprint) / 60);
      Alert.alert('Too Many Attempts', `Please wait ${remainingTime} minutes before trying again.`);
      return;
    }

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
      const result = await authService.signIn({
        email: formData.email,
        password: 'dummy_password_check'
      });

      if (result.error) {
        if (result.error.includes('Invalid login credentials')) {
          // Email exists - show password field
        setUserExists(true);
        setShowPasswordField(true);
        setValidationErrors({});
        } else if (result.error.includes('Email not confirmed')) {
          // Email exists but not verified
          Alert.alert(
            'Email Not Verified',
            'Please check your email inbox and verify your account before signing in.',
            [
              {
                text: 'Resend Verification',
                onPress: async () => {
                  try {
                    await authService.resendVerificationEmail(formData.email);
                    Alert.alert('Verification Email Sent', 'Please check your inbox and follow the verification link.');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to resend verification email. Please try again later.');
                  }
                },
              },
              { text: 'OK', style: 'cancel' }
            ]
          );
        } else if (result.error.includes('Too many requests')) {
          Alert.alert(
            'Too Many Attempts',
            'Please wait a few minutes before trying again.',
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          // Email doesn't exist
          Alert.alert(
            'Account Not Found',
            'No account found with this email. Would you like to create one?',
            [
              {
                text: 'Create Account',
                onPress: () => {
                  setIsLoginMode(false);
                  setShowEmailForm(true);
                  setFormData(prev => ({ ...prev, password: '' }));
                },
                style: 'default'
              },
              {
                text: 'Try Again',
                style: 'cancel'
              }
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to verify email. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (isLoading) return;

    const deviceFingerprint = await getDeviceFingerprint();
    const rateLimiter = isLoginMode ? loginRateLimiter : signupRateLimiter;
    
    if (!rateLimiter.checkLimit(deviceFingerprint)) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(deviceFingerprint) / 1000 * 60);
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
    } else if (!isLoginMode) {
      const passwordValidation = validatePassword(sanitizedData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error!;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isLoginMode) {
        result = await authService.signIn({
          email: sanitizedData.email,
          password: sanitizedData.password,
        });
      } else {
        result = await authService.signUp({
          email: sanitizedData.email,
          password: sanitizedData.password,
        });
      }

      if (result.error) {
        if (result.error.includes('Invalid login credentials')) {
          Alert.alert('Invalid Credentials', 'The email or password you entered is incorrect.');
        } else if (result.error.includes('User already registered')) {
          Alert.alert(
            'Account Exists',
            'An account with this email already exists.',
            [
              {
                text: 'Sign In Instead',
                onPress: () => {
                  setIsLoginMode(true);
                  setShowPasswordField(true);
                  setUserExists(true);
                },
                style: 'default'
              },
              { text: 'Try Again', style: 'cancel' }
            ]
          );
        } else if (result.error.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email address before signing in.',
            [
              {
                text: 'Resend Verification',
                onPress: async () => {
                  try {
                    await authService.resendVerificationEmail(sanitizedData.email);
                    Alert.alert('Verification Email Sent', 'Please check your inbox and follow the verification link.');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to resend verification email. Please try again later.');
                  }
                },
              },
              { text: 'OK', style: 'cancel' }
            ]
          );
        } else if (result.error.includes('Too many requests')) {
          Alert.alert('Rate Limited', 'Too many attempts. Please wait a few minutes before trying again.');
        } else {
          Alert.alert(isLoginMode ? 'Login Failed' : 'Signup Failed', result.error);
        }
      } else if (result.user) {
        // Set first time user key based on the flow
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'true');
        
        if (!isLoginMode) {
          Alert.alert(
            'Account Created',
            'Please check your email to verify your account before signing in.',
            [{ text: 'OK', style: 'default' }]
          );
          switchToLogin();
        } else {
        onComplete(result.user);
        }
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
      setIsLoginMode(true);
  };

  const switchToSignIn = () => {
    if (onShowSignIn) {
      onShowSignIn();
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
    <ScreenWrapper contentStyle={styles.content}>
      {/* Logo Section */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.logoSection}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Main Content */}
      <Animated.View entering={FadeInUp.delay(500)} style={styles.mainContent}>
        <View style={styles.textSection}>
          <Text style={styles.title}>Create Your{'\n'}Mynd Account</Text>
          <Text style={styles.description}>
            Begin your journey to mental wellness.
          </Text>
        </View>

        {/* Social Buttons */}
        <View style={styles.socialButtonsSection}>
          <SocialAuthButton
            provider="google"
            onPress={handleGoogleAuth}
            isLoading={isGoogleLoading}
            buttonText="Sign up with Google"
          />

          {Platform.OS === 'ios' && (
            <SocialAuthButton
              provider="apple"
              onPress={handleAppleAuth}
              isLoading={isAppleLoading}
              buttonText="Sign up with Apple"
            />
          )}

          <SocialAuthButton
            provider="email"
            onPress={onShowEmailSignup}
            isLoading={isEmailLoading}
            buttonText="Sign up with Email"
          />
        </View>
      </Animated.View>

      {/* Footer Section */}
      <Animated.View entering={SlideInRight.delay(700)} style={styles.footerSection}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Pressable 
          style={({ pressed }) => [
            utils.createButtonStyle('primary', 'lg', {
              width: '100%',
              maxWidth: 320,
            }),
            pressed && components.button.states.pressed
          ]} 
          onPress={switchToSignIn}
        >
          <LinearGradient
            colors={[...foundations.gradients.primaryButton.colors]}
            start={foundations.gradients.primaryButton.start}
            end={foundations.gradients.primaryButton.end}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[
            components.button.typography.lg,
            { color: foundations.colors.textLight }
          ]}>
            Sign In
          </Text>
        </Pressable>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: foundations.spacing.lg,
  },
  logo: {
    width: spacing['8xl'],
    height: spacing['8xl'],
    tintColor: colors.primary,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  textSection: {
    alignItems: 'center',
    maxWidth: width * 0.9,
    marginBottom: spacing['4xl'],
  },
  title: {
    ...components.typography.display.large,
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: -1,
    color: colors.textPrimary,
  },
  description: {
    ...components.typography.body.large,
    textAlign: 'center',
    color: colors.textSecondary,
    maxWidth: '80%',
  },
  socialButtonsSection: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.lg,
    alignSelf: 'center',
  },
  socialButton: {
    height: 56,
    borderRadius: foundations.radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...foundations.shadows.sm,
  },
  socialButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  socialButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  socialIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    ...components.typography.button.medium,
    color: colors.textPrimary,
    flex: 1,
  },
  footerSection: {
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing['2xl'],
  },
  footerText: {
    ...components.typography.body.medium,
    color: colors.textSecondary,
  },
}); 