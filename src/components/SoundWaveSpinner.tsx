import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';

interface SoundWaveSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: any;
}

export default function SoundWaveSpinner({ 
  size = 'medium', 
  color = '#a78bfa',
  style 
}: SoundWaveSpinnerProps) {
  const animation = useSharedValue(0);

  const sizeConfig = {
    small: { height: 16, width: 24, barWidth: 2, gap: 2 },
    medium: { height: 24, width: 36, barWidth: 3, gap: 3 },
    large: { height: 32, width: 48, barWidth: 4, gap: 4 },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    animation.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const createBarStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const delay = index * 150;
      const animationValue = (animation.value * 1200 - delay) / 1200;
      const normalizedValue = Math.max(0, Math.min(1, animationValue));
      
      const height = interpolate(
        normalizedValue,
        [0, 0.5, 1],
        [config.height * 0.2, config.height, config.height * 0.2]
      );

      const opacity = interpolate(
        normalizedValue,
        [0, 0.2, 0.8, 1],
        [0.3, 1, 1, 0.3]
      );

      return {
        height,
        opacity,
        transform: [
          {
            scaleY: interpolate(
              normalizedValue,
              [0, 0.5, 1],
              [0.3, 1, 0.3]
            ),
          },
        ],
      };
    });
  };

  const bars = Array.from({ length: 5 }, (_, index) => (
    <Animated.View
      key={index}
      style={[
        styles.bar,
        {
          width: config.barWidth,
          backgroundColor: color,
          marginHorizontal: config.gap / 2,
        },
        createBarStyle(index),
      ]}
    />
  ));

  return (
    <View style={[styles.container, { width: config.width }, style]}>
      {bars}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 2,
    minHeight: 4,
  },
}); 