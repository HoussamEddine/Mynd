import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Text } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary';
}

export function PrimaryButton({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false, 
  style, 
  textStyle,
  variant = 'primary'
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  
  return (
    <Pressable
      style={[
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        isDisabled && styles.disabledButton,
        loading && styles.loadingButton,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text 
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.secondaryButtonText,
            isDisabled && styles.disabledButtonText,
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a78bfa',
    borderRadius: 20,
    paddingVertical: 20,
    height: 68,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#a78bfa',
    shadowOpacity: 0.1,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loadingButton: {
    backgroundColor: '#8b5cf6',
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    color: '#a78bfa',
  },
  disabledButtonText: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
}); 