import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface PatternProps {
  id: string;
  children: React.ReactNode;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  patternUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  patternContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  patternTransform?: string;
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const Pattern: React.FC<PatternProps> = ({
  id,
  children,
  x = 0,
  y = 0,
  width,
  height,
  patternUnits = 'objectBoundingBox',
  patternContentUnits = 'userSpaceOnUse',
  patternTransform,
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const patternStyle: ViewStyle = {
    position: 'absolute',
    left: x,
    top: y,
    ...(width && { width }),
    ...(height && { height }),
    ...style,
  };

  return (
    <View style={patternStyle} accessibilityLabel={`Pattern ${id}`}>
      {children}
    </View>
  );
};

export default Pattern;


