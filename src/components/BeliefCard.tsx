import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { theme } from '../constants';
import { uiCache } from '../services/cacheService';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Circle, Group, vec, mix, Line } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';



const { colors, spacing, radii } = theme.foundations;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper function to generate random number in a range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Neural Galaxy Visualization
const NUM_NODES = 30; // Fewer nodes for the card
const CONNECTION_PROBABILITY = 0.15;

interface Node {
  id: number;
  x: number;
  y: number;
  initialRadius: number;
  initialOpacity: number;
}

interface Connection {
  id: string;
  from: Node;
  to: Node;
}

interface BeliefCardProps {
  beliefTitle: string;
  positiveBelief?: string;
  onContinuePress: () => void;
  onManageBeliefs?: () => void;
  beliefProgressPercentage?: number;
  showBeliefProgress?: boolean;
  beliefId?: string;
  dailySessionCount?: number; // Pass from parent instead of fetching
}

const BeliefCard: React.FC<BeliefCardProps> = ({ 
  beliefTitle, 
  positiveBelief, 
  onContinuePress, 
  onManageBeliefs,
  beliefProgressPercentage = 0, 
  showBeliefProgress = false,
  beliefId,
  dailySessionCount = 0
}) => {
  const [cachedSessionCount, setCachedSessionCount] = useState<number>(0);
  const [cachedButtonText, setCachedButtonText] = useState<string>('Start your session');

  // Cache the button state when component mounts or dailySessionCount changes
  useEffect(() => {
    const cacheKey = `beliefCard_${beliefId}_${new Date().toDateString()}`;
    
    // Try to get cached value first
    const cached = uiCache.get(cacheKey);
    if (cached && cached.sessionCount === dailySessionCount) {
      setCachedSessionCount(cached.sessionCount);
      setCachedButtonText(cached.buttonText);
    } else {
      // Cache the current state
      const buttonText = dailySessionCount === 0 ? 'Start your session' : 'Continue your session';
      const sessionCount = Math.min(dailySessionCount, 2);
      
      setCachedSessionCount(sessionCount);
      setCachedButtonText(buttonText);
      
      uiCache.set(cacheKey, {
        sessionCount,
        buttonText,
        timestamp: Date.now()
      });
    }
  }, [beliefId, dailySessionCount]);

  // Generate dynamic button text based on cached session count
  const getButtonText = () => {
    return cachedButtonText;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Main content area */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.title}>The Belief I'm Building</Text>
          
          {/* Centered belief text with border */}
          {positiveBelief ? (
            <View style={styles.beliefContainer}>
              <Text style={styles.beliefText}>{positiveBelief}</Text>
            </View>
          ) : (
            <View style={styles.beliefContainer}>
              <Text style={styles.beliefText}>No positive belief available yet</Text>
            </View>
          )}
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={onContinuePress}>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>{getButtonText()}</Text>
                <Text style={styles.buttonProgressText}>{cachedSessionCount}/2</Text>
              </View>
            </Pressable>
            
            {onManageBeliefs && (
              <Pressable style={styles.manageButton} onPress={onManageBeliefs}>
                <Text style={styles.manageButtonText}>Manage your beliefs</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'visible',
  },
  title: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  beliefContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 0,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  beliefText: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.regular,
    color: colors.textLight,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    alignItems: 'center',
    zIndex: 10,
    paddingTop: spacing.sm,
    paddingRight: spacing.sm,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  progressFill: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  progressText: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.textLight,
    fontWeight: '600',
  },
  progressLabel: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
    lineHeight: theme.foundations.fonts.sizes.xs * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  button: {
    borderWidth: 1,
    borderColor: colors.textLight,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  buttonProgressText: {
    color: colors.textLight,
    fontSize: 12,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
    position: 'absolute',
    right: 5,
  },
  manageButton: {
    borderWidth: 1,
    borderColor: colors.textLight,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    width: '100%',
    shadowColor: colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  manageButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  contentContainer: {
  },
});

export default BeliefCard; 