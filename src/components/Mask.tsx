import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface MaskProps {
  id: string;
  children: React.ReactNode;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  maskUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  maskContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const Mask: React.FC<MaskProps> = ({
  id,
  children,
  x = 0,
  y = 0,
  width,
  height,
  maskUnits = 'objectBoundingBox',
  maskContentUnits = 'userSpaceOnUse',
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const maskStyle: ViewStyle = {
    position: 'absolute',
    left: x,
    top: y,
    ...(width && { width }),
    ...(height && { height }),
    ...style,
  };

  return (
    <View style={maskStyle} accessibilityLabel={`Mask ${id}`}>
      {children}
    </View>
  );
};

export default Mask;


