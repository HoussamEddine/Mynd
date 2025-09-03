import React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps, ViewStyle, RefreshControl } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export interface EnhancedScrollViewProps extends Omit<ScrollViewProps, 'children'> {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  error?: Error | null;
  loading?: boolean;
  containerStyle?: ViewStyle;
  animated?: boolean;
  animationDelay?: number;
  animationDuration?: number;
  showScrollIndicator?: boolean;
  bounces?: boolean;
  alwaysBounceVertical?: boolean;
  alwaysBounceHorizontal?: boolean;
}

export const EnhancedScrollView: React.FC<EnhancedScrollViewProps> = ({
  children,
  onRefresh,
  refreshing = false,
  emptyComponent,
  loadingComponent,
  errorComponent,
  error,
  loading = false,
  containerStyle,
  animated = true,
  animationDelay = 100,
  animationDuration = 300,
  showScrollIndicator = false,
  bounces = true,
  alwaysBounceVertical = false,
  alwaysBounceHorizontal = false,
  ...scrollViewProps
}) => {
  const AnimatedScrollView = Animated.createAnimatedComponent(RNScrollView);

  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  if (error && errorComponent) {
    return <>{errorComponent}</>;
  }

  if (!children && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  const renderChildren = () => {
    if (!animated || !React.Children.count(children)) {
      return children;
    }

    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) {
        return child;
      }

      return (
        <Animated.View
          entering={FadeIn.delay(index * animationDelay).duration(animationDuration)}
          exiting={FadeOut.duration(animationDuration)}
        >
          {child}
        </Animated.View>
      );
    });
  };

  return (
    <AnimatedScrollView
      style={containerStyle}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={showScrollIndicator}
      showsHorizontalScrollIndicator={showScrollIndicator}
      bounces={bounces}
      alwaysBounceVertical={alwaysBounceVertical}
      alwaysBounceHorizontal={alwaysBounceHorizontal}
      {...scrollViewProps}
    >
      {renderChildren()}
    </AnimatedScrollView>
  );
};

export default EnhancedScrollView;


