import { ViewStyle, TextStyle, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ======================
// FOUNDATION
// ======================

export const foundations = {
  // Colors
  colors: {
    // Brand Colors
    primary: '#a78bfa',
    primaryDark: '#8b5cf6',
    primaryLight: '#d8b4fe',
    
    // Background Colors
    background: '#f6f3ff',
    backgroundLight: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceSubtle: 'rgba(255, 255, 255, 0.3)',
    
    // Text Colors
    textPrimary: '#1F2937',
    textSecondary: '#6b7280',
    textTertiary: '#9CA3AF',
    textLight: '#FFFFFF',
    textPlaceholder: '#9CA3AF',
    textMuted: '#9CA3AF',
    textSubtle: '#777777',
    
    // Border Colors
    border: '#e5e7eb',
    borderLight: '#E5E7EB',
    
    // Status Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Mood Colors
    moodAwful: '#EF4444',
    moodBad: '#F97316',
    moodOkay: '#FACC15',
    moodGood: '#84CC16',
    moodGreat: '#22C55E',
    
    // Chart Colors
    chartAxis: '#D1D5DB',
    chartLabel: '#6B7280',
    chartAxisColor: 'rgba(180, 180, 180, 1)',
    chartLabelColor: 'rgba(150, 150, 150, 1)',
    chartContainerBg: '#FFFFFF',
    chartBackgroundSubtle: 'rgba(255, 255, 255, 0.15)',
    
    // Button Colors
    primaryButton: '#8b5cf6',
    buttonBackgroundSubtle: 'rgba(255, 255, 255, 0.5)',
    
    // Tab Colors
    tabInactive: '#A0AEC0',
    tabBarBackground: '#FFFFFF',
    
    // Card Colors
    cardBackground: '#F3F4F6',
    affirmationStackCardBg: '#3B82F6',
    affirmationStackCardText: '#FFFFFF',
    affirmationCardBgTransparent: 'rgba(93, 63, 127, 0.6)',
    affirmationTitleText: '#f3e8ff',
    affirmationBodyText: '#f3e8ff',
    affirmationIcon: '#c4b5fd',
    
    // Input Colors
    chatInputOuterBg: '#E9D5FF',
    
    // Player Colors
    playerIconActive: '#FFFFFF',
    playerIconInactive: '#888888',
    headerIcon: '#FFFFFF',
    galaxyNode: 'rgba(255, 255, 255, 1)',
    galaxyConnection: 'rgba(255, 255, 255, 1)',
    
    // Gradient Colors
    gradientStart: '#a78bfa',
    gradientEnd: '#d8b4fe',
    
    // Bar Colors
    barFill: '#FFFFFF',
    
    // Light Colors
    lightPink: '#FDA4AF',
    
    // Container Colors
    containerBackgroundSubtle: 'rgba(255, 255, 255, 0.3)',
    
    // Transparent Colors
    transparent: 'transparent',
  },

  // Typography
  fonts: {
    families: {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semiBold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
      black: 'Poppins-Black',
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    lineHeights: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
    '6xl': 80,
    '7xl': 96,
    '8xl': 128,
  },

  // Border Radius
  radii: {
    none: 0,
    xs: 2,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 999,
  },

  // Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 5,
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 6,
    },
    primary: {
      shadowColor: '#a78bfa',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    primaryStrong: {
      shadowColor: '#a78bfa',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
  },

  // Screen Dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
    aspectRatio: screenWidth / screenHeight,
  },

  // Add gradients section after colors
  gradients: {
    welcomeScreen: {
      colors: [
        '#f6f3ff',
        'rgba(167, 139, 250, 0.1)',
        'rgba(167, 139, 250, 0.2)',
      ] as const,
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    primaryButton: {
      colors: ['#a78bfa', '#8b5cf6'] as const,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },
  },
};

// ======================
// COMPONENT STYLES
// ======================

export const components = {
  // Typography Styles
  typography: {
    display: {
      large: {
        fontSize: foundations.fonts.sizes['5xl'],
        fontFamily: foundations.fonts.families.bold,
        lineHeight: foundations.fonts.sizes['5xl'] * foundations.fonts.lineHeights.tight,
        letterSpacing: -1,
        color: foundations.colors.textPrimary,
      } as TextStyle,
      medium: {
        fontSize: foundations.fonts.sizes['4xl'],
        fontFamily: foundations.fonts.families.bold,
        lineHeight: foundations.fonts.sizes['4xl'] * foundations.fonts.lineHeights.tight,
        letterSpacing: -0.8,
        color: foundations.colors.textPrimary,
      } as TextStyle,
      small: {
        fontSize: foundations.fonts.sizes['3xl'],
        fontFamily: foundations.fonts.families.bold,
        lineHeight: foundations.fonts.sizes['3xl'] * foundations.fonts.lineHeights.snug,
        letterSpacing: -0.5,
        color: foundations.colors.textPrimary,
      } as TextStyle,
    },
    heading: {
      h1: {
        fontSize: foundations.fonts.sizes['2xl'],
        fontFamily: foundations.fonts.families.bold,
        lineHeight: foundations.fonts.sizes['2xl'] * foundations.fonts.lineHeights.tight,
        letterSpacing: -0.5,
        color: foundations.colors.textPrimary,
      } as TextStyle,
      h2: {
        fontSize: foundations.fonts.sizes.xl,
        fontFamily: foundations.fonts.families.bold,
        lineHeight: foundations.fonts.sizes.xl * foundations.fonts.lineHeights.snug,
        letterSpacing: -0.3,
        color: foundations.colors.textPrimary,
      } as TextStyle,
      h3: {
        fontSize: foundations.fonts.sizes.lg,
        fontFamily: foundations.fonts.families.bold,
        lineHeight: foundations.fonts.sizes.lg * foundations.fonts.lineHeights.snug,
        letterSpacing: -0.2,
        color: foundations.colors.textPrimary,
      } as TextStyle,
      h4: {
        fontSize: foundations.fonts.sizes.base,
        fontFamily: foundations.fonts.families.semiBold,
        lineHeight: foundations.fonts.sizes.base * foundations.fonts.lineHeights.normal,
        letterSpacing: -0.1,
        color: foundations.colors.textPrimary,
      } as TextStyle,
    },
    subtitle: {
      large: {
        fontSize: foundations.fonts.sizes.xl,
        fontFamily: foundations.fonts.families.semiBold,
        lineHeight: foundations.fonts.sizes.xl * foundations.fonts.lineHeights.snug,
        letterSpacing: -0.2,
        color: foundations.colors.textSecondary,
      } as TextStyle,
      medium: {
        fontSize: foundations.fonts.sizes.lg,
        fontFamily: foundations.fonts.families.semiBold,
        lineHeight: foundations.fonts.sizes.lg * foundations.fonts.lineHeights.normal,
        letterSpacing: -0.1,
        color: foundations.colors.textSecondary,
      } as TextStyle,
      small: {
        fontSize: foundations.fonts.sizes.base,
        fontFamily: foundations.fonts.families.medium,
        lineHeight: foundations.fonts.sizes.base * foundations.fonts.lineHeights.normal,
        letterSpacing: 0,
        color: foundations.colors.textSecondary,
      } as TextStyle,
    },
    body: {
      large: {
        fontSize: foundations.fonts.sizes.lg,
        fontFamily: 'Poppins-Regular',
        lineHeight: foundations.fonts.sizes.lg * foundations.fonts.lineHeights.relaxed,
        color: foundations.colors.textPrimary,
      } as TextStyle,
      medium: {
        fontSize: foundations.fonts.sizes.base,
        fontFamily: 'Poppins-Regular',
        lineHeight: foundations.fonts.sizes.base * foundations.fonts.lineHeights.normal,
        color: foundations.colors.textPrimary,
      } as TextStyle,
      small: {
        fontSize: foundations.fonts.sizes.sm,
        fontFamily: 'Poppins-Regular',
        lineHeight: foundations.fonts.sizes.sm * foundations.fonts.lineHeights.normal,
        color: foundations.colors.textPrimary,
      } as TextStyle,
    },
    caption: {
      large: {
        fontSize: foundations.fonts.sizes.base,
        fontFamily: foundations.fonts.families.medium,
        lineHeight: foundations.fonts.sizes.base * foundations.fonts.lineHeights.normal,
        color: foundations.colors.textSecondary,
      } as TextStyle,
      medium: {
        fontSize: foundations.fonts.sizes.sm,
        fontFamily: foundations.fonts.families.medium,
        lineHeight: foundations.fonts.sizes.sm * foundations.fonts.lineHeights.normal,
        color: foundations.colors.textSecondary,
      } as TextStyle,
      small: {
        fontSize: foundations.fonts.sizes.xs,
        fontFamily: foundations.fonts.families.medium,
        lineHeight: foundations.fonts.sizes.xs * foundations.fonts.lineHeights.normal,
        color: foundations.colors.textTertiary,
      } as TextStyle,
      micro: {
        fontSize: 10,
        fontFamily: foundations.fonts.families.regular,
        lineHeight: 10 * foundations.fonts.lineHeights.normal,
        color: foundations.colors.textTertiary,
      } as TextStyle,
    },
    button: {
      large: {
        fontSize: foundations.fonts.sizes.lg,
        fontFamily: foundations.fonts.families.bold,
        letterSpacing: 0.5,
        lineHeight: foundations.fonts.sizes.lg * foundations.fonts.lineHeights.snug,
        textAlign: 'center',
      } as TextStyle,
      medium: {
        fontSize: foundations.fonts.sizes.base,
        fontFamily: foundations.fonts.families.bold,
        letterSpacing: 0.5,
        lineHeight: foundations.fonts.sizes.base * foundations.fonts.lineHeights.snug,
        textAlign: 'center',
      } as TextStyle,
      small: {
        fontSize: foundations.fonts.sizes.sm,
        fontFamily: foundations.fonts.families.bold,
        letterSpacing: 0.5,
        lineHeight: foundations.fonts.sizes.sm * foundations.fonts.lineHeights.snug,
        textAlign: 'center',
      } as TextStyle,
    },
  },

  // Button Styles
  button: {
    base: {
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      borderRadius: 12,
      paddingHorizontal: 48,
      position: 'relative',
      overflow: 'hidden',
      minWidth: 340,
    } as ViewStyle,
    variants: {
      primary: {
        backgroundColor: foundations.colors.primary,
        shadowColor: foundations.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      } as ViewStyle,
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: foundations.colors.primary,
      } as ViewStyle,
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: foundations.colors.border,
      } as ViewStyle,
      text: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
      } as ViewStyle,
      glass: {
        backgroundColor: foundations.colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
      } as ViewStyle,
    },
    sizes: {
      xs: {
        height: 32,
        paddingHorizontal: foundations.spacing['2xl'],
        borderRadius: 8,
      } as ViewStyle,
      sm: {
        height: 40,
        paddingHorizontal: foundations.spacing['3xl'],
        borderRadius: 10,
      } as ViewStyle,
      md: {
        height: 48,
        paddingHorizontal: foundations.spacing['4xl'],
        borderRadius: 12,
      } as ViewStyle,
      lg: {
        height: 56,
        paddingHorizontal: foundations.spacing['5xl'],
        borderRadius: 14,
      } as ViewStyle,
      xl: {
        height: 64,
        paddingHorizontal: foundations.spacing['6xl'],
        borderRadius: 16,
      } as ViewStyle,
    },
    states: {
      disabled: {
        opacity: 0.5,
      } as ViewStyle,
      loading: {
        opacity: 0.8,
      } as ViewStyle,
      pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
      } as ViewStyle,
      hover: {
        opacity: 0.95,
      } as ViewStyle,
      focused: {
        borderColor: foundations.colors.primary,
        borderWidth: 2,
      } as ViewStyle,
    },
    modifiers: {
      fullWidth: {
        width: '100%',
      } as ViewStyle,
      rounded: {
        borderRadius: 9999,
      } as ViewStyle,
      withIcon: {
        paddingLeft: foundations.spacing.lg,
        paddingRight: foundations.spacing.xl,
      } as ViewStyle,
      elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      } as ViewStyle,
    },
    typography: {
      xs: {
        fontSize: foundations.fonts.sizes.xs,
        fontFamily: foundations.fonts.families.bold,
        letterSpacing: 0.5,
        textAlign: 'center',
      } as TextStyle,
      sm: {
        fontSize: foundations.fonts.sizes.sm,
        fontFamily: foundations.fonts.families.bold,
        letterSpacing: 0.5,
        textAlign: 'center',
      } as TextStyle,
      md: {
        fontSize: foundations.fonts.sizes.base,
        fontFamily: foundations.fonts.families.bold,
        letterSpacing: 0.5,
        textAlign: 'center',
      } as TextStyle,
      lg: {
        fontSize: foundations.fonts.sizes.lg,
        fontFamily: foundations.fonts.families.bold,
        letterSpacing: 0.5,
        textAlign: 'center',
      } as TextStyle,
      xl: {
        fontSize: foundations.fonts.sizes.xl,
        fontFamily: foundations.fonts.families.bold,
        letterSpacing: 0.5,
        textAlign: 'center',
      } as TextStyle,
    },
  },

  // Input Styles
  input: {
    base: {
      height: 56,
      borderRadius: foundations.radii.lg,
      paddingHorizontal: foundations.spacing.xl,
      backgroundColor: foundations.colors.surface,
      borderWidth: 1,
      borderColor: foundations.colors.border,
      ...foundations.shadows.sm,
      width: '100%',
    } as ViewStyle,
    default: {
      height: 56,
      backgroundColor: foundations.colors.surface,
      borderRadius: foundations.radii.lg,
      borderWidth: 1,
      borderColor: foundations.colors.border,
      paddingHorizontal: foundations.spacing.xl,
      fontSize: foundations.fonts.sizes.lg,
      fontFamily: foundations.fonts.families.regular,
      color: foundations.colors.textPrimary,
      width: '100%',
    } as ViewStyle & TextStyle,
    password: {
      height: 56,
      backgroundColor: foundations.colors.surface,
      borderRadius: foundations.radii.lg,
      borderWidth: 1,
      borderColor: foundations.colors.border,
      paddingHorizontal: foundations.spacing.xl,
      fontSize: foundations.fonts.sizes.lg,
      fontFamily: foundations.fonts.families.regular,
      color: foundations.colors.textPrimary,
      flex: 1,
    } as ViewStyle & TextStyle,
    container: {
      width: '100%',
    } as ViewStyle,
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: foundations.colors.surface,
      borderRadius: foundations.radii.lg,
      borderWidth: 1,
      borderColor: foundations.colors.border,
      overflow: 'hidden',
      width: '100%',
    } as ViewStyle,
    states: {
      error: {
        borderColor: foundations.colors.error,
        backgroundColor: `${foundations.colors.error}10`,
      } as ViewStyle,
      focused: {
        borderColor: foundations.colors.primary,
        borderWidth: 2,
      } as ViewStyle,
      disabled: {
        opacity: 0.5,
        backgroundColor: foundations.colors.surfaceSubtle,
      } as ViewStyle,
    },
    errorText: {
      fontSize: foundations.fonts.sizes.xs,
      fontFamily: foundations.fonts.families.regular,
      color: foundations.colors.error,
      marginTop: foundations.spacing.xs,
      marginLeft: foundations.spacing.sm,
    } as TextStyle,
    toggle: {
      padding: foundations.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: foundations.spacing.sm,
    } as ViewStyle,
  },

  // Layout Styles
  layout: {
    screen: {
      flex: 1,
      backgroundColor: foundations.colors.background,
    } as ViewStyle,
    container: {
      flex: 1,
      paddingHorizontal: foundations.spacing.xl,
      paddingVertical: foundations.spacing.lg,
    } as ViewStyle,
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,
    column: {
      flexDirection: 'column',
    } as ViewStyle,
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,
    spaceBetween: {
      justifyContent: 'space-between',
    } as ViewStyle,
  },

  // Card Styles
  card: {
    base: {
      backgroundColor: foundations.colors.surface,
      borderRadius: foundations.radii.lg,
      padding: foundations.spacing.lg,
      ...foundations.shadows.md,
    } as ViewStyle,
    variants: {
      elevated: {
        ...foundations.shadows.lg,
      } as ViewStyle,
      bordered: {
        borderWidth: 1,
        borderColor: foundations.colors.border,
        ...foundations.shadows.sm,
      } as ViewStyle,
    },
  },
};

// ======================
// UTILITY FUNCTIONS
// ======================

export const utils = {
  createSpacing: (multiplier: number) => foundations.spacing.base * multiplier,
  createTextStyle: (baseStyle: TextStyle, overrides: Partial<TextStyle> = {}): TextStyle => ({
    ...baseStyle,
    ...overrides,
  }),
  createButtonStyle: (variant: keyof typeof components.button.variants, size: keyof typeof components.button.sizes, overrides: Partial<ViewStyle> = {}): ViewStyle => ({
    ...components.button.base,
    ...components.button.variants[variant],
    ...components.button.sizes[size],
    ...overrides,
  }),
  createInputStyle: (state?: keyof typeof components.input.states, overrides: Partial<ViewStyle> = {}): ViewStyle => ({
    ...components.input.base,
    ...(state ? components.input.states[state] : {}),
    ...overrides,
  }),
  createDefaultInput: (overrides: Partial<ViewStyle & TextStyle> = {}): ViewStyle & TextStyle => ({
    ...components.input.default,
    ...overrides,
  }),
  createPasswordInput: (overrides: Partial<ViewStyle & TextStyle> = {}): ViewStyle & TextStyle => ({
    ...components.input.password,
    ...overrides,
  }),
  createPasswordContainer: (overrides: Partial<ViewStyle> = {}): ViewStyle => ({
    ...components.input.passwordContainer,
    ...overrides,
  }),
};

// Export everything as a theme object
export const theme = {
  foundations,
  components,
  utils,
  emailInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: foundations.colors.textPrimary,
    paddingHorizontal: foundations.spacing.lg,
    letterSpacing: 0.2,
    backgroundColor: 'transparent',
    textAlignVertical: 'center',
    paddingRight: 10,
  } as TextStyle,
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: foundations.colors.textPrimary,
    paddingHorizontal: foundations.spacing.lg,
    letterSpacing: 0.2,
    backgroundColor: 'transparent',
    textAlignVertical: 'center',
    paddingRight: 10,
  } as TextStyle,
}; 