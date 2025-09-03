import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Platform,
  TextInput,
  Dimensions,
  Alert,
  Keyboard,
} from 'react-native';
import Animated, { 
  FadeInUp,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme, ScreenWrapper } from '../constants';
import { Text } from '../components/base/Text';
import SocialAuthButton from '../components/SocialAuthButton';
import { authService, type AuthUser } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceFingerprint, createRateLimiter, validatePasswordSimple } from '../services/securityService';
import { useNotification } from '../components/NotificationProvider';
import SoundWaveSpinner from '../components/SoundWaveSpinner';

const { foundations, components, utils } = theme;
const { colors, spacing } = foundations;
const { width } = Dimensions.get('window');

const FIRST_TIME_USER_KEY = '@first_time_user';
const socialAuthLimiter = createRateLimiter(5, 15 * 60 * 1000);

interface SignInScreenProps {
  onComplete: (user: AuthUser) => void;
  onShowSignup: () => void;
}

export default function SignInScreen({ 
  onComplete,
  onShowSignup,
}: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<{ email: boolean; password: boolean; google: boolean; apple: boolean }>({
    email: false,
    password: false,
    google: false,
    apple: false,
  });
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const { showNotification } = useNotification();
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      showNotification('Please enter your email address', 'error');
      return;
    }
    setLoading({ email: true, password: false, google: false, apple: false });
    try {
      // Check if email exists in user database
      const { exists: existsInDB, providers, error: dbError } = await authService.checkExistingUser(email.trim());
      if (dbError) {
        showNotification('Unable to verify email. Please try again.', 'error');
        return;
      }
      if (existsInDB) {
        if (providers.includes('email')) {
          setIsEmailVerified(true);
          return;
        } else if (providers.length > 0) {
          if (providers.includes('google') && providers.includes('apple')) {
            showNotification('This email is registered with Google and Apple. Please use either social sign-in button below.', 'error');
          } else if (providers.includes('google')) {
            showNotification('This email is registered with Google. Please use "Sign in with Google" below.', 'error');
          } else if (providers.includes('apple')) {
            showNotification('This email is registered with Apple. Please use "Sign in with Apple" below.', 'error');
          } else {
            const authMethods = providers.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' or ');
            showNotification(`This email is registered with ${authMethods}. Please use the ${authMethods} sign in button below.`, 'error');
          }
          return;
        }
      }
      showNotification('No account found with this email. Please sign up first.', 'error');
    } catch (error) {
      showNotification('Unable to verify email. Please try again.', 'error');
    } finally {
      setLoading({ email: false, password: false, google: false, apple: false });
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      showNotification('Please enter your password', 'error');
      return;
    }
    const validation = validatePasswordSimple(password.trim());
    if (!validation.isValid) {
      showNotification('Invalid email or password', 'error');
      return;
    }
    setLoading({ email: false, password: true, google: false, apple: false });
    try {
      const result = await authService.signIn({
        email: email.trim(),
        password: password.trim()
      });
      if (result.error) {
        showNotification(result.error, 'error');
      } else if (result.user) {
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'true');
        onComplete(result.user);
      }
    } catch (error) {
      showNotification('Sign in failed. Please try again.', 'error');
    } finally {
      setLoading({ email: false, password: false, google: false, apple: false });
    }
  };

  const handleBackToEmail = () => {
    setIsEmailVerified(false);
    setPassword('');
  };

  const handleGoogleAuth = async () => {
    if (loading.google) return;
    const deviceFingerprint = await getDeviceFingerprint();
    if (!socialAuthLimiter.checkLimit(deviceFingerprint)) {
      const remainingTime = Math.ceil(socialAuthLimiter.getRemainingTime(deviceFingerprint) / 1000 / 60);
      Alert.alert('Too Many Attempts', `Please wait ${remainingTime} minutes before trying again.`);
      return;
    }
    setLoading({ email: false, password: false, google: true, apple: false });
    try {
      const result = await authService.signInWithGoogle();
      if (result.error) {
        if (result.error === 'cancelled') return;
        Alert.alert('Google Sign In Failed', result.error);
      } else if (result.user) {
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'true');
        onComplete(result.user);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect to Google. Please try again.');
    } finally {
      setLoading({ email: false, password: false, google: false, apple: false });
    }
  };

  const handleAppleAuth = async () => {
    if (loading.apple) return;
    const deviceFingerprint = await getDeviceFingerprint();
    if (!socialAuthLimiter.checkLimit(deviceFingerprint)) {
      const remainingTime = Math.ceil(socialAuthLimiter.getRemainingTime(deviceFingerprint) / 1000 / 60);
      Alert.alert('Too Many Attempts', `Please wait ${remainingTime} minutes before trying again.`);
      return;
    }
    setLoading({ email: false, password: false, google: false, apple: true });
    try {
      const result = await authService.signInWithApple();
      if (result.error) {
        if (result.error === 'cancelled') return;
        Alert.alert('Apple Sign In Failed', result.error);
      } else if (result.user) {
        await AsyncStorage.setItem(FIRST_TIME_USER_KEY, 'true');
        onComplete(result.user);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect to Apple Sign-in. Please try again.');
    } finally {
      setLoading({ email: false, password: false, google: false, apple: false });
    }
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
          <Text style={styles.title}>Welcome Back to Mynd</Text>
          <Text style={styles.description}>
            Continue your wellness journey.
          </Text>
        </View>

          {/* Input Section */}
        <View style={styles.inputSection}>
            {!isEmailVerified ? (
              // Email Input
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
                  editable={!loading.email && !loading.password && !loading.google && !loading.apple}
                  textAlignVertical="center"
                  underlineColorAndroid="transparent"
            />
            <Pressable 
              style={({ pressed }) => [
                    styles.arrowButtonStylish,
                    pressed && styles.arrowButtonPressedStylish,
                    loading.email && styles.arrowButtonDisabled
              ]}
              onPress={handleEmailSubmit}
                  disabled={loading.email || loading.password || loading.google || loading.apple}
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
              // Password Input (same as email input, no left arrow)
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
                    editable={!loading.password && !loading.email && !loading.google && !loading.apple}
                    textAlignVertical="center"
                    underlineColorAndroid="transparent"
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.arrowButtonStylish,
                      pressed && styles.arrowButtonPressedStylish,
                      loading.password && styles.arrowButtonDisabled
                    ]}
                    onPress={handlePasswordSubmit}
                    disabled={loading.password || loading.email || loading.google || loading.apple}
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
                    { alignSelf: 'flex-end', marginTop: 8, marginRight: 4 },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => {/* TODO: Implement forgot password flow */}}
                >
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>Forgot password?</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    { alignSelf: 'flex-end', marginTop: 4, marginRight: 4, flexDirection: 'row', alignItems: 'center' },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={handleBackToEmail}
                >
                  <Feather name="arrow-left" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>Choose another email</Text>
            </Pressable>
              </>
            )}
        </View>

        {/* Social Buttons */}
        <View style={styles.socialButtonsSection}>
            {isEmailVerified ? (
              <View style={{ height: 72, width: '100%' }} />
            ) : (
              <>
          <SocialAuthButton
            provider="google"
            onPress={handleGoogleAuth}
                  isLoading={loading.google}
            buttonText="Sign in with Google"
          />
          {Platform.OS === 'ios' && (
            <SocialAuthButton
              provider="apple"
              onPress={handleAppleAuth}
                    isLoading={loading.apple}
              buttonText="Sign in with Apple"
            />
                )}
              </>
          )}
        </View>
      </Animated.View>

      {/* Footer Section */}
      <Animated.View entering={SlideInRight.delay(700)} style={styles.footerSection}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Pressable 
          style={({ pressed }) => [
            utils.createButtonStyle('primary', 'lg', {
              width: '100%',
              maxWidth: 320,
            }),
            pressed && components.button.states.pressed
          ]} 
          onPress={onShowSignup}
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
            Sign Up
          </Text>
        </Pressable>
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
  inputSection: {
    width: '100%',
    maxWidth: 320,
    marginBottom: spacing['3xl'],
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
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: spacing.xl,
    ...components.typography.body.large,
    color: colors.textPrimary,
  },
  inputSmall: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    letterSpacing: 0.2,
    backgroundColor: 'transparent',
    textAlignVertical: 'center',
    paddingRight: 10,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  arrowButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  arrowButtonDisabled: {
    opacity: 0.5,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonsSection: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.lg,
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
    alignItems: 'center'
  },
  arrowButtonGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonPressedStylish: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
}); 