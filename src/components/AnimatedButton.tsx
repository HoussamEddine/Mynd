import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../constants'
const { colors } = theme.foundations;;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ title, onPress, style, textStyle }) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: 18,
      backgroundColor: colors.primaryButton,
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
      zIndex: -1,
    };
  });

  const triggerPulse = () => {
    pulseScale.value = 1;
    pulseOpacity.value = 0.4;

    pulseScale.value = withTiming(2.5, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
    pulseOpacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePress = (event: GestureResponderEvent) => {
    triggerPulse();
    runOnJS(onPress)(event);
  };

  return (
    <AnimatedPressable
      style={[styles.button, style]}
      onPress={handlePress}
    >
      <Animated.View style={pulseStyle} />
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primaryButton,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    borderWidth: 0,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    zIndex: 1,
  },
});

export default AnimatedButton; 