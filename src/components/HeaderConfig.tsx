import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface HeaderConfigProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  elevation?: number;
  transparent?: boolean;
  animated?: boolean;
}

export interface HeaderStyleConfig {
  container: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  backButton: ViewStyle;
  closeButton: ViewStyle;
  rightContainer: ViewStyle;
  leftContainer: ViewStyle;
}

export const useHeaderConfig = (props: HeaderConfigProps): HeaderStyleConfig => {
  const {
    backgroundColor = theme.foundations.colors.surface,
    titleColor = theme.foundations.colors.textPrimary,
    subtitleColor = theme.foundations.colors.textSecondary,
    elevation = 0,
    transparent = false,
  } = props;

  return {
    container: {
      backgroundColor: transparent ? 'transparent' : backgroundColor,
      paddingHorizontal: theme.foundations.spacing.base,
      paddingVertical: theme.foundations.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 56,
      elevation,
      shadowColor: theme.foundations.colors.textPrimary,
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: elevation > 0 ? 0.1 : 0,
      shadowRadius: elevation / 2,
    },
    title: {
      ...theme.components.typography.heading.h3,
      color: titleColor,
      flex: 1,
      textAlign: 'center',
    },
    subtitle: {
      ...theme.components.typography.subtitle.small,
      color: subtitleColor,
      textAlign: 'center',
      marginTop: theme.foundations.spacing.xs,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.foundations.colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.foundations.colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rightContainer: {
      minWidth: 40,
      alignItems: 'flex-end',
    },
    leftContainer: {
      minWidth: 40,
      alignItems: 'flex-start',
    },
  };
};

export const HeaderConfig: React.FC<HeaderConfigProps> = (props) => {
  const styles = useHeaderConfig(props);
  
  // This component is primarily for configuration, not rendering
  // The actual header rendering should be done in the specific header components
  return null;
};

export default HeaderConfig;


