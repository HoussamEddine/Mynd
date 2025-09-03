import React from 'react';
import { ViewStyle, TextStyle, ImageStyle, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export type Style = ViewStyle | TextStyle | ImageStyle;

export interface CSSProps {
  children?: React.ReactNode;
  style?: Style | Style[];
  className?: string;
  variant?: 'container' | 'card' | 'button' | 'input' | 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  borderRadius?: 'none' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  shadow?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | 'primary' | 'primaryStrong';
  flex?: boolean | number;
  center?: boolean;
  row?: boolean;
  column?: boolean;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: boolean;
  gap?: number;
  padding?: number | string;
  margin?: number | string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  position?: 'relative' | 'absolute' | 'fixed';
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  zIndex?: number;
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';
  display?: 'flex' | 'none';
}

export const useCSS = (props: CSSProps): Style => {
  const {
    variant,
    size,
    color,
    spacing,
    borderRadius,
    shadow,
    flex,
    center,
    row,
    column,
    justify,
    align,
    wrap,
    gap,
    padding,
    margin,
    width,
    height,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
    position,
    top,
    left,
    right,
    bottom,
    zIndex,
    opacity,
    overflow,
    display,
  } = props;

  const styles: Style = {};

  // Variant styles
  if (variant) {
    switch (variant) {
      case 'container':
        Object.assign(styles, {
          flex: 1,
          backgroundColor: theme.foundations.colors.background,
          padding: theme.foundations.spacing.base,
        });
        break;
      case 'card':
        Object.assign(styles, {
          backgroundColor: theme.foundations.colors.surface,
          borderRadius: theme.foundations.radii.base,
          padding: theme.foundations.spacing.md,
          ...theme.foundations.shadows.base,
        });
        break;
      case 'button':
        Object.assign(styles, {
          backgroundColor: theme.foundations.colors.primary,
          borderRadius: theme.foundations.radii.base,
          paddingVertical: theme.foundations.spacing.md,
          paddingHorizontal: theme.foundations.spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
        });
        break;
      case 'input':
        Object.assign(styles, {
          backgroundColor: theme.foundations.colors.surface,
          borderWidth: 1,
          borderColor: theme.foundations.colors.border,
          borderRadius: theme.foundations.radii.sm,
          padding: theme.foundations.spacing.md,
        });
        break;
      case 'text':
        Object.assign(styles, {
          color: theme.foundations.colors.textPrimary,
          fontSize: theme.foundations.fonts.sizes.base,
          fontFamily: theme.foundations.fonts.families.regular,
        });
        break;
    }
  }

  // Size styles
  if (size) {
    const sizeMap = {
      xs: theme.foundations.fonts.sizes.xs,
      sm: theme.foundations.fonts.sizes.sm,
      md: theme.foundations.fonts.sizes.base,
      lg: theme.foundations.fonts.sizes.lg,
      xl: theme.foundations.fonts.sizes.xl,
      '2xl': theme.foundations.fonts.sizes['2xl'],
    };
    if (variant === 'text') {
      styles.fontSize = sizeMap[size];
    }
  }

  // Color styles
  if (color) {
    const colorMap = {
      primary: theme.foundations.colors.primary,
      secondary: theme.foundations.colors.textSecondary,
      success: theme.foundations.colors.success,
      warning: theme.foundations.colors.warning,
      error: theme.foundations.colors.error,
      info: theme.foundations.colors.textTertiary,
    };
    if (variant === 'text') {
      styles.color = colorMap[color];
    } else if (variant === 'button') {
      styles.backgroundColor = colorMap[color];
    }
  }

  // Spacing styles
  if (spacing) {
    const spacingValue = theme.foundations.spacing[spacing];
    if (variant === 'container') {
      styles.padding = spacingValue;
    } else if (variant === 'card') {
      styles.padding = spacingValue;
    }
  }

  // Border radius styles
  if (borderRadius) {
    styles.borderRadius = theme.foundations.radii[borderRadius];
  }

  // Shadow styles
  if (shadow) {
    Object.assign(styles, theme.foundations.shadows[shadow]);
  }

  // Layout styles
  if (flex !== undefined) {
    if (typeof flex === 'boolean') {
      styles.flex = flex ? 1 : 0;
    } else {
      styles.flex = flex;
    }
  }

  if (center) {
    styles.justifyContent = 'center';
    styles.alignItems = 'center';
  }

  if (row) {
    styles.flexDirection = 'row';
  }

  if (column) {
    styles.flexDirection = 'column';
  }

  if (justify) {
    const justifyMap = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly',
    };
    styles.justifyContent = justifyMap[justify];
  }

  if (align) {
    const alignMap = {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      baseline: 'baseline',
      stretch: 'stretch',
    };
    styles.alignItems = alignMap[align];
  }

  if (wrap) {
    styles.flexWrap = 'wrap';
  }

  if (gap !== undefined) {
    styles.gap = gap;
  }

  // Spacing styles
  if (padding !== undefined) {
    styles.padding = padding;
  }

  if (margin !== undefined) {
    styles.margin = margin;
  }

  // Dimension styles
  if (width !== undefined) {
    styles.width = width;
  }

  if (height !== undefined) {
    styles.height = height;
  }

  if (maxWidth !== undefined) {
    styles.maxWidth = maxWidth;
  }

  if (maxHeight !== undefined) {
    styles.maxHeight = maxHeight;
  }

  if (minWidth !== undefined) {
    styles.minWidth = minWidth;
  }

  if (minHeight !== undefined) {
    styles.minHeight = minHeight;
  }

  // Position styles
  if (position) {
    styles.position = position;
  }

  if (top !== undefined) {
    styles.top = top;
  }

  if (left !== undefined) {
    styles.left = left;
  }

  if (right !== undefined) {
    styles.right = right;
  }

  if (bottom !== undefined) {
    styles.bottom = bottom;
  }

  if (zIndex !== undefined) {
    styles.zIndex = zIndex;
  }

  if (opacity !== undefined) {
    styles.opacity = opacity;
  }

  if (overflow) {
    styles.overflow = overflow;
  }

  if (display) {
    styles.display = display;
  }

  return styles;
};

export const CSS: React.FC<CSSProps> = ({ children, style, ...props }) => {
  const cssStyles = useCSS(props);
  const combinedStyle = Array.isArray(style) 
    ? [cssStyles, ...style] 
    : [cssStyles, style];

  return (
    <div style={combinedStyle}>
      {children}
    </div>
  );
};

export default CSS;


