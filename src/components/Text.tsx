import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface EnhancedTextProps extends Omit<TextProps, 'style'> {
  style?: TextStyle | TextStyle[];
  variant?: 'display' | 'heading' | 'subtitle' | 'body' | 'caption' | 'button';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  color?: string;
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'black';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  animated?: boolean;
  animationDelay?: number;
  animationDuration?: number;
}

export const Text: React.FC<EnhancedTextProps> = ({
  children,
  style,
  variant = 'body',
  size = 'md',
  color,
  weight = 'regular',
  align = 'auto',
  animated = false,
  animationDelay = 0,
  animationDuration = 300,
  ...textProps
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'display':
        switch (size) {
          case 'large':
            return theme.components.typography.display.large;
          case 'medium':
            return theme.components.typography.display.medium;
          case 'small':
            return theme.components.typography.display.small;
          default:
            return theme.components.typography.display.medium;
        }
      case 'heading':
        switch (size) {
          case 'h1':
            return theme.components.typography.heading.h1;
          case 'h2':
            return theme.components.typography.heading.h2;
          case 'h3':
            return theme.components.typography.heading.h3;
          case 'h4':
            return theme.components.typography.heading.h4;
          default:
            return theme.components.typography.heading.h3;
        }
      case 'subtitle':
        switch (size) {
          case 'large':
            return theme.components.typography.subtitle.large;
          case 'medium':
            return theme.components.typography.subtitle.medium;
          case 'small':
            return theme.components.typography.subtitle.small;
          default:
            return theme.components.typography.subtitle.medium;
        }
      case 'body':
        switch (size) {
          case 'large':
            return theme.components.typography.body.large;
          case 'medium':
            return theme.components.typography.body.medium;
          case 'small':
            return theme.components.typography.body.small;
          default:
            return theme.components.typography.body.medium;
        }
      case 'caption':
        switch (size) {
          case 'large':
            return theme.components.typography.caption.large;
          case 'medium':
            return theme.components.typography.caption.medium;
          case 'small':
            return theme.components.typography.caption.small;
          case 'micro':
            return theme.components.typography.caption.micro;
          default:
            return theme.components.typography.caption.medium;
        }
      case 'button':
        switch (size) {
          case 'large':
            return theme.components.typography.button.large;
          case 'medium':
            return theme.components.typography.button.medium;
          case 'small':
            return theme.components.typography.button.small;
          default:
            return theme.components.typography.button.medium;
        }
      default:
        return theme.components.typography.body.medium;
    }
  };

  const getWeightStyle = (): TextStyle => {
    const weightMap = {
      regular: theme.foundations.fonts.families.regular,
      medium: theme.foundations.fonts.families.medium,
      semiBold: theme.foundations.fonts.families.semiBold,
      bold: theme.foundations.fonts.families.bold,
      black: theme.foundations.fonts.families.black,
    };
    return { fontFamily: weightMap[weight] };
  };

  const baseStyle: TextStyle = {
    ...getVariantStyle(),
    ...getWeightStyle(),
    color: color || getVariantStyle().color,
    textAlign: align,
  };

  const combinedStyle = Array.isArray(style) 
    ? [baseStyle, ...style] 
    : [baseStyle, style];

  if (animated) {
    // For now, return regular text - animation can be added later
    return (
      <RNText style={combinedStyle} {...textProps}>
        {children}
      </RNText>
    );
  }

  return (
    <RNText style={combinedStyle} {...textProps}>
      {children}
    </RNText>
  );
};

export default Text;


