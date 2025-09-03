import React from 'react';
import { Image as RNImage, ImageProps, ViewStyle, ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { theme } from '../constants/theme';

export interface EnhancedImageProps extends Omit<ImageProps, 'source'> {
  source: any;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  animated?: boolean;
  animationDelay?: number;
  animationDuration?: number;
  showLoadingIndicator?: boolean;
  loadingIndicatorColor?: string;
  loadingIndicatorSize?: 'small' | 'large';
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  borderRadius?: number;
  shadow?: boolean;
  shadowConfig?: {
    color?: string;
    offset?: { width: number; height: number };
    opacity?: number;
    radius?: number;
    elevation?: number;
  };
}

export const EnhancedImage: React.FC<EnhancedImageProps> = ({
  source,
  placeholder,
  errorComponent,
  loadingComponent,
  containerStyle,
  imageStyle,
  animated = true,
  animationDelay = 0,
  animationDuration = 300,
  showLoadingIndicator = true,
  loadingIndicatorColor = theme.foundations.colors.primary,
  loadingIndicatorSize = 'small',
  onLoadStart,
  onLoadEnd,
  onError,
  resizeMode = 'cover',
  borderRadius = 0,
  shadow = false,
  shadowConfig = {},
  ...imageProps
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const AnimatedImage = Animated.createAnimatedComponent(RNImage);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    onLoadEnd?.();
  };

  const handleError = (error: any) => {
    setLoading(false);
    setError(true);
    onError?.(error);
  };

  const shadowStyle: ViewStyle = shadow ? {
    shadowColor: shadowConfig.color || theme.foundations.colors.textPrimary,
    shadowOffset: shadowConfig.offset || { width: 0, height: 2 },
    shadowOpacity: shadowConfig.opacity || 0.1,
    shadowRadius: shadowConfig.radius || 4,
    elevation: shadowConfig.elevation || 2,
  } : {};

  if (error && errorComponent) {
    return <>{errorComponent}</>;
  }

  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  if (loading && showLoadingIndicator) {
    return (
      <View style={[containerStyle, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size={loadingIndicatorSize} color={loadingIndicatorColor} />
      </View>
    );
  }

  if (loading && placeholder) {
    return <>{placeholder}</>;
  }

  const imageComponent = (
    <AnimatedImage
      source={source}
      style={[
        imageStyle,
        {
          borderRadius,
          ...shadowStyle,
        },
      ]}
      resizeMode={resizeMode}
      onLoadStart={handleLoadStart}
      onLoadEnd={handleLoadEnd}
      onError={handleError}
      {...imageProps}
    />
  );

  if (!animated) {
    return (
      <View style={containerStyle}>
        {imageComponent}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Animated.View
        entering={FadeIn.delay(animationDelay).duration(animationDuration)}
        exiting={FadeOut.duration(animationDuration)}
      >
        {imageComponent}
      </Animated.View>
    </View>
  );
};

export default EnhancedImage;


