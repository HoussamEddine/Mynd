import React from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown
} from 'react-native-reanimated';

interface ReanimatedScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animation?: 'fade' | 'slide' | 'none';
  duration?: number;
  delay?: number;
}

export const ReanimatedScreen: React.FC<ReanimatedScreenProps> = ({
  children,
  style,
  animation = 'fade',
  duration = 300,
  delay = 0
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  React.useEffect(() => {
    if (animation === 'fade') {
      opacity.value = withTiming(1, { duration, delay });
    } else if (animation === 'slide') {
      translateY.value = withTiming(0, { duration, delay });
      opacity.value = withTiming(1, { duration, delay });
    }
  }, [animation, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    if (animation === 'fade') {
      return {
        opacity: opacity.value,
      };
    } else if (animation === 'slide') {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
      };
    }
    return {};
  });

  if (animation === 'none') {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View 
      style={[style, animatedStyle]}
      entering={animation === 'fade' ? FadeIn.delay(delay).duration(duration) : SlideInUp.delay(delay).duration(duration)}
      exiting={animation === 'fade' ? FadeOut.duration(duration) : SlideOutDown.duration(duration)}
    >
      {children}
    </Animated.View>
  );
};


