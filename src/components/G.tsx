import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface GProps {
  children: React.ReactNode;
  style?: ViewStyle;
  transform?: string;
  animated?: boolean;
  animationDuration?: number;
}

export const G: React.FC<GProps> = ({
  children,
  style,
  transform,
  animated = false,
  animationDuration = 300,
}) => {
  const gStyle: ViewStyle = {
    position: 'relative',
    ...style,
  };

  return (
    <View style={gStyle} accessibilityLabel="Group">
      {children}
    </View>
  );
};

export default G;


