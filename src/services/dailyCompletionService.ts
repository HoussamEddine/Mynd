import { supabase } from '../lib/supabase';

export interface DailyCompletionData {
  date: string;
  hasSession: boolean;
  hasDailyBoost: boolean;
  hasAffirmation: boolean;
  isComplete: boolean;
}

export interface DailyCompletionStats {
  completedDates: Date[];
  currentStreak: number;
  totalCompletedDays: number;
  weeklyCompletionRate: number;
}

class DailyCompletionService {
  // Get daily completion data for a user
  async getDailyCompletionData(userId: string, startDate: Date, endDate: Date): Promise<DailyCompletionData[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get sessions (practice_sessions table)
      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('session_date')
        .eq('user_id', userId)
        .eq('session_type', 'rating')
        .gte('session_date', startDateStr)
        .lte('session_date', endDateStr);

      // Get daily boosts (daily_boosts table - if it exists)
      const { data: dailyBoosts } = await supabase
        .from('daily_boosts')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      // Get affirmations (affirmation_usage table - if it exists)
      const { data: affirmations } = await supabase
        .from('affirmation_usage')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      // Create a map of completion data for each day
      const completionMap = new Map<string, DailyCompletionData>();

      // Initialize all days in range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        completionMap.set(dateStr, {
          date: dateStr,
          hasSession: false,
          hasDailyBoost: false,
          hasAffirmation: false,
          isComplete: false
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Mark sessions
      sessions?.forEach(session => {
        const dateStr = session.session_date;
        const existing = completionMap.get(dateStr);
        if (existing) {
          existing.hasSession = true;
          existing.isComplete = existing.hasSession && existing.hasDailyBoost && existing.hasAffirmation;
        }
      });

      // Mark daily boosts
      dailyBoosts?.forEach(boost => {
        const dateStr = boost.created_at.split('T')[0];
        const existing = completionMap.get(dateStr);
        if (existing) {
          existing.hasDailyBoost = true;
          existing.isComplete = existing.hasSession && existing.hasDailyBoost && existing.hasAffirmation;
        }
      });

      // Mark affirmations
      affirmations?.forEach(affirmation => {
        const dateStr = affirmation.created_at.split('T')[0];
        const existing = completionMap.get(dateStr);
        if (existing) {
          existing.hasAffirmation = true;
          existing.isComplete = existing.hasSession && existing.hasDailyBoost && existing.hasAffirmation;
        }
      });

      return Array.from(completionMap.values());
    } catch (error) {
      console.error('Error getting daily completion data:', error);
      return [];
    }
  }

  // Get completion stats for a user
  async getCompletionStats(userId: string): Promise<DailyCompletionStats> {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const completionData = await this.getDailyCompletionData(userId, thirtyDaysAgo, today);
      
      // Calculate completed dates
      const completedDates = completionData
        .filter(day => day.isComplete)
        .map(day => new Date(day.date));

      // Calculate current streak
      let currentStreak = 0;
      const todayStr = today.toISOString().split('T')[0];
      const todayData = completionData.find(day => day.date === todayStr);
      
      if (todayData?.isComplete) {
        currentStreak = 1;
        // Count backwards to find consecutive completed days
        for (let i = 1; i <= 30; i++) {
          const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const checkDateStr = checkDate.toISOString().split('T')[0];
          const checkDayData = completionData.find(day => day.date === checkDateStr);
          
          if (checkDayData?.isComplete) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate weekly completion rate
      const last7Days = completionData.slice(-7);
      const completedThisWeek = last7Days.filter(day => day.isComplete).length;
      const weeklyCompletionRate = Math.round((completedThisWeek / 7) * 100);

      return {
        completedDates,
        currentStreak,
        totalCompletedDays: completedDates.length,
        weeklyCompletionRate
      };
    } catch (error) {
      console.error('Error getting completion stats:', error);
      return {
        completedDates: [],
        currentStreak: 0,
        totalCompletedDays: 0,
        weeklyCompletionRate: 0
      };
    }
  }

  // Mark a daily boost as completed
  async markDailyBoostCompleted(userId: string): Promise<void> {
    try {
      await supabase
        .from('daily_boosts')
        .insert({
          user_id: userId,
          completed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error marking daily boost completed:', error);
    }
  }

  // Mark an affirmation as used
  async markAffirmationUsed(userId: string, affirmationId?: string): Promise<void> {
    try {
      await supabase
        .from('affirmation_usage')
        .insert({
          user_id: userId,
          affirmation_id: affirmationId,
          used_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error marking affirmation used:', error);
    }
  }

  // Get today's completion status
  async getTodayCompletionStatus(userId: string): Promise<{
    hasSession: boolean;
    hasDailyBoost: boolean;
    hasAffirmation: boolean;
    isComplete: boolean;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayData = await this.getDailyCompletionData(userId, new Date(today), new Date(today));
      
      if (todayData.length > 0) {
        return {
          hasSession: todayData[0].hasSession,
          hasDailyBoost: todayData[0].hasDailyBoost,
          hasAffirmation: todayData[0].hasAffirmation,
          isComplete: todayData[0].isComplete
        };
      }

      return {
        hasSession: false,
        hasDailyBoost: false,
        hasAffirmation: false,
        isComplete: false
      };
    } catch (error) {
      console.error('Error getting today completion status:', error);
      return {
        hasSession: false,
        hasDailyBoost: false,
        hasAffirmation: false,
        isComplete: false
      };
    }
  }
}

export const dailyCompletionService = new DailyCompletionService(); 