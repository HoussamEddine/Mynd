import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface StopProps {
  offset: number; // 0-1
  color: string;
  opacity?: number;
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const Stop: React.FC<StopProps> = ({
  offset,
  color,
  opacity = 1,
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const stopStyle: ViewStyle = {
    position: 'absolute',
    left: `${offset * 100}%`,
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: color,
    opacity,
    ...style,
  };

  return <View style={stopStyle} />;
};

export default Stop;


