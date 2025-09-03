import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  Dimensions,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { theme, ScreenWrapper } from '../constants';
import { Text } from '../components/base/Text';
import { authService, type AuthUser } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  validateEmail, 
  validatePassword, 
  validatePasswordSimple,
  sanitizeInput,
  createRateLimiter,
  getDeviceFingerprint,
  logSecurityEvent 
} from '../services/securityService';
import { useNotification } from '../components/NotificationProvider';
import SoundWaveSpinner from '../components/SoundWaveSpinner';

const { foundations, components, utils } = theme;
const { colors, spacing } = foundations;
const { width, height } = Dimensions.get('window');

// Rate limiter for signup attempts (3 attempts per 15 minutes)
const signupRateLimiter = createRateLimiter(3, 15 * 60 * 1000);

interface EmailSignupScreenProps {
  onComplete: (user: AuthUser) => void;
  onShowSignIn: () => void;
  onBack: () => void;
}

export default function EmailSignupScreen({ 
  onComplete,
  onShowSignIn,
  onBack,
}: EmailSignupScreenProps) {
  const { showNotification } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      showNotification('Please enter your email address', 'error');
      return;
    }
    setLoading({ email: true, password: false });
    try {
      const { exists: existsInDB, providers, error: dbError } = await authService.checkExistingUser(email.trim());
      if (dbError) {
        showNotification('Unable to verify email. Please try again.', 'error');
        return;
      }
      if (existsInDB) {
        if (providers.includes('google') && providers.includes('apple')) {
          showNotification('This email is registered with Google and Apple. Please use either social sign-in button below.', 'error');
        } else if (providers.includes('google')) {
          showNotification('This email is registered with Google. Please use "Sign in with Google" below.', 'error');
        } else if (providers.includes('apple')) {
          showNotification('This email is registered with Apple. Please use "Sign in with Apple" below.', 'error');
        } else if (providers.includes('email')) {
          showNotification('An account with this email already exists. Please sign in instead.', 'error');
        } else {
          const authMethods = providers.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' or ');
          showNotification(`This email is registered with ${authMethods}. Please use the ${authMethods} sign in button below.`, 'error');
        }
        setShowPasswordInput(false);
        return;
      }
      // If email does NOT exist, allow sign up (show password input)
      setShowPasswordInput(true);
    } catch (error) {
      showNotification('Unable to verify email. Please try again.', 'error');
    } finally {
      setLoading({ email: false, password: false });
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      showNotification('Please enter your password', 'error');
      return;
    }
    // Use simple password validation
    const validation = validatePasswordSimple(password.trim());
    if (!validation.isValid) {
      showNotification(validation.error || 'Invalid password', 'error');
      return;
    }
    setLoading({ email: false, password: true });
    try {
      // Try to sign up (not sign in)
      const result = await authService.signUp({
        email: email.trim(),
        password: password.trim(),
      });
      if (result.error) {
        // Only clear password on success, not on error
        // Filter out 'No account found...' error (should never show on sign up)
        if (result.error.includes('No account found with this email')) {
          // Do not show this error on sign up
          return;
        }
        showNotification(result.error, 'error');
        return;
      } else if (result.user) {
        await AsyncStorage.setItem('@first_time_user', 'true');
        setPassword(''); // Only clear on success
        onComplete(result.user);
      }
    } catch (error) {
      showNotification('Sign up failed. Please try again.', 'error');
    } finally {
      setLoading({ email: false, password: false });
    }
  };

  const handleBackToEmail = () => {
    setShowPasswordInput(false);
    setPassword('');
  };

  return (
    <ScreenWrapper contentStyle={styles.content}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
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
            <Text style={styles.title}>Create Your{`\n`}Account</Text>
            <Text style={styles.description}>
              Join Mynd and start your wellness journey.
            </Text>
          </View>
          <View style={styles.formSection}>
            {!showPasswordInput ? (
              <View style={styles.inputContainer}>
                <TextInput
                  key="email"
                  style={theme.emailInput}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholderTextColor={colors.textMuted}
                  editable={!loading.email && !loading.password}
                  textAlignVertical="center"
                  underlineColorAndroid="transparent"
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.arrowButtonStylish,
                    pressed && styles.arrowButtonPressedStylish,
                    loading.email && styles.buttonDisabled
                  ]}
                  onPress={handleEmailSubmit}
                  disabled={loading.email || loading.password}
                >
                  <LinearGradient
                    colors={[...theme.foundations.gradients.primaryButton.colors]}
                    start={theme.foundations.gradients.primaryButton.start}
                    end={theme.foundations.gradients.primaryButton.end}
                    style={styles.arrowButtonGradient}
                  >
                    {loading.email ? (
                      <SoundWaveSpinner size="small" color="#fff" />
                    ) : (
                      <Feather name="arrow-right" size={22} color="#fff" style={{ alignSelf: 'center' }} />
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={{ marginLeft: 8, marginRight: 4 }}
                    hitSlop={8}
                  >
                    <Feather
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={22}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                  <TextInput
                    key="password"
                    style={theme.passwordInput}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    placeholderTextColor={colors.textMuted}
                    editable={!loading.password && !loading.email}
                    textAlignVertical="center"
                    underlineColorAndroid="transparent"
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.arrowButtonStylish,
                      pressed && styles.arrowButtonPressedStylish,
                      loading.password && styles.buttonDisabled
                    ]}
                    onPress={handlePasswordSubmit}
                    disabled={loading.password || loading.email}
                  >
                    <LinearGradient
                      colors={[...theme.foundations.gradients.primaryButton.colors]}
                      start={theme.foundations.gradients.primaryButton.start}
                      end={theme.foundations.gradients.primaryButton.end}
                      style={styles.arrowButtonGradient}
                    >
                      {loading.password ? (
                        <SoundWaveSpinner size="small" color="#fff" />
                      ) : (
                        <Feather name="arrow-right" size={22} color="#fff" style={{ alignSelf: 'center' }} />
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    { alignSelf: 'flex-end', marginTop: 4, marginRight: 4, flexDirection: 'row', alignItems: 'center', minHeight: 24 },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={handleBackToEmail}
                >
                  <Feather name="arrow-left" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>Choose another email</Text>
                </Pressable>
              </>
            )}
            {/* Always reserve space for the button to prevent layout shift */}
            {!showPasswordInput && (
              <Pressable
                style={{ alignSelf: 'flex-end', marginTop: 4, marginRight: 4, flexDirection: 'row', alignItems: 'center', minHeight: 24, opacity: 0 }}
                pointerEvents="none"
              >
                <Feather name="arrow-left" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>Choose another email</Text>
              </Pressable>
            )}
            <View style={{ height: 80 }} />
          </View>
        </Animated.View>

        {/* Footer Section (fixed, not affected by keyboard) */}
        <Animated.View entering={SlideInRight.delay(700)} style={styles.footerSection}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable 
              style={({ pressed }) => [
                utils.createButtonStyle('primary', 'lg', {
                  width: '100%',
                  maxWidth: 340,
                }),
                pressed && components.button.states.pressed
              ]} 
              onPress={onShowSignIn}
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
          </View>
        </Animated.View>
      </Pressable>
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
    paddingTop: spacing['2xl'],
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
    width: '100%',
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
  formSection: {
    width: '100%',
    maxWidth: 340,
    gap: spacing.xl,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: foundations.radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...foundations.shadows.sm,
    width: '100%',
  },
  input: {
    ...components.input.default,
  },
  passwordInputContainer: {
    ...components.input.passwordContainer,
  },
  passwordInput: {
    ...components.input.password,
  },
  passwordToggle: {
    ...components.input.toggle,
  },
  inputFocused: {
    ...components.input.states.focused,
  },
  inputError: {
    ...components.input.states.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  footerContent: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: spacing.xl,
  },
  footerText: {
    ...components.typography.body.medium,
    color: colors.textSecondary,
  },
  arrowButtonStylish: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#b993f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonPressedStylish: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  arrowButtonGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 