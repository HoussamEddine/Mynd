import React from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

export interface AnimationConfig {
  type: 'timing' | 'spring' | 'repeat' | 'sequence' | 'delay';
  duration?: number;
  delay?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  springConfig?: {
    damping: number;
    stiffness: number;
    mass?: number;
    overshootClamping?: boolean;
    restDisplacementThreshold?: number;
    restSpeedThreshold?: number;
  };
  repeatCount?: number;
  reverse?: boolean;
  animations?: AnimationConfig[];
}

export interface AnimatedValueConfig {
  initial: number;
  target: number;
  animation: AnimationConfig;
}

export interface AnimationBuilderConfig {
  values: Record<string, AnimatedValueConfig>;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onAnimationUpdate?: (progress: number) => void;
}

export const useAnimationBuilder = (config: AnimationBuilderConfig) => {
  const animatedValues = React.useMemo(() => {
    const values: Record<string, any> = {};
    Object.keys(config.values).forEach(key => {
      values[key] = useSharedValue(config.values[key].initial);
    });
    return values;
  }, [config.values]);

  const buildAnimation = React.useCallback((animationConfig: AnimationConfig) => {
    switch (animationConfig.type) {
      case 'timing':
        return withTiming(1, {
          duration: animationConfig.duration || 300,
          easing: animationConfig.easing === 'linear' ? undefined : 
                 animationConfig.easing === 'ease-in' ? undefined :
                 animationConfig.easing === 'ease-out' ? undefined :
                 animationConfig.easing === 'ease-in-out' ? undefined : undefined,
        });
      
      case 'spring':
        return withSpring(1, {
          damping: animationConfig.springConfig?.damping || 15,
          stiffness: animationConfig.springConfig?.stiffness || 150,
          mass: animationConfig.springConfig?.mass || 1,
          overshootClamping: animationConfig.springConfig?.overshootClamping || false,
          restDisplacementThreshold: animationConfig.springConfig?.restDisplacementThreshold || 0.01,
          restSpeedThreshold: animationConfig.springConfig?.restSpeedThreshold || 0.01,
        });
      
      case 'repeat':
        return withRepeat(
          buildAnimation(animationConfig.animations?.[0] || { type: 'timing' }),
          animationConfig.repeatCount || -1,
          animationConfig.reverse || false
        );
      
      case 'sequence':
        if (!animationConfig.animations) return withTiming(1);
        const sequenceAnimations = animationConfig.animations.map(anim => buildAnimation(anim));
        return withSequence(sequenceAnimations[0], sequenceAnimations[1], sequenceAnimations[2]);
      
      case 'delay':
        return withDelay(
          animationConfig.delay || 0,
          buildAnimation(animationConfig.animations?.[0] || { type: 'timing' })
        );
      
      default:
        return withTiming(1);
    }
  }, []);

  const startAnimation = React.useCallback(() => {
    config.onAnimationStart?.();
    
    Object.keys(config.values).forEach(key => {
      const valueConfig = config.values[key];
      const animation = buildAnimation(valueConfig.animation);
      
      // Apply the animation to the target value
      const targetValue = valueConfig.target;
      const initialValue = valueConfig.initial;
      
      // Create a progress-based animation
      const progressAnimation = withTiming(1, {
        duration: valueConfig.animation.duration || 300,
      });
      
      animatedValues[key].value = progressAnimation;
    });
  }, [config, animatedValues, buildAnimation]);

  const stopAnimation = React.useCallback(() => {
    Object.keys(animatedValues).forEach(key => {
      animatedValues[key].value = config.values[key].initial;
    });
  }, [animatedValues, config.values]);

  const resetAnimation = React.useCallback(() => {
    Object.keys(animatedValues).forEach(key => {
      animatedValues[key].value = config.values[key].initial;
    });
  }, [animatedValues, config.values]);

  const createAnimatedStyle = React.useCallback((key: string, styleFactory: (value: number) => ViewStyle | TextStyle | ImageStyle) => {
    return useAnimatedStyle(() => {
      const progress = animatedValues[key]?.value || 0;
      const valueConfig = config.values[key];
      
      if (!valueConfig) return {};
      
      const interpolatedValue = interpolate(
        progress,
        [0, 1],
        [valueConfig.initial, valueConfig.target],
        Extrapolate.CLAMP
      );
      
      return styleFactory(interpolatedValue);
    });
  }, [animatedValues, config.values]);

  return {
    animatedValues,
    startAnimation,
    stopAnimation,
    resetAnimation,
    createAnimatedStyle,
  };
};

export const AnimationBuilder: React.FC<AnimationBuilderConfig> = (config) => {
  const { startAnimation } = useAnimationBuilder(config);

  React.useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  // This component is primarily for configuration, not rendering
  return null;
};

export default AnimationBuilder;
