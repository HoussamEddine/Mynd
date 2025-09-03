import React from 'react';
import { Text as RNText, StyleSheet, TextProps, StyleProp, TextStyle } from 'react-native';
import { theme } from '../../constants';

interface BaseTextProps extends TextProps {
  variant?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'black';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function Text({ children, style, variant = 'regular', ...restProps }: BaseTextProps) {
  // Get font family with fallback
  const getFontFamily = (variant: string) => {
    const fontMap = {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semiBold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
      black: 'Poppins-Black',
    };
    return fontMap[variant as keyof typeof fontMap] || 'Poppins-Regular';
  };

  const fontFamily = getFontFamily(variant);
  
  const combinedStyle = StyleSheet.flatten([
    {
      fontFamily,
      fontSize: theme.foundations.fonts.sizes.base,
      lineHeight: theme.foundations.fonts.sizes.base * theme.foundations.fonts.lineHeights.normal,
      color: theme.foundations.colors.textPrimary,
    },
    style,
  ]);

  return (
    <RNText style={combinedStyle} {...restProps}>
      {children}
    </RNText>
  );
} 