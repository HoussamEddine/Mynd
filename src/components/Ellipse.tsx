import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface EllipseProps {
  width: number;
  height: number;
  style?: ViewStyle;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  filled?: boolean;
  animated?: boolean;
  animationDuration?: number;
  onPress?: () => void;
}

export const Ellipse: React.FC<EllipseProps> = ({
  width,
  height,
  style,
  color = theme.foundations.colors.primary,
  borderColor,
  borderWidth = 0,
  filled = true,
  animated = false,
  animationDuration = 300,
  onPress,
}) => {
  const ellipseStyle: ViewStyle = {
    width,
    height,
    borderRadius: Math.min(width, height) / 2,
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
        style={ellipseStyle}
        onTouchEnd={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Ellipse button"
      />
    );
  }

  return <View style={ellipseStyle} />;
};

export default Ellipse;


