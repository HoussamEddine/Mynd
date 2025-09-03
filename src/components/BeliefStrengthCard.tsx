import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import { theme } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgress } from 'react-native-circular-progress';
import { uiCache } from '../services/cacheService';

const { colors, spacing, radii } = theme.foundations;

interface BeliefStrengthCardProps {
  onRatingChange?: (rating: number) => void;
  currentRating?: number;
  coreBelief?: string;
  onConfirmRating?: (rating: number) => void;
  isConfirmed?: boolean;
  progressPercentage?: number;
  hasSubmittedToday?: boolean;
  beliefProgressPercentage?: number;
  hasRatings?: boolean;
  beliefId?: string; // Add beliefId for caching
  onViewStats?: () => void; // Add navigation callback
  isSessionCompleted?: boolean; // Track if a session is completed
  // New goal progress data
  goalProgress?: {
    overallProgress: number;
    openingDoors: {
      progress: number;
      currentStreak: number;
      targetStreak: number;
      weeklySessionCount: number;
      targetSessions: number;
    };
    soaringHigher: {
      progress: number;
      currentAverage: number;
      targetAverage: number;
      bestRating: number;
    };
    totalFreedom: {
      progress: number;
      isUnlocked: boolean;
      unlockCondition: string;
    };
  } | null;
}

const BeliefStrengthCard: React.FC<BeliefStrengthCardProps> = ({ 
  onRatingChange, 
  currentRating = 0,
  coreBelief,
  onConfirmRating,
  isConfirmed = false,
  progressPercentage = 0,
  hasSubmittedToday = false,
  beliefProgressPercentage = 0,
  hasRatings = false,
  beliefId,
  onViewStats,
  isSessionCompleted = false,
  goalProgress
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Determine if rating should be disabled
  const isRatingDisabled = useMemo(() => {
    // If already rated today and no session completed, disable
    if (selectedRating && !isSessionCompleted) {
      return true;
    }
    return false;
  }, [selectedRating, isSessionCompleted]);
  
  // Animation values for each rating button
  const animatedValues = useRef<Animated.Value[]>(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );
  
  // Cached state - this is the source of truth once set
  const [cachedState, setCachedState] = useState<{
    hasSubmittedToday: boolean;
    hasRatings: boolean;
    goalProgress: typeof goalProgress;
  } | null>(null);

  // Simple caching logic - cache once, use forever
  useEffect(() => {
    if (!beliefId) return;
    
    const cacheKey = `belief_strength_card_${beliefId}_${new Date().toDateString()}`;
    
    // Check if we have cached state for today
    uiCache.get('belief_strength_card', { beliefId, date: new Date().toDateString() }).then((cached: any) => {
      if (cached) {
        // Use cached state - this is our source of truth
        setCachedState(cached);
      } else {
        // No cache exists, create it from current props
        const newState = {
          hasSubmittedToday,
          hasRatings,
          goalProgress
        };
        setCachedState(newState);
        
        // Cache this state
        uiCache.set('belief_strength_card', { beliefId, date: new Date().toDateString() }, newState);
      }
    });
  }, [beliefId]); // Only run once when beliefId changes



  const animateRatingSelection = useCallback(async (rating: number) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Reset all animations first
    for (let i = 0; i < 10; i++) {
      animatedValues.current[i].setValue(0);
    }
    
    // Animate each number from 1 to the selected rating sequentially
    for (let i = 0; i < rating; i++) {
      await new Promise<void>((resolve) => {
        Animated.timing(animatedValues.current[i], {
          toValue: 1,
          duration: 80,
          useNativeDriver: false,
        }).start(() => {
          resolve();
        });
      });
      
      // Very short delay for quick sequential effect
      if (i < rating - 1) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    
    setIsAnimating(false);
  }, [isAnimating]);

  const handleRatingPress = useCallback(async (rating: number) => {
    // If rating is disabled, don't allow rating
    if (isRatingDisabled) {
      return;
    }
    
    // If already selected and confirmed, do nothing
    if (selectedRating === rating) {
      return;
    }
    
    setSelectedRating(rating);
    onRatingChange?.(rating);
    
    // Start the sequential animation
    await animateRatingSelection(rating);
    
    // After animation completes, confirm the rating
    onConfirmRating?.(rating);
  }, [onRatingChange, onConfirmRating, selectedRating, isRatingDisabled, animateRatingSelection]);

  // Show goal progress only if there's at least one rating in the database
  const shouldShowGoalProgress = !!goalProgress && hasRatings === true && selectedRating !== null;

  // Calculate holistic progress score (50/50 weighted average of consistency and belief strength)
  const calculateHolisticProgress = useCallback(() => {
    if (!goalProgress) return 0;

    // Step 1: Calculate Consistency Score
    const weeklySessions = goalProgress.openingDoors.weeklySessionCount || 0;
    const targetSessions = goalProgress.openingDoors.targetSessions || 10;
    const consistencyScore = Math.min((weeklySessions / targetSessions) * 100, 100);

    // Step 2: Calculate Belief Strength Score
    const averageRating = goalProgress.soaringHigher.currentAverage || 0;
    const beliefStrengthScore = (averageRating / 10) * 100;

    // Step 3: Combine for Holistic Progress Score (50/50 weighted average)
    const holisticProgress = (consistencyScore * 0.5) + (beliefStrengthScore * 0.5);

    return Math.round(holisticProgress);
  }, [goalProgress]);

  // Navigate to stats screen
  const navigateToStats = useCallback(() => {
    if (onViewStats) {
      onViewStats();
    }
  }, [onViewStats]);

  const renderRatingButtons = () => {
    return Array.from({ length: 10 }, (_, index) => {
      const rating = index + 1;
      const isSelected = selectedRating === rating;
      
      return (
        <Animated.View
          key={rating}
                      style={[
              styles.ratingButton,
              isRatingDisabled && styles.ratingButtonDisabled,
            ]}
        >
          <Pressable
            style={styles.contentContainer}
            onPress={() => handleRatingPress(rating)}
            disabled={isAnimating || isRatingDisabled}
          >
            <Animated.Text 
              style={styles.ratingText}
            >
              {rating}
            </Animated.Text>
          </Pressable>
          {/* Underline sweep */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ratingUnderline,
              {
                transform: [{ scaleX: animatedValues.current[index] }],
                opacity: animatedValues.current[index].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
              }
            ]}
          />
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          How true does your new belief feel today?
        </Text>
        
        <View style={styles.ratingContainer}>
          {renderRatingButtons()}
        </View>
        
        {!selectedRating ? (
          <View>
            <Text style={styles.helpText}>
              Rate your belief strength from 1 to 10.
            </Text>
            <Text style={styles.ratingScaleText}>
              1 = Still developing • 10 = A core truth
            </Text>
          </View>
        ) : isAnimating ? (
          <View>
            <Text style={styles.helpText}>
              Rate your belief strength from 1 to 10.
            </Text>
            <Text style={styles.ratingScaleText}>
              1 = Still developing • 10 = A core truth
            </Text>
          </View>
        ) : selectedRating ? (
          <Text style={styles.helpText}>
            Rating saved! Complete a new session to rate again.
          </Text>
        ) : null}

        {/* Goal Progress Section */}
        {shouldShowGoalProgress && (
          <View style={styles.goalProgressContainer}>
            <Text style={styles.goalProgressTitle}>
              Your Path to Total Freedom
            </Text>
            
            {/* Central Progress Circle */}
            <View style={styles.circleContainer}>
              <View style={styles.circularProgressWrapper}>
                <CircularProgress
                  size={120}
                  width={8}
                  fill={calculateHolisticProgress()}
                  tintColor={colors.primary}
                  backgroundColor="rgba(229, 231, 250, 0.2)"
                  rotation={0}
                  lineCap="round"
                  arcSweepAngle={360}
                />
                <View style={styles.circularProgressTextContainer}>
                  <Text style={styles.circularProgressText}>
                    {Math.round(calculateHolisticProgress())}%
                  </Text>
                  <Text style={styles.circularProgressLabel}>
                    to Total Freedom
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Progress Explanation Subtext */}
            <View style={styles.progressExplanationContainer}>
              <Text style={styles.helpText}>
                Weekly consistency and belief strength show your freedom journey
              </Text>
            </View>
            
            {/* Stats Button */}
            <Pressable style={styles.statsButtonContainer} onPress={navigateToStats}>
              <View style={styles.statsButton}>
                <Text style={styles.statsButtonText}>View Full Stats</Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    marginHorizontal: spacing.xs,
  },
  content: {
    alignItems: 'flex-start',
    width: '100%',
  },
  beliefProgressContainer: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
  },
  beliefProgressTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'left',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  circularProgressWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  circularProgressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressText: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  circularProgressLabel: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.sm,
  },
  ratingButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    position: 'relative',
  },
  ratingText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.semiBold,
  },
  ratingButtonDisabled: {
    opacity: 0.5,
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
  },
  ratingUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    transform: [{ translateX: 16 }, { scaleX: 0 }, { translateX: -16 }],
    borderRadius: 2,
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
    fontWeight: 'bold',
  },
  ratingButtonText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
  },
  ratingButtonTextSelected: {
    color: colors.textLight,
  },
  confirmText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  timerText: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.warning,
    lineHeight: theme.foundations.fonts.sizes.xs * 1.4,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  beliefProgressContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  statItem: {
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // New goal progress styles
  goalProgressContainer: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 200,
  },
  goalProgressTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'left',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    flex: 1,
  },

  ratingScaleText: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  submittedContainer: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  submittedText: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  submittedSubtext: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    width: '100%',
  },
  statsButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  statsButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressExplanationContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    width: '100%',
  },
});

export default BeliefStrengthCard; 