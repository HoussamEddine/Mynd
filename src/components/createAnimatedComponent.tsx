import React from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

export interface AnimatedComponentProps {
  children?: React.ReactNode;
  style?: ViewStyle | TextStyle | ImageStyle;
  animated?: boolean;
  animationType?: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'pulse' | 'shake';
  duration?: number;
  delay?: number;
  loop?: boolean;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

export interface AnimatedStyleConfig {
  initial: ViewStyle | TextStyle | ImageStyle;
  animated: ViewStyle | TextStyle | ImageStyle;
  transition: {
    duration: number;
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  };
}

export const createAnimatedComponent = <P extends AnimatedComponentProps>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const {
      animated = true,
      animationType = 'fade',
      duration = 300,
      delay = 0,
      loop = false,
      onAnimationStart,
      onAnimationEnd,
      style,
      ...restProps
    } = props;

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);
    const scale = useSharedValue(0.8);
    const rotate = useSharedValue(0);

    React.useEffect(() => {
      if (!animated) return;

      const startAnimation = () => {
        onAnimationStart?.();
        
        switch (animationType) {
          case 'fade':
            opacity.value = withTiming(1, { duration, delay });
            break;
          case 'slide':
            translateY.value = withTiming(0, { duration, delay });
            opacity.value = withTiming(1, { duration, delay });
            break;
          case 'scale':
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
            opacity.value = withTiming(1, { duration, delay });
            break;
          case 'rotate':
            rotate.value = withTiming(360, { duration: duration * 2, delay });
            opacity.value = withTiming(1, { duration, delay });
            break;
          case 'bounce':
            scale.value = withSequence(
              withSpring(1.2, { damping: 8, stiffness: 200 }),
              withSpring(1, { damping: 15, stiffness: 150 })
            );
            opacity.value = withTiming(1, { duration, delay });
            break;
          case 'pulse':
            if (loop) {
              scale.value = withRepeat(
                withSequence(
                  withTiming(1.1, { duration: duration / 2 }),
                  withTiming(1, { duration: duration / 2 })
                ),
                -1,
                true
              );
            } else {
              scale.value = withSequence(
                withTiming(1.1, { duration: duration / 2 }),
                withTiming(1, { duration: duration / 2 })
              );
            }
            opacity.value = withTiming(1, { duration, delay });
            break;
          case 'shake':
            if (loop) {
              translateY.value = withRepeat(
                withSequence(
                  withTiming(-5, { duration: 100 }),
                  withTiming(5, { duration: 100 }),
                  withTiming(-5, { duration: 100 }),
                  withTiming(0, { duration: 100 })
                ),
                -1,
                true
              );
            } else {
              translateY.value = withSequence(
                withTiming(-5, { duration: 100 }),
                withTiming(5, { duration: 100 }),
                withTiming(-5, { duration: 100 }),
                withTiming(0, { duration: 100 })
              );
            }
            opacity.value = withTiming(1, { duration, delay });
            break;
        }
      };

      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    }, [animated, animationType, duration, delay, loop, onAnimationStart]);

    const animatedStyle = useAnimatedStyle(() => {
      const baseStyle: any = { opacity: opacity.value };

      switch (animationType) {
        case 'slide':
          baseStyle.transform = [{ translateY: translateY.value }];
          break;
        case 'scale':
          baseStyle.transform = [{ scale: scale.value }];
          break;
        case 'rotate':
          baseStyle.transform = [{ rotate: `${rotate.value}deg` }];
          break;
        case 'bounce':
        case 'pulse':
          baseStyle.transform = [{ scale: scale.value }];
          break;
        case 'shake':
          baseStyle.transform = [{ translateY: translateY.value }];
          break;
      }

      return baseStyle;
    }, [animationType]);

    const handleAnimationEnd = React.useCallback(() => {
      onAnimationEnd?.();
    }, [onAnimationEnd]);

    React.useEffect(() => {
      if (opacity.value === 1 && !loop) {
        const timer = setTimeout(handleAnimationEnd, duration);
        return () => clearTimeout(timer);
      }
    }, [opacity.value, loop, duration, handleAnimationEnd]);

    if (!animated) {
      return <Component ref={ref} style={style} {...(restProps as P)} />;
    }

    return (
      <Animated.View style={[style, animatedStyle]}>
        <Component ref={ref} {...(restProps as P)} />
      </Animated.View>
    );
  });
};

export const useAnimatedValue = (initialValue: number = 0) => {
  return useSharedValue(initialValue);
};

export const useAnimatedStyle = (styleFactory: () => ViewStyle | TextStyle | ImageStyle) => {
  return useAnimatedStyle(styleFactory);
};

export default createAnimatedComponent;


