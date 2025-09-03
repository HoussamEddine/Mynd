import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface DefsProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const Defs: React.FC<DefsProps> = ({
  children,
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const defsStyle: ViewStyle = {
    position: 'absolute',
    left: -9999, // Hide definitions off-screen
    ...style,
  };

  return (
    <View style={defsStyle} accessibilityLabel="Definitions">
      {children}
    </View>
  );
};

export default Defs;


