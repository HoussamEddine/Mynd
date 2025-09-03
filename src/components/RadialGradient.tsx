import React from 'react';
import { View, ViewStyle } from 'react-native';
import { RadialGradient as RNRadialGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

export interface RadialGradientProps {
  children?: React.ReactNode;
  colors: string[];
  center?: { x: number; y: number };
  radius?: number;
  locations?: number[];
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const RadialGradient: React.FC<RadialGradientProps> = ({
  children,
  colors,
  center = { x: 0.5, y: 0.5 },
  radius = 0.5,
  locations,
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const gradientStyle: ViewStyle = {
    flex: 1,
    ...style,
  };

  // Note: expo-linear-gradient doesn't support radial gradients natively
  // This is a fallback implementation
  return (
    <View style={gradientStyle}>
      <View
        style={{
          position: 'absolute',
          top: center.y * 100 - radius * 100,
          left: center.x * 100 - radius * 100,
          width: radius * 200,
          height: radius * 200,
          borderRadius: radius * 100,
          backgroundColor: colors[0] || theme.foundations.colors.primary,
        }}
      />
      {children}
    </View>
  );
};

export default RadialGradient;


