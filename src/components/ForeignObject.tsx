import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface ForeignObjectProps {
  children: React.ReactNode;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const ForeignObject: React.FC<ForeignObjectProps> = ({
  children,
  x = 0,
  y = 0,
  width,
  height,
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const foreignObjectStyle: ViewStyle = {
    position: 'absolute',
    left: x,
    top: y,
    ...(width && { width }),
    ...(height && { height }),
    ...style,
  };

  return (
    <View style={foreignObjectStyle} accessibilityLabel="Foreign object">
      {children}
    </View>
  );
};

export default ForeignObject;


