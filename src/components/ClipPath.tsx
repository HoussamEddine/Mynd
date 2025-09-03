import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface ClipPathProps {
  id: string;
  children: React.ReactNode;
  clipPathUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const ClipPath: React.FC<ClipPathProps> = ({
  id,
  children,
  clipPathUnits = 'userSpaceOnUse',
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const clipPathStyle: ViewStyle = {
    position: 'relative',
    ...style,
  };

  return (
    <View style={clipPathStyle} accessibilityLabel={`Clip path ${id}`}>
      {children}
    </View>
  );
};

export default ClipPath;


