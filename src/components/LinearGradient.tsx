import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

export interface LinearGradientProps {
  children?: React.ReactNode;
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const LinearGradient: React.FC<LinearGradientProps> = ({
  children,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  locations,
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const gradientStyle: ViewStyle = {
    flex: 1,
    ...style,
  };

  return (
    <RNLinearGradient
      colors={colors}
      start={start}
      end={end}
      locations={locations}
      style={gradientStyle}
    >
      {children}
    </RNLinearGradient>
  );
};

export default LinearGradient;


