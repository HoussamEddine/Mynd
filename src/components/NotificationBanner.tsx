import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Dimensions, Animated, Platform } from 'react-native';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');
const { colors, spacing } = theme.foundations;

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

export interface NotificationBannerProps {
  message: string;
  type?: NotificationType;
  visible: boolean;
  onHide?: () => void;
  top?: number;
}

export function NotificationBanner({ message, visible, onHide, top = 60 }: NotificationBannerProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(opacity, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.spring(opacity, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start(() => {
            if (onHide) onHide();
          });
        }, 7000);
      });
    }
  }, [visible, onHide]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          top,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    width: width - 40,
    marginHorizontal: 20,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    zIndex: 99999,
    borderRadius: theme.foundations.radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  text: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    textAlign: 'center',
    lineHeight: theme.foundations.fonts.sizes.base * 1.4,
    letterSpacing: 0.2,
  },
}); 