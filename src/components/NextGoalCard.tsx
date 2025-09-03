import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import InfoContainer from './ui/InfoContainer';
import { theme } from '../constants';
import { supabase } from '../lib/supabase';
import { CircularProgress } from 'react-native-circular-progress';

const { colors, spacing, radii } = theme.foundations;

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  scheduledTime?: string; // ISO string for scheduled time
}

interface NextGoalCardProps {
  goals: Goal[];
  onGoalPress: () => void;
  onGoalsUpdate?: (goals: Goal[]) => void;
  onAddTestGoal?: () => void;
}

const NextGoalCard: React.FC<NextGoalCardProps> = ({ goals, onGoalPress, onGoalsUpdate, onAddTestGoal }) => {
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });
  const [currentGoals, setCurrentGoals] = useState<Goal[]>(goals);
  
  // No longer needed - using real goal scheduled times
  
  // Find the next incomplete goal
  const nextGoal = currentGoals.find(goal => !goal.completed);
  
  // Calculate time remaining for goals
  // Calculate total minutes from goals (assuming each goal takes 15 minutes)
  const completedGoals = currentGoals.filter(goal => goal.completed).length;
  const totalGoals = currentGoals.length;
  const totalMinutes = totalGoals * 15; // Each goal takes 15 minutes
  const completedMinutes = completedGoals * 15;
  
  // Calculate real-time countdown progress based on next goal's scheduled time
  const getRealTimeProgress = () => {
    if (!nextGoal || !nextGoal.scheduledTime) {
      return { minutes: 0, percentage: 0 };
    }

    const now = new Date();
    const goalTime = new Date(nextGoal.scheduledTime);
    const timeDiff = goalTime.getTime() - now.getTime();
    const minutesRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60)));
    
    // Countdown: show minutes remaining until goal time
    const maxMinutes = 60; // 60 minutes window
    const countdownMinutes = Math.min(maxMinutes, minutesRemaining);
    const percentage = Math.max(0, (countdownMinutes / maxMinutes) * 100);
    

    
    return {
      minutes: countdownMinutes,
      percentage: percentage
    };
  };
  
  const [realTimeProgress, setRealTimeProgress] = useState(getRealTimeProgress());
  
  // Update real-time progress every second
  useEffect(() => {
    const updateProgress = () => {
      setRealTimeProgress(getRealTimeProgress());
    };
    
    updateProgress(); // Initial call
    const interval = setInterval(updateProgress, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate if we should show the card (within 60 minutes of goal time)
  const shouldShowCard = () => {
    if (!currentGoals.length || !nextGoal || !nextGoal.scheduledTime) return false;
    
    const now = new Date();
    const goalTime = new Date(nextGoal.scheduledTime);
    const timeDiff = goalTime.getTime() - now.getTime();
    const minutesRemaining = Math.floor(timeDiff / (1000 * 60));
    
    // Show card if within 60 minutes before goal time, hide if 0 or negative
    return minutesRemaining > 0 && minutesRemaining <= 60;
  };
  
  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const goalTime = new Date();
      goalTime.setMinutes(goalTime.getMinutes() + 30); // 30 minutes from now
      
      const now = new Date();
      const timeDiff = goalTime.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining({ hours, minutes });
      } else {
        setTimeRemaining({ hours: 0, minutes: 0 });
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, []);
  

  
  // Countdown timer function
  const formatTimeRemaining = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // End of today
    
    const diff = endOfDay.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };
  
  // Update countdown every second
  useEffect(() => {
    if (nextGoal) {
      const updateTimer = () => {
        setTimeRemaining(formatTimeRemaining());
      };
      
      updateTimer(); // Initial call
      const interval = setInterval(updateTimer, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [nextGoal]);

  // Update currentGoals when goals prop changes - preserve mock goals
  useEffect(() => {
    if (goals && goals.length > 0) {
      setCurrentGoals(goals);
    }
  }, [goals]);

  // Real-time listener for goal updates
  useEffect(() => {
    const fetchAndListenToGoals = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Initial fetch
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: initialGoals } = await supabase
          .from('goals')
          .select('id, title, status, target_date, scheduled_time')
          .eq('user_id', user.id)
          .or(`target_date.is.null,target_date.eq.${todayStr}`)
          .in('status', ['active', 'in_progress'])
          .order('created_at', { ascending: false });

        const formattedGoals = (initialGoals || []).map((g: any) => ({
          id: g.id,
          title: g.title,
          completed: g.status === 'completed',
          scheduledTime: g.scheduled_time,
        }));

        if (formattedGoals.length > 0) {
          setCurrentGoals(formattedGoals);
          if (onGoalsUpdate) {
            onGoalsUpdate(formattedGoals);
          }
        }

        // Set up real-time subscription
        const subscription = supabase
          .channel('goals_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'goals',
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              // Refetch goals when there's a change
              const { data: updatedGoals } = await supabase
                .from('goals')
                .select('id, title, status, target_date, scheduled_time')
                .eq('user_id', user.id)
                .or(`target_date.is.null,target_date.eq.${todayStr}`)
                .in('status', ['active', 'in_progress'])
                .order('created_at', { ascending: false });

              const formattedUpdatedGoals = (updatedGoals || []).map((g: any) => ({
                id: g.id,
                title: g.title,
                completed: g.status === 'completed',
                scheduledTime: g.scheduled_time,
              }));

              setCurrentGoals(formattedUpdatedGoals);
              if (onGoalsUpdate) {
                onGoalsUpdate(formattedUpdatedGoals);
              }
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };

    fetchAndListenToGoals();
  }, [onGoalsUpdate]);
  
  // Check if we should show the card
  if (!shouldShowCard()) {
    return null; // Don't render the card
  }

  // If no goals or all completed, show a default message
  if (!currentGoals.length) {
    const handleButtonPress = () => {
      if (onAddTestGoal) {
        onAddTestGoal();
      } else {
        onGoalPress();
      }
    };

    return (
      <InfoContainer
        title="Today's Next Step"
        text="Plan your day for powerful transformation."
        backgroundColor={colors.background}
        textColor={colors.textPrimary}
        showButton={true}
        buttonText="Set Goals"
        onButtonPress={handleButtonPress}
        buttonStyle="purple"
      />
    );
  }

  if (!nextGoal) {
    return (
      <InfoContainer
        title="Today's Next Step"
        text="🎉 All goals completed for today! Great job!"
        backgroundColor={colors.background}
        textColor={colors.textPrimary}
        showButton={true}
        buttonText="Add More Goals"
        onButtonPress={onGoalPress}
        buttonStyle="purple"
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Today's Next Step
        </Text>
        
        <View style={styles.goalAndProgressContainer}>
          <View style={styles.goalTextContainer}>
            <Text style={styles.nextGoalText}>
              {nextGoal.title}
            </Text>
            <Text style={styles.goalDetails}>
              9:00 AM • 15 min
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.circularProgressWrapper}>
                                      <CircularProgress
              size={100}
              width={8}
              fill={realTimeProgress.percentage}
              tintColor={colors.primary}
              backgroundColor="rgba(229, 231, 235, 0.2)"
              rotation={0}
              lineCap="round"
              arcSweepAngle={360}
            />
            <View style={styles.circularProgressTextContainer}>
              <Text style={styles.circularProgressText}>
                {realTimeProgress.minutes}
              </Text>
              <Text style={styles.circularProgressLabel}>
                min
              </Text>
            </View>
            </View>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={() => {
            // Handle mark complete logic
          }}>
            <Text style={styles.buttonText}>Mark Complete</Text>
          </Pressable>
        </View>
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
  title: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  goalAndProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  goalTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  nextGoalText: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.textPrimary,
    lineHeight: theme.foundations.fonts.sizes.lg * 1.4,
    marginBottom: spacing.xs,
  },
  goalDetails: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
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
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  circularProgressLabel: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    width: '100%',
  },
  button: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.primary,
  },
});

export default NextGoalCard; 