import React from 'react';
import { FlatList as RNFlatList, FlatListProps, ViewStyle, RefreshControl } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

export interface EnhancedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor?: (item: T, index: number) => string;
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
}

export const EnhancedFlatList = <T extends any>({
  data,
  renderItem,
  keyExtractor,
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
  ...flatListProps
}: EnhancedFlatListProps<T>) => {
  const AnimatedFlatList = Animated.createAnimatedComponent(RNFlatList);

  const renderItemWithAnimation = React.useCallback(
    ({ item, index }: { item: T; index: number }) => {
      if (!animated) {
        return renderItem(item, index);
      }

      return (
        <Animated.View
          entering={FadeInUp.delay(index * animationDelay).duration(animationDuration)}
          exiting={FadeOutDown.duration(animationDuration)}
        >
          {renderItem(item, index)}
        </Animated.View>
      );
    },
    [renderItem, animated, animationDelay, animationDuration]
  );

  const defaultKeyExtractor = React.useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      return `item-${index}`;
    },
    [keyExtractor]
  );

  if (loading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  if (error && errorComponent) {
    return <>{errorComponent}</>;
  }

  if (data.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <AnimatedFlatList
      data={data}
      renderItem={renderItemWithAnimation}
      keyExtractor={defaultKeyExtractor}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      style={containerStyle}
      {...flatListProps}
    />
  );
};

export default EnhancedFlatList;


