import { supabase } from '../lib/supabase';

export interface GoalProgressData {
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
}

class GoalProgressService {
  // Get goal progress data for a user and belief
  async getGoalProgress(userId: string, beliefId: string, forceRecalculate: boolean = true): Promise<GoalProgressData> {
    try {
      // If force recalculate is true, skip cache and calculate fresh
      if (!forceRecalculate) {
        // Get the latest progress from goal_progress_history
        const { data: latestProgress } = await supabase
          .from('goal_progress_history')
          .select('*')
          .eq('user_id', userId)
          .eq('belief_id', beliefId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestProgress) {
          return this.formatGoalProgressData(latestProgress);
        }
      }

      // Calculate fresh progress
      return await this.calculateGoalProgress(userId, beliefId);
    } catch (error) {
      console.error('Error getting goal progress:', error);
      return this.getDefaultGoalProgress();
    }
  }

  // Calculate goal progress from scratch
  private async calculateGoalProgress(userId: string, beliefId: string): Promise<GoalProgressData> {
    try {
  
      
      // Get user goals
      const { data: userGoal, error: userGoalError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('belief_id', beliefId)
        .single();

      

      if (!userGoal) {
        
        // Create default goal if it doesn't exist
        const { data: newGoal, error: insertError } = await supabase
          .from('user_goals')
          .insert({
            user_id: userId,
            belief_id: beliefId,
            target_belief_strength: 7,
            target_weekly_sessions: 5,
            target_streak_days: 7
          })
          .select()
          .single();

        

        if (!newGoal) {
          
          return this.getDefaultGoalProgress();
        }
      }

      // Get current stats
      const stats = await this.getCurrentStats(userId, beliefId);
      
      
      // Calculate progress for each tier
      const openingDoorsProgress = this.calculateOpeningDoorsProgress(stats, userGoal);
      const soaringHigherProgress = this.calculateSoaringHigherProgress(stats, userGoal);
      const totalFreedomProgress = this.calculateTotalFreedomProgress(stats, userGoal);
      
      
      
      // Calculate overall progress (weighted average)
      const overallProgress = Math.round(
        (openingDoorsProgress.progress * 0.3) + 
        (soaringHigherProgress.progress * 0.4) + 
        (totalFreedomProgress.progress * 0.3)
      );

      const goalProgress: GoalProgressData = {
        overallProgress,
        openingDoors: openingDoorsProgress,
        soaringHigher: soaringHigherProgress,
        totalFreedom: totalFreedomProgress
      };

      // Save progress to database
      await this.saveGoalProgress(userId, beliefId, goalProgress);

      return goalProgress;
    } catch (error) {
      console.error('Error calculating goal progress:', error);
      return this.getDefaultGoalProgress();
    }
  }

  // Get current stats from practice sessions
  private async getCurrentStats(userId: string, beliefId: string) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];



    // Get all rating sessions
    const { data: allSessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('session_date, repetitions_completed')
      .eq('user_id', userId)
      .eq('belief_id', beliefId)
      .eq('session_type', 'rating')
      .gte('session_date', monthAgo)
      .order('session_date', { ascending: false });



    // Calculate current streak
    let currentStreak = 0;
    if (allSessions && allSessions.length > 0) {
      const sessionDates = allSessions.map((s: any) => s.session_date);
      if (sessionDates.includes(today)) {
        currentStreak = 1;
        for (let i = 1; i <= 30; i++) {
          const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          if (sessionDates.includes(checkDate)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate weekly sessions count
    const weeklySessions = allSessions?.filter((s: any) => s.session_date >= weekAgo) || [];
    const weeklySessionCount = weeklySessions.length;

    // Calculate average and best rating
    const ratings = allSessions?.map((s: any) => s.repetitions_completed) || [];
    const averageRating = ratings.length > 0 ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length : 0;
    const bestRating = ratings.length > 0 ? Math.max(...ratings) : 0;

    return {
      currentStreak,
      weeklySessionCount,
      averageRating,
      bestRating,
      totalSessions: allSessions?.length || 0
    };
  }

  // Calculate Opening Doors progress
  private calculateOpeningDoorsProgress(stats: any, userGoal: any) {
    const targetStreak = userGoal?.target_streak_days || 7;
    const targetSessions = userGoal?.target_weekly_sessions || 10;

    const streakProgress = Math.min((stats.currentStreak / targetStreak) * 100, 100);
    const sessionsProgress = Math.min((stats.weeklySessionCount / targetSessions) * 100, 100);
    const overallProgress = Math.round((streakProgress + sessionsProgress) / 2);



    return {
      progress: overallProgress,
      currentStreak: stats.currentStreak,
      targetStreak,
      weeklySessionCount: stats.weeklySessionCount,
      targetSessions
    };
  }

  // Calculate Soaring Higher progress
  private calculateSoaringHigherProgress(stats: any, userGoal: any) {
    const targetAverage = userGoal?.target_belief_strength || 7;
    const averageProgress = Math.min((stats.averageRating / targetAverage) * 100, 100);



    return {
      progress: Math.round(averageProgress),
      currentAverage: Math.round(stats.averageRating * 10) / 10,
      targetAverage,
      bestRating: stats.bestRating
    };
  }

  // Calculate Total Freedom progress
  private calculateTotalFreedomProgress(stats: any, userGoal: any) {
    let progress = 0;
    let unlockCondition = '';

    // 30-day streak = 40%
    if (stats.currentStreak >= 30) {
      progress += 40;
    } else if (stats.currentStreak > 0) {
      progress += Math.round((stats.currentStreak / 30) * 40);
    }

    // 50+ sessions = 30%
    if (stats.totalSessions >= 50) {
      progress += 30;
    } else if (stats.totalSessions > 0) {
      progress += Math.round((stats.totalSessions / 50) * 30);
    }

    // 8+ average rating = 30%
    if (stats.averageRating >= 8) {
      progress += 30;
    } else if (stats.averageRating > 0) {
      progress += Math.round((stats.averageRating / 8) * 30);
    }

    const isUnlocked = progress >= 100;
    
    if (isUnlocked) {
      unlockCondition = 'Ready to mark as TRANSFORMED';
    } else {
      const remaining = [];
      if (stats.currentStreak < 30) remaining.push(`${30 - stats.currentStreak} more days to 30-day streak`);
      if (stats.totalSessions < 50) remaining.push(`${50 - stats.totalSessions} more sessions needed`);
      if (stats.averageRating < 8) remaining.push(`Need ${(8 - stats.averageRating).toFixed(1)} higher average rating`);
      unlockCondition = remaining.join(', ');
    }

    return {
      progress: Math.min(progress, 100),
      isUnlocked,
      unlockCondition
    };
  }

  // Save goal progress to database
  private async saveGoalProgress(userId: string, beliefId: string, goalProgress: GoalProgressData) {
    try {
      const { data: userGoal } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', userId)
        .eq('belief_id', beliefId)
        .single();

      if (userGoal) {
        await supabase
          .from('goal_progress_history')
          .insert({
            user_id: userId,
            belief_id: beliefId,
            goal_id: userGoal.id,
            overall_progress: goalProgress.overallProgress,
            opening_doors_progress: goalProgress.openingDoors.progress,
            soaring_higher_progress: goalProgress.soaringHigher.progress,
            total_freedom_progress: goalProgress.totalFreedom.progress
          });
      }
    } catch (error) {
      console.error('Error saving goal progress:', error);
    }
  }

  // Format database data to component format
  private formatGoalProgressData(dbData: any): GoalProgressData {
    return {
      overallProgress: dbData.overall_progress,
      openingDoors: {
        progress: dbData.opening_doors_progress,
        currentStreak: dbData.current_streak || 0,
        targetStreak: 7,
        weeklySessionCount: dbData.weekly_session_count || 0,
        targetSessions: 10
      },
      soaringHigher: {
        progress: dbData.soaring_higher_progress,
        currentAverage: dbData.average_rating || 0,
        targetAverage: 7,
        bestRating: dbData.best_rating || 0
      },
      totalFreedom: {
        progress: dbData.total_freedom_progress,
        isUnlocked: dbData.total_freedom_progress >= 100,
        unlockCondition: dbData.total_freedom_progress >= 100 ? 'Ready to mark as TRANSFORMED' : 'Complete all milestones'
      }
    };
  }

  // Get default goal progress data
  private getDefaultGoalProgress(): GoalProgressData {
    return {
      overallProgress: 0,
      openingDoors: {
        progress: 0,
        currentStreak: 0,
        targetStreak: 7,
        weeklySessionCount: 0,
        targetSessions: 10
      },
      soaringHigher: {
        progress: 0,
        currentAverage: 0,
        targetAverage: 7,
        bestRating: 0
      },
      totalFreedom: {
        progress: 0,
        isUnlocked: false,
        unlockCondition: 'Start your journey to unlock Total Freedom'
      }
    };
  }

  // Update goal settings
  async updateGoalSettings(userId: string, beliefId: string, settings: {
    targetBeliefStrength?: number;
    targetWeeklyMinutes?: number;
    targetStreakDays?: number;
  }) {
    try {
      const { data: existingGoal } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', userId)
        .eq('belief_id', beliefId)
        .single();

      if (existingGoal) {
        await supabase
          .from('user_goals')
          .update({
            target_belief_strength: settings.targetBeliefStrength,
            target_weekly_minutes: settings.targetWeeklyMinutes,
            target_streak_days: settings.targetStreakDays,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingGoal.id);
      } else {
        await supabase
          .from('user_goals')
          .insert({
            user_id: userId,
            belief_id: beliefId,
            target_belief_strength: settings.targetBeliefStrength || 7,
            target_weekly_minutes: settings.targetWeeklyMinutes || 30,
            target_streak_days: settings.targetStreakDays || 7
          });
      }
    } catch (error) {
      console.error('Error updating goal settings:', error);
    }
  }

  // Mark belief as transformed
  async markBeliefAsTransformed(userId: string, beliefId: string) {
    try {
      await supabase
        .from('user_goals')
        .update({
          belief_transformed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('belief_id', beliefId);
    } catch (error) {
      console.error('Error marking belief as transformed:', error);
    }
  }

  // Clear cache for user
  async clearCache(userId: string): Promise<void> {
    try {
      // Clear any cached data by forcing a fresh calculation
      // This is a simple implementation - in a real app you might use a proper cache service
  
    } catch (error) {
      console.error('Error clearing goal progress cache:', error);
    }
  }

  // Update goal progress when a new rating is added
  async updateGoalProgressWithRating(userId: string, beliefId: string, newRating: number): Promise<GoalProgressData> {
    try {
      // Calculate fresh progress with the new rating
      const updatedProgress = await this.calculateGoalProgress(userId, beliefId);
      
      // Save the updated progress to database
      await this.saveGoalProgress(userId, beliefId, updatedProgress);
      
      return updatedProgress;
    } catch (error) {
      console.error('Error updating goal progress with rating:', error);
      return this.getDefaultGoalProgress();
    }
  }
}

export const goalProgressService = new GoalProgressService(); 