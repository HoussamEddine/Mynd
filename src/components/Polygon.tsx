import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface PolygonProps {
  points: Array<{ x: number; y: number }>;
  style?: ViewStyle;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  filled?: boolean;
  animated?: boolean;
  animationDuration?: number;
  onPress?: () => void;
}

export const Polygon: React.FC<PolygonProps> = ({
  points,
  style,
  color = theme.foundations.colors.primary,
  borderColor,
  borderWidth = 0,
  filled = true,
  animated = false,
  animationDuration = 300,
  onPress,
}) => {
  if (points.length < 3) {
    console.warn('Polygon requires at least 3 points');
    return null;
  }

  // Calculate bounding box
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  const width = maxX - minX;
  const height = maxY - minY;

  // Normalize points relative to bounding box
  const normalizedPoints = points.map(p => ({
    x: ((p.x - minX) / width) * 100,
    y: ((p.y - minY) / height) * 100,
  }));

  // Create SVG path for polygon
  const pathData = normalizedPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`)
    .join(' ') + ' Z';

  const polygonStyle: ViewStyle = {
    width,
    height,
    ...(filled && {
      backgroundColor: color,
    }),
    ...(borderWidth > 0 && {
      borderWidth,
      borderColor: borderColor || color,
    }),
    ...style,
  };

  if (onPress) {
    return (
      <View
        style={polygonStyle}
        onTouchEnd={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Polygon button"
      />
    );
  }

  return <View style={polygonStyle} />;
};

export default Polygon;


