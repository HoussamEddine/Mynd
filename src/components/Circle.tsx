import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface CircleProps {
  size: number;
  style?: ViewStyle;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  filled?: boolean;
  animated?: boolean;
  animationDuration?: number;
  onPress?: () => void;
}

export const Circle: React.FC<CircleProps> = ({
  size,
  style,
  color = theme.foundations.colors.primary,
  borderColor,
  borderWidth = 0,
  filled = true,
  animated = false,
  animationDuration = 300,
  onPress,
}) => {
  const circleStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...(filled && {
      backgroundColor: color,
    }),
    ...(borderWidth > 0 && {
      borderWidth,
      borderColor: borderColor || color,
    }),
    ...style,
  };

  if (onPress) {
    return (
      <View
        style={circleStyle}
        onTouchEnd={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Circle button"
      />
    );
  }

  return <View style={circleStyle} />;
};

export default Circle;


