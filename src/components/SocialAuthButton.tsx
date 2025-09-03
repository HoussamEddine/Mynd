import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { Text } from './base/Text';
import SoundWaveSpinner from './SoundWaveSpinner';

const { foundations, components } = theme;
const { colors, spacing } = foundations;

interface SocialAuthButtonProps {
  provider: 'google' | 'apple' | 'email';
  onPress: () => void;
  isLoading?: boolean;
  buttonText?: string;
}

export default function SocialAuthButton({ 
  provider, 
  onPress,
  isLoading = false,
  buttonText
}: SocialAuthButtonProps) {
  const getIcon = () => {
    switch (provider) {
      case 'google':
        return <AntDesign name="google" size={22} color={colors.primary} />;
      case 'apple':
        return <AntDesign name="apple1" size={24} color={colors.primary} />;
      case 'email':
        return <Feather name="mail" size={22} color={colors.primary} />;
    }
  };

  const getText = () => {
    if (buttonText) return buttonText;
    return `Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`;
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.socialButton,
        pressed && styles.socialButtonPressed,
        isLoading && styles.buttonDisabled
      ]} 
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 56 }}>
          <SoundWaveSpinner size="medium" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.socialButtonContent}>
          <View style={styles.iconWrapper}>
            {getIcon()}
          </View>
          <Text style={styles.socialButtonText}>{getText()}</Text>
          <Feather name="arrow-right" size={20} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    height: 56,
    borderRadius: foundations.radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    ...foundations.shadows.sm,
  },
  socialButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
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
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    ...components.typography.button.medium,
    fontFamily: foundations.fonts.families.semiBold,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    letterSpacing: 0.2,
  },
}); 