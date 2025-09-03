import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface RectProps {
  width: number;
  height: number;
  style?: ViewStyle;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  filled?: boolean;
  animated?: boolean;
  animationDuration?: number;
  onPress?: () => void;
}

export const Rect: React.FC<RectProps> = ({
  width,
  height,
  style,
  color = theme.foundations.colors.primary,
  borderColor,
  borderWidth = 0,
  borderRadius = 0,
  filled = true,
  animated = false,
  animationDuration = 300,
  onPress,
}) => {
  const rectStyle: ViewStyle = {
    width,
    height,
    borderRadius,
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
        style={rectStyle}
        onTouchEnd={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Rectangle button"
      />
    );
  }

  return <View style={rectStyle} />;
};

export default Rect;


