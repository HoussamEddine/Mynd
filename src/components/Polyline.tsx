import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface PolylineProps {
  points: Array<{ x: number; y: number }>;
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  animated?: boolean;
  animationDuration?: number;
  onPress?: () => void;
}

export const Polyline: React.FC<PolylineProps> = ({
  points,
  style,
  color = theme.foundations.colors.primary,
  thickness = 2,
  animated = false,
  animationDuration = 300,
  onPress,
}) => {
  if (points.length < 2) {
    console.warn('Polyline requires at least 2 points');
    return null;
  }

  // Calculate bounding box
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  const width = maxX - minX;
  const height = maxY - minY;

  // Create line segments
  const lineSegments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    const segmentLength = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    lineSegments.push({
      start,
      end,
      length: segmentLength,
      angle,
    });
  }

  const polylineStyle: ViewStyle = {
    width,
    height,
    position: 'relative',
    ...style,
  };

  if (onPress) {
    return (
      <View
        style={polylineStyle}
        onTouchEnd={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Polyline button"
      >
        {lineSegments.map((segment, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: segment.start.x - minX,
              top: segment.start.y - minY,
              width: segment.length,
              height: thickness,
              backgroundColor: color,
              transform: [
                { rotate: `${angle * (180 / Math.PI)}deg` },
                { translateX: -thickness / 2 },
                { translateY: -thickness / 2 },
              ],
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={polylineStyle}>
      {lineSegments.map((segment, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: segment.start.x - minX,
            top: segment.start.y - minY,
            width: segment.length,
            height: thickness,
            backgroundColor: color,
            transform: [
              { rotate: `${segment.angle * (180 / Math.PI)}deg` },
              { translateX: -thickness / 2 },
              { translateY: -thickness / 2 },
            ],
          }}
        />
      ))}
    </View>
  );
};

export default Polyline;


