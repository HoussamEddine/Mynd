import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, ScreenWrapper } from '../constants';
import { Text } from '../components/base/Text';
import { authService } from '../services/authService';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';

const { foundations, components, utils } = theme;
const { colors, spacing } = foundations;
const { width, height } = Dimensions.get('window');

interface EmailConfirmationScreenProps {
  email: string;
  source: 'signin' | 'signup'; // Track which screen we came from
  onEmailConfirmed: () => void;
  onBack: () => void;
  onBackWithEmail: (email: string) => void; // New callback to go back with email preserved
  onResendEmail: () => void;
}

export default function EmailConfirmationScreen({ 
  email,
  source,
  onEmailConfirmed,
  onBack,
  onBackWithEmail,
  onResendEmail,
}: EmailConfirmationScreenProps) {
  const { showNotification } = useNotification();
  const [isResending, setIsResending] = useState(false);
  const [isCheckingConfirmation, setIsCheckingConfirmation] = useState(false);

  // Auto-check confirmation status every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!error && session?.user?.email_confirmed_at && session.user.email === email) {
          onEmailConfirmed();
        }
      } catch (error) {
        // Silent fail for auto-check
      }
    }, 60000); // 60 seconds

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onEmailConfirmed, email]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const result = await authService.resendVerificationEmail(email);
      if (result.error) {
        showNotification('Failed to resend verification email. Please try again.', 'error');
      } else {
        showNotification('Verification email sent!', 'success');
      }
    } catch (error) {
      showNotification('Failed to resend verification email. Please try again.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckConfirmation = async () => {
    console.log('[EMAIL_CONFIRMATION] Starting confirmation check for email:', email);
    setIsCheckingConfirmation(true);
    try {
      // Check if user exists and email is confirmed
      const { exists: existsInDB, isConfirmed, error: dbError } = await authService.checkExistingUser(email);
      console.log('[EMAIL_CONFIRMATION] Database check result:', { existsInDB, isConfirmed, dbError });
      
      if (dbError) {
        console.log('[EMAIL_CONFIRMATION] Database error:', dbError);
        showNotification('Unable to verify confirmation status. Please try again.', 'error');
        return;
      }

      if (!existsInDB) {
        console.log('[EMAIL_CONFIRMATION] User not found in database');
        showNotification('Account not found. Please sign up first.', 'error');
        return;
      }

      if (!isConfirmed) {
        console.log('[EMAIL_CONFIRMATION] Email not confirmed yet');
        showNotification('Email not yet confirmed. Please check your inbox and click the confirmation link.', 'info');
        return;
      }

      // Email is confirmed - now automatically sign in the user
      console.log('[EMAIL_CONFIRMATION] Email confirmed! Attempting automatic sign-in...');
      
      // For production apps, we need to get the user's password to create a valid session
      // Since we can't store passwords securely, we'll redirect to a password input screen
      // This is the standard approach used by apps like Gmail, Slack, etc.
      
      // Store the confirmed email so the sign-in screen can pre-fill it
      await AsyncStorage.setItem('@confirmed_email', email);
      
      // Show success message and redirect to sign-in
      showNotification('Email confirmed! Redirecting to sign in...', 'success');
      
      // Call onEmailConfirmed which will redirect to sign-in
      onEmailConfirmed();
      
    } catch (error) {
      console.log('[EMAIL_CONFIRMATION] Unexpected error:', error);
      showNotification('Unable to verify confirmation. Please try again.', 'error');
    } finally {
      setIsCheckingConfirmation(false);
    }
  };

  // Add a function to handle resending email for unconfirmed users
  const handleResendForUnconfirmed = async () => {
    setIsResending(true);
    try {
      const result = await authService.resendVerificationEmail(email);
      if (result.error) {
        showNotification('Failed to resend verification email. Please try again.', 'error');
      } else {
        showNotification('Verification email sent! Please check your inbox.', 'success');
      }
    } catch (error) {
      showNotification('Failed to resend verification email. Please try again.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScreenWrapper contentStyle={styles.content}>
      {/* Main Content */}
      <Animated.View entering={FadeInUp.delay(500)} style={styles.mainContent}>
        <View style={styles.iconContainer}>
          <LottieView
            source={require('../../assets/animations/email.lottie')}
            style={styles.lottieAnimation}
            autoPlay
            loop
            // Recolor only the blue layers to match app primary
            // Keypaths use wildcards to target layers commonly named "Blue" in AE exports
            {...({
              colorFilters: [
                { keypath: 'Blue', color: foundations.colors.primary },
                { keypath: '**.Blue', color: foundations.colors.primary },
                { keypath: 'blue', color: foundations.colors.primary },
                { keypath: '**.blue', color: foundations.colors.primary },
              ],
            } as any)}
          />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.description}>
            We've sent a confirmation link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
            
          </Text>
          <Pressable
            style={({ pressed }) => [
              { 
                alignSelf: 'center', 
                marginBottom: spacing.md,
                paddingHorizontal: spacing.xs,
                paddingVertical: spacing.xs,
                flexDirection: 'row', 
                alignItems: 'center', 
                minHeight: 24 
              },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => onBackWithEmail(email)}
          >
            <Feather name="arrow-left" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>Choose another email</Text>
          </Pressable>
          <Text style={styles.subDescription}>
            Click the confirmation link in your email to verify your account. Once confirmed, you can return here and continue.
          </Text>
          
         
        </View>

        <View style={styles.buttonSection}>
          <Pressable 
            style={({ pressed }) => [
              utils.createButtonStyle('primary', 'lg'),
              pressed && components.button.states.pressed,
              isCheckingConfirmation && { opacity: 0.5 }
            ]} 
            onPress={handleCheckConfirmation}
            disabled={isCheckingConfirmation}
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
              {isCheckingConfirmation ? 'Checking...' : "I've Confirmed My Email"}
            </Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              utils.createButtonStyle('secondary', 'lg'),
              pressed && components.button.states.pressed,
              styles.resendButton
            ]} 
            onPress={handleResendEmail}
            disabled={isResending}
          >
            <Text style={[
              components.button.typography.lg,
              { color: foundations.colors.primary }
            ]}>
              {isResending ? 'Sending...' : 'Resend Email'}
            </Text>
          </Pressable>

          {/* Test button for development - remove in production */}
          {__DEV__ && (
            <Pressable 
              style={({ pressed }) => [
                utils.createButtonStyle('secondary', 'lg'),
                pressed && components.button.states.pressed,
                styles.testButton
              ]} 
              onPress={async () => {
                try {
                  // For testing: manually confirm email in database
                  const { data, error } = await supabase
                    .from('users')
                    .update({ 
                      email_confirmed_at: new Date().toISOString(),
                      is_email_confirmed: true 
                    })
                    .eq('email', email)
                    .select();
                  
                  if (error) {
                    console.log('[TEST] Database update error:', error);
                    showNotification('Test confirmation failed. Check console for details.', 'error');
                  } else {
                    console.log('[TEST] Email manually confirmed for testing');
                    showNotification('Test: Email manually confirmed! Click "I\'ve Confirmed My Email" to continue.', 'success');
                  }
                } catch (testError) {
                  console.log('[TEST] Test confirmation error:', testError);
                  showNotification('Test confirmation failed. Check console for details.', 'error');
                }
              }}
            >
              <Text style={[
                components.button.typography.lg,
                { color: foundations.colors.warning || '#FF9500' }
              ]}>
                🧪 Test: Confirm Email
              </Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: foundations.spacing.xl,
    paddingTop: foundations.spacing['4xl'],
    paddingBottom: foundations.spacing['3xl'],
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: foundations.spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: foundations.spacing['4xl'],
    paddingHorizontal: foundations.spacing.lg,
  },
  title: {
    ...components.typography.display.small,
    textAlign: 'center',
    marginBottom: foundations.spacing.lg,
  },
  description: {
    ...components.typography.body.large,
    textAlign: 'center',
    color: foundations.colors.textSecondary,
    marginBottom: foundations.spacing.xs,
  },
  emailText: {
    color: foundations.colors.primary,
    fontFamily: theme.foundations.fonts.families.semiBold,
  },
  subDescription: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    textAlign: 'center',
    color: foundations.colors.textPrimary,
    paddingHorizontal: foundations.spacing.lg,
    lineHeight: theme.foundations.fonts.sizes.base * 1.4,
    letterSpacing: 0.2,
  },
  buttonSection: {
    width: '100%',
    gap: foundations.spacing.lg,
    alignItems: 'center',
  },
  resendButton: {
    marginTop: foundations.spacing.sm,
  },
  testButton: {
    marginTop: foundations.spacing.sm,
    backgroundColor: foundations.colors.warning || '#FF9500',
  },
}); 