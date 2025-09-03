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
import { useNotification } from '../contexts/NotificationContext';
import SoundWaveSpinner from '../components/SoundWaveSpinner';
import SocialAuthButton from '../components/SocialAuthButton';

const { foundations, components, utils } = theme;
const { colors, spacing } = foundations;
const { width, height } = Dimensions.get('window');

// Rate limiter for signup attempts (3 attempts per 15 minutes)
const signupRateLimiter = createRateLimiter(3, 15 * 60 * 1000);

interface EmailSignupScreenProps {
  onComplete: (user: AuthUser) => void;
  onShowSignIn: () => void;
  onBack: () => void;
  onEmailConfirmationRequired: (email: string) => void;
}

export default function EmailSignupScreen({ 
  onComplete,
  onShowSignIn,
  onBack,
  onEmailConfirmationRequired,
}: EmailSignupScreenProps) {
  const { showNotification } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordConditions, setPasswordConditions] = useState({
    minLength: false,
    hasNumber: false,
  });

  const handleEmailSubmit = async () => {
    // Clear any previous errors
    setShowPasswordInput(false);

    // Case 1: Empty email
    if (!email.trim()) {
      showNotification('Please enter your email address', 'error');
      return;
    }

    // Case 2: Basic email format check (client-side)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showNotification('Please enter a valid email address (e.g., user@example.com)', 'error');
      return;
    }

    // Case 3: Allow proceeding to password input
    // We'll handle existing users during the actual signup process
    setShowPasswordInput(true);
  };

  const handlePasswordSubmit = async () => {
    // Case 1: Empty password
    if (!password.trim()) {
      showNotification('Please enter your password', 'error');
      return;
    }

    // Case 2: Password validation
    const validation = validatePasswordSimple(password.trim());
    if (!validation.isValid) {
      showNotification(validation.error || 'Password must be at least 8 characters with at least one number', 'error');
      return;
    }

    setLoading({ email: false, password: true });
    
    try {
      const result = await authService.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (result.error) {
        // Case 3: Email confirmation required
        if (result.error === 'EMAIL_CONFIRMATION_REQUIRED') {
          setPassword(''); // Clear password
          onEmailConfirmationRequired(email.trim());
          return;
        }

        // Case 4: Email not confirmed - user exists but needs to confirm email
        if (result.error === 'EMAIL_NOT_CONFIRMED') {
          setPassword(''); // Clear password
          onEmailConfirmationRequired(email.trim());
          return;
        }

        // Case 5: User already exists (shouldn't happen but handle anyway)
        if (result.error.includes('already registered') || result.error.includes('already exists')) {
          showNotification('This email is already registered. Please sign in instead.', 'info');
          setShowPasswordInput(false);
          return;
        }

        // Case 5: Invalid email format (server-side validation)
        if (result.error.includes('Invalid') || result.error.includes('valid')) {
          showNotification('Please enter a valid email address', 'error');
          setShowPasswordInput(false);
          return;
        }

        // Case 6: Password too weak
        if (result.error.includes('password') || result.error.includes('Password')) {
          showNotification('Password must be at least 8 characters with at least one number', 'error');
          return;
        }

        // Case 7: Rate limiting
        if (result.error.includes('Too many') || result.error.includes('rate limit')) {
          showNotification('Too many attempts. Please wait a moment and try again.', 'error');
          return;
        }

        // Case 8: Network/connection error
        if (result.error.includes('Failed to') || result.error.includes('Unable to')) {
          showNotification('Unable to create account. Please check your connection and try again.', 'error');
          return;
        }

        // Case 9: Generic error
        showNotification(result.error || 'Unable to create account. Please try again.', 'error');
        return;
      }

      // Case 10: Success
      if (result.user) {
        await AsyncStorage.setItem('@first_time_user', 'true');
        setPassword(''); // Clear password
        onComplete(result.user);
      }
    } catch (error) {
      // Case 11: Unexpected error
      showNotification('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading({ email: false, password: false });
    }
  };

  const handleBackToEmail = () => {
    setShowPasswordInput(false);
    setPassword('');
  };

  const checkPasswordConditions = (password: string) => {
    setPasswordConditions({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
    });
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
              <>
                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    emailFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={emailFocused ? colors.primary : colors.primary} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      key="email"
                      style={styles.textInput}
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor={colors.textSecondary}
                      editable={!loading.email && !loading.password}
                      textAlignVertical="center"
                      underlineColorAndroid="transparent"
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      selectionColor={colors.primary}
                    />
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <Pressable 
                    style={({ pressed }) => [
                      utils.createButtonStyle('primary', 'lg'),
                      pressed && components.button.states.pressed,
                      loading.email && { opacity: 0.5 }
                    ]}
                    onPress={handleEmailSubmit}
                    disabled={loading.email || loading.password}
                  >
                    <LinearGradient
                      colors={[...foundations.gradients.primaryButton.colors]}
                      start={foundations.gradients.primaryButton.start}
                      end={foundations.gradients.primaryButton.end}
                      style={StyleSheet.absoluteFill}
                    />
                    {loading.email ? (
                      <SoundWaveSpinner size="small" color="#fff" />
                    ) : (
                      <Text style={[
                        components.button.typography.lg,
                        { color: foundations.colors.textLight }
                      ]}>
                        Continue
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    passwordFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={passwordFocused ? colors.primary : colors.primary} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      key="password"
                      style={styles.textInput}
                      placeholder="Password"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        checkPasswordConditions(text);
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      placeholderTextColor={colors.textSecondary}
                      editable={!loading.password && !loading.email}
                      textAlignVertical="center"
                      underlineColorAndroid="transparent"
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      selectionColor={colors.primary}
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.eyeIcon}
                      hitSlop={8}
                    >
                      <Feather
                        name={showPassword ? 'eye' : 'eye-off'}
                        size={20}
                        color={passwordFocused ? colors.primary : colors.primary}
                      />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <Pressable
                    style={({ pressed }) => [
                      utils.createButtonStyle('primary', 'lg'),
                      pressed && components.button.states.pressed,
                      loading.password && { opacity: 0.5 }
                    ]}
                    onPress={handlePasswordSubmit}
                    disabled={loading.password || loading.email}
                  >
                    <LinearGradient
                      colors={[...foundations.gradients.primaryButton.colors]}
                      start={foundations.gradients.primaryButton.start}
                      end={foundations.gradients.primaryButton.end}
                      style={StyleSheet.absoluteFill}
                    />
                    {loading.password ? (
                      <SoundWaveSpinner size="small" color="#fff" />
                    ) : (
                      <Text style={[
                        components.button.typography.lg,
                        { color: foundations.colors.textLight }
                      ]}>
                        Sign Up
                      </Text>
                    )}
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    { alignSelf: 'flex-end', marginTop: spacing.md, marginRight: 4, flexDirection: 'row', alignItems: 'center', minHeight: 24 },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={handleBackToEmail}
                >
                  <Feather name="arrow-left" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>Choose another email</Text>
                </Pressable>

                {/* Password Conditions */}
                <View style={styles.passwordConditionsContainer}>
                  <Text style={styles.passwordConditionsTitle}>Password requirements:</Text>
                  <View style={styles.conditionRow}>
                    <Ionicons 
                      name={passwordConditions.minLength ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={passwordConditions.minLength ? colors.success : colors.textMuted} 
                    />
                    <Text style={[
                      styles.conditionText,
                      { color: passwordConditions.minLength ? colors.textPrimary : colors.textMuted }
                    ]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.conditionRow}>
                    <Ionicons 
                      name={passwordConditions.hasNumber ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={passwordConditions.hasNumber ? colors.success : colors.textMuted} 
                    />
                    <Text style={[
                      styles.conditionText,
                      { color: passwordConditions.hasNumber ? colors.textPrimary : colors.textMuted }
                    ]}>
                      At least one number
                    </Text>
                  </View>
                </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable 
                style={({ pressed }) => [
                  styles.textButton,
                  pressed && { opacity: 0.7 },
                ]} 
                onPress={onShowSignIn}
              >
                <Text style={styles.textButtonText}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    justifyContent: 'flex-start',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  logo: {
    width: spacing['8xl'],
    height: spacing['8xl'],
    tintColor: colors.primary,
    marginBottom: spacing.lg,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 0,
    width: '100%',
  },
  textSection: {
    alignItems: 'center',
    maxWidth: width * 0.9,
    marginBottom: 0,
  },
  title: {
    ...components.typography.display.large,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -1,
    color: colors.textPrimary,
  },
  description: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    textAlign: 'center',
    color: foundations.colors.textPrimary,
    paddingHorizontal: foundations.spacing.lg,
    lineHeight: theme.foundations.fonts.sizes.base * 1.4,
    letterSpacing: 0.2,
    marginBottom: spacing.xl,
  },
  formSection: {
    width: '100%',
    maxWidth: 320,
    marginBottom: spacing['3xl'],
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: foundations.radii.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
    ...foundations.shadows.sm,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    borderWidth: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing['2xl'],
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 10,
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

  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 'auto',
  },
  textButtonText: {
    color: theme.foundations.colors.primary,
    fontSize: theme.foundations.fonts.sizes.lg,
    fontWeight: '600',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  passwordConditionsContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  passwordConditionsTitle: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conditionText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.regular,
    marginLeft: spacing.xs,
  },
}); 