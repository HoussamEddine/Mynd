import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, Ellipse, Line, Polygon, Polyline, G, Defs, ClipPath, Mask, Pattern, RadialGradient, LinearGradient, Stop, Symbol, Use, Text, TSpan, TextPath, Image, Marker, ForeignObject } from 'react-native-svg';

export interface LocalSvgProps {
  style?: ViewStyle;
  width?: number;
  height?: number;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  children?: React.ReactNode;
}

export const LocalSvg: React.FC<LocalSvgProps> = ({
  style,
  width,
  height,
  viewBox,
  fill,
  stroke,
  strokeWidth,
  opacity,
  children,
  ...props
}) => {
  return (
    <Svg
      style={style}
      width={width}
      height={height}
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      {...props}
    >
      {children}
    </Svg>
  );
};

// Export all SVG primitives for convenience
export {
  Path,
  Circle,
  Rect,
  Ellipse,
  Line,
  Polygon,
  Polyline,
  G,
  Defs,
  ClipPath,
  Mask,
  Pattern,
  RadialGradient,
  LinearGradient,
  Stop,
  Symbol,
  Use,
  Text,
  TSpan,
  TextPath,
  Image,
  Marker,
  ForeignObject
};

export default LocalSvg;


