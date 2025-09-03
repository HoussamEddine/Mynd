import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, Line, Polygon, Polyline } from 'react-native-svg';

export interface ShapeProps {
  type: 'path' | 'circle' | 'rect' | 'ellipse' | 'line' | 'polygon' | 'polyline';
  style?: ViewStyle;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  transform?: string;
  children?: React.ReactNode;
  // Path specific props
  d?: string;
  // Circle specific props
  cx?: number;
  cy?: number;
  r?: number;
  // Rect specific props
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  // Ellipse specific props
  // Line specific props
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // Polygon/Polyline specific props
  points?: string;
}

export const Shape: React.FC<ShapeProps> = ({
  type,
  style,
  fill,
  stroke,
  strokeWidth = 1,
  opacity = 1,
  transform,
  children,
  d,
  cx,
  cy,
  r,
  x,
  y,
  width,
  height,
  rx,
  ry,
  x1,
  y1,
  x2,
  y2,
  points,
  ...props
}) => {
  const commonProps = {
    fill,
    stroke,
    strokeWidth,
    opacity,
    transform,
    ...props
  };

  const renderShape = () => {
    switch (type) {
      case 'path':
        return <Path d={d} {...commonProps} />;
      case 'circle':
        return <Circle cx={cx} cy={cy} r={r} {...commonProps} />;
      case 'rect':
        return <Rect x={x} y={y} width={width} height={height} rx={rx} ry={ry} {...commonProps} />;
      case 'ellipse':
        return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...commonProps} />;
      case 'line':
        return <Line x1={x1} y1={y1} x2={x2} y2={y2} {...commonProps} />;
      case 'polygon':
        return <Polygon points={points} {...commonProps} />;
      case 'polyline':
        return <Polyline points={points} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <Svg style={style}>
      {renderShape()}
      {children}
    </Svg>
  );
};

export default Shape;


