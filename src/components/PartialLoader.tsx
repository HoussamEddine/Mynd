import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../constants';

const { colors, spacing } = theme.foundations;

interface PartialLoaderProps {
  isVisible: boolean;
  type?: 'card' | 'list' | 'text' | 'button';
  style?: any;
}

const PartialLoader: React.FC<PartialLoaderProps> = ({ 
  isVisible, 
  type = 'card',
  style 
}) => {
  const shimmerAnim = new Animated.Value(0);

  useEffect(() => {
    if (isVisible) {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();
      return () => shimmerAnimation.stop();
    }
  }, [isVisible, shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <View style={[styles.cardSkeleton, style]}>
            <Animated.View style={[styles.shimmer, { opacity: shimmerOpacity }]} />
            <View style={styles.cardContent}>
              <View style={styles.titleBar} />
              <View style={styles.textBar} />
              <View style={styles.textBar} />
            </View>
          </View>
        );
      
      case 'list':
        return (
          <View style={[styles.listSkeleton, style]}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.listItem}>
                <Animated.View style={[styles.shimmer, { opacity: shimmerOpacity }]} />
                <View style={styles.itemContent}>
                  <View style={styles.itemTitle} />
                  <View style={styles.itemSubtitle} />
                </View>
              </View>
            ))}
          </View>
        );
      
      case 'text':
        return (
          <View style={[styles.textSkeleton, style]}>
            <Animated.View style={[styles.shimmer, { opacity: shimmerOpacity }]} />
            <View style={styles.textLines}>
              <View style={styles.textLine} />
              <View style={styles.textLine} />
              <View style={[styles.textLine, { width: '60%' }]} />
            </View>
          </View>
        );
      
      case 'button':
        return (
          <View style={[styles.buttonSkeleton, style]}>
            <Animated.View style={[styles.shimmer, { opacity: shimmerOpacity }]} />
            <View style={styles.buttonContent} />
          </View>
        );
      
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return renderSkeleton();
};

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  
  listSkeleton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  
  itemTitle: {
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.xs,
    width: '80%',
  },
  
  itemSubtitle: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '60%',
  },
  
  textSkeleton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  
  textLines: {
    gap: spacing.sm,
  },
  
  textLine: {
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '100%',
  },
  
  buttonSkeleton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  
  buttonContent: {
    height: 20,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '60%',
  },
  
  cardContent: {
    gap: spacing.sm,
  },
  
  titleBar: {
    height: 18,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '70%',
  },
  
  textBar: {
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '100%',
  },
  
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
});

export default PartialLoader; 