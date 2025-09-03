import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface PathProps {
  d: string;
  style?: ViewStyle;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  filled?: boolean;
  animated?: boolean;
  animationDuration?: number;
  onPress?: () => void;
}

export const Path: React.FC<PathProps> = ({
  d,
  style,
  color = theme.foundations.colors.primary,
  borderColor,
  borderWidth = 0,
  filled = true,
  animated = false,
  animationDuration = 300,
  onPress,
}) => {
  // Parse path data to determine bounding box
  const parsePathData = (pathData: string) => {
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    let currentX = 0;
    let currentY = 0;
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    commands.forEach(command => {
      const type = command[0];
      const params = command.slice(1).trim().split(/[\s,]+/).map(Number);

      switch (type.toLowerCase()) {
        case 'm': // Move to
        case 'l': // Line to
          if (params.length >= 2) {
            const x = type === 'm' ? params[0] : currentX + params[0];
            const y = type === 'm' ? params[1] : currentY + params[1];
            currentX = x;
            currentY = y;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
          break;
        case 'h': // Horizontal line
          if (params.length >= 1) {
            const x = type === 'h' ? params[0] : currentX + params[0];
            currentX = x;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
          }
          break;
        case 'v': // Vertical line
          if (params.length >= 1) {
            const y = type === 'v' ? params[0] : currentY + params[0];
            currentY = y;
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
          break;
        case 'z': // Close path
          // Reset to start point
          break;
      }
    });

    return { minX, maxX, minY, maxY };
  };

  const { minX, maxX, minY, maxY } = parsePathData(d);
  const width = maxX - minX;
  const height = maxY - minY;

  const pathStyle: ViewStyle = {
    width: Math.max(width, 1),
    height: Math.max(height, 1),
    position: 'relative',
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
        style={pathStyle}
        onTouchEnd={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Path button"
      />
    );
  }

  return <View style={pathStyle} />;
};

export default Path;


