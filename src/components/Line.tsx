import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface LineProps {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  length?: number | string;
  orientation?: 'horizontal' | 'vertical';
  dashed?: boolean;
  dashLength?: number;
  dashGap?: number;
  animated?: boolean;
  animationDuration?: number;
  onPress?: () => void;
}

export const Line: React.FC<LineProps> = ({
  style,
  color = theme.foundations.colors.border,
  thickness = 1,
  length,
  orientation = 'horizontal',
  dashed = false,
  dashLength = 5,
  dashGap = 5,
  animated = false,
  animationDuration = 300,
  onPress,
}) => {
  const lineStyle: ViewStyle = {
    backgroundColor: color,
    ...(orientation === 'horizontal' ? {
      height: thickness,
      width: length || '100%',
    } : {
      width: thickness,
      height: length || '100%',
    }),
    ...(dashed && {
      backgroundColor: 'transparent',
      borderStyle: 'dashed',
      borderWidth: thickness,
      borderColor: color,
      ...(orientation === 'horizontal' ? {
        borderTopWidth: thickness,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      } : {
        borderLeftWidth: thickness,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
      }),
    }),
    ...style,
  };

  if (onPress) {
    return (
      <View
        style={lineStyle}
        onTouchEnd={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Line button"
      />
    );
  }

  return <View style={lineStyle} />;
};

export default Line;


