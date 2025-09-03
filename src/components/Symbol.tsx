import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface SymbolProps {
  id: string;
  children: React.ReactNode;
  style?: ViewStyle;
  viewBox?: string;
  preserveAspectRatio?: string;
  animated?: boolean;
  animationDuration?: number;
}

export const Symbol: React.FC<SymbolProps> = ({
  id,
  children,
  style,
  viewBox,
  preserveAspectRatio = 'xMidYMid meet',
  animated = false,
  animationDuration = 300,
}) => {
  const symbolStyle: ViewStyle = {
    position: 'relative',
    ...style,
  };

  return (
    <View style={symbolStyle} accessibilityLabel={`Symbol ${id}`}>
      {children}
    </View>
  );
};

export default Symbol;


