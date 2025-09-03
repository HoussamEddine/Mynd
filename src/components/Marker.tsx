import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface MarkerProps {
  id: string;
  children: React.ReactNode;
  markerWidth?: number;
  markerHeight?: number;
  refX?: number;
  refY?: number;
  orient?: 'auto' | 'auto-start-reverse';
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const Marker: React.FC<MarkerProps> = ({
  id,
  children,
  markerWidth = 6,
  markerHeight = 6,
  refX = 0,
  refY = 0,
  orient = 'auto',
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const markerStyle: ViewStyle = {
    position: 'absolute',
    width: markerWidth,
    height: markerHeight,
    left: refX,
    top: refY,
    ...style,
  };

  return (
    <View style={markerStyle} accessibilityLabel={`Marker ${id}`}>
      {children}
    </View>
  );
};

export default Marker;


