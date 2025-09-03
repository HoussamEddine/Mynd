import React from 'react';
import { Text, TextStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface TSpanProps {
  children: React.ReactNode;
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  style?: TextStyle;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  animated?: boolean;
  animationDuration?: number;
}

export const TSpan: React.FC<TSpanProps> = ({
  children,
  x,
  y,
  dx,
  dy,
  style,
  color,
  fontSize,
  fontFamily,
  fontWeight = 'normal',
  animated = false,
  animationDuration = 300,
}) => {
  const tspanStyle: TextStyle = {
    color: color || theme.foundations.colors.textPrimary,
    fontSize: fontSize || theme.foundations.fonts.sizes.base,
    fontFamily: fontFamily || theme.foundations.fonts.families.regular,
    fontWeight,
    ...(x !== undefined && { left: x }),
    ...(y !== undefined && { top: y }),
    ...(dx !== undefined && { marginLeft: dx }),
    ...(dy !== undefined && { marginTop: dy }),
    ...style,
  };

  return (
    <Text style={tspanStyle}>
      {children}
    </Text>
  );
};

export default TSpan;


