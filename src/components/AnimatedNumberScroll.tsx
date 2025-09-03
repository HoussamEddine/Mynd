import React, { useEffect } from 'react';
import { StyleSheet, View, StyleProp, TextStyle, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface AnimatedNumberScrollProps {
  targetValue: number;
  slotHeight: number;
  textStyle: StyleProp<TextStyle>;
  duration?: number;
  delay?: number;
}

export const AnimatedNumberScroll: React.FC<AnimatedNumberScrollProps> = ({
  targetValue,
  slotHeight,
  textStyle,
  duration = 1000, // Default duration
  delay = 0, // Default delay
}) => {
  const animatedCount = useSharedValue(0);

  useEffect(() => {
    animatedCount.value = 0; // Reset before animation
    animatedCount.value = withDelay(delay, withTiming(targetValue, {
      duration: duration,
      easing: Easing.out(Easing.cubic),
    }));
  }, [targetValue, duration, delay, animatedCount]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -animatedCount.value * slotHeight }],
    };
  });

  // Ensure targetValue is non-negative for Array.from length
  const safeTargetValue = Math.max(0, Math.floor(targetValue)); 

  return (
    <View style={[styles.numberScrollContainer, { height: slotHeight }]}>
      <Animated.View style={animatedStyle}>
        {Array.from({ length: safeTargetValue + 1 }).map((_, i) => (
          <Text key={i} style={[textStyle, { height: slotHeight, lineHeight: slotHeight }]}>
            {i}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  numberScrollContainer: {
    overflow: 'hidden',
    justifyContent: 'flex-start', 
  },
});

export default AnimatedNumberScroll; 