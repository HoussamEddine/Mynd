import { beliefCache } from './cacheService';
import { supabase } from '../lib/supabase';
import { CACHE_PREFIXES } from './cacheService';
import { getLocalDateISO } from '../utils/date';

export interface BeliefProgressData {
  progressPercentage: number;
  hasSubmittedToday: boolean;
  hasRatings: boolean;
  currentRating: number;
  beliefId?: string;
  stats: {
    sessionTime: number;
    streak: number;
    consistency: number;
  };
}

class BeliefProgressService {
  // Get belief progress data from cache or database
  async getBeliefProgress(userId: string, beliefId?: string): Promise<BeliefProgressData> {
    try {
      // Always fetch fresh data from database to ensure accuracy
      const progressData = await this.fetchBeliefProgressFromDB(userId, beliefId);

      // Cache the result
      await beliefCache.set(CACHE_PREFIXES.BELIEF_PROGRESS, { userId, beliefId }, progressData);

      return progressData;
    } catch (error) {
      console.error('Error getting belief progress:', error);
      return this.getDefaultBeliefProgress();
    }
  }

  // Fetch belief progress from database
  private async fetchBeliefProgressFromDB(userId: string, beliefId?: string): Promise<BeliefProgressData> {
    // Get belief ID if not provided
    if (!beliefId) {
      const { data: beliefs } = await supabase
        .from('beliefs')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!beliefs || beliefs.length === 0) {
        return this.getDefaultBeliefProgress();
      }
      beliefId = beliefs[0].id;
    }

    // Check if rating was submitted today
    const today = new Date().toISOString().split('T')[0]; // Use same format as storeBeliefStrengthRating
    const { data: todayRating } = await supabase
      .from('practice_sessions')
      .select('repetitions_completed')
      .eq('user_id', userId)
      .eq('belief_id', beliefId)
      .eq('session_type', 'rating')
      .eq('session_date', today)
      .single();

    const currentRating = todayRating?.repetitions_completed || 0;
    const hasSubmittedToday = !!todayRating;
    


    // Check if user has any ratings
    const { data: allRatings } = await supabase
      .from('practice_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('belief_id', beliefId)
      .eq('session_type', 'rating')
      .limit(1);

    const hasRatings = !!allRatings && allRatings.length > 0;

    // Calculate progress percentage
    const { data: ratingSessions } = await supabase
      .from('practice_sessions')
      .select('repetitions_completed')
      .eq('user_id', userId)
      .eq('belief_id', beliefId)
      .eq('session_type', 'rating')
      .gte('session_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    let progressPercentage = 0;
    if (ratingSessions && ratingSessions.length > 0) {
      const totalStrength = ratingSessions.reduce((sum: number, session: any) => sum + (session.repetitions_completed || 0), 0);
      const averageStrength = totalStrength / ratingSessions.length;
      progressPercentage = (averageStrength / 10) * 100;
    }

    // Calculate stats
    const stats = await this.calculateStats(userId, beliefId);

    return {
      progressPercentage,
      hasSubmittedToday,
      hasRatings,
      currentRating,
      beliefId,
      stats
    };
  }

  // Calculate stats for belief progress
  private async calculateStats(userId: string, beliefId: string): Promise<{ sessionTime: number; streak: number; consistency: number }> {
    try {

      // Get today's rating sessions
      const today = getLocalDateISO();
      const { data: todaySessions } = await supabase
        .from('practice_sessions')
        .select('repetitions_completed')
        .eq('user_id', userId)
        .eq('belief_id', beliefId)
        .eq('session_type', 'rating')
        .eq('session_date', today);

      const todayCount = todaySessions?.reduce((sum: number, session: any) => sum + (session.repetitions_completed || 0), 0) || 0;
      const sessionTime = todayCount * 2; // 2 minutes per repetition

      // Calculate streak
      let currentStreak = 0;
      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('session_date')
        .eq('user_id', userId)
        .eq('belief_id', beliefId)
        .eq('session_type', 'rating')
        .gte('session_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('session_date', { ascending: false });

      if (sessions && sessions.length > 0) {
        const sessionDates = sessions.map(s => s.session_date);
        const today = new Date().toISOString().split('T')[0];
        

        
        if (sessionDates.includes(today)) {
          currentStreak = 1;
          // Count consecutive days backwards
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
      
      

      // Calculate consistency (percentage of days with rating sessions in last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });
      
      const daysWithSessions = last7Days.filter(date => 
        sessions?.some(s => s.session_date === date)
      ).length;
      const consistency = Math.round((daysWithSessions / 7) * 100);

      return {
        sessionTime,
        streak: currentStreak,
        consistency
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { sessionTime: 0, streak: 0, consistency: 0 };
    }
  }

  // Update belief progress when new rating is added
  async updateBeliefProgress(userId: string, beliefId: string, newRating: number): Promise<BeliefProgressData> {
    try {
      // Fetch fresh data from database to get accurate hasSubmittedToday status
      const freshData = await this.fetchBeliefProgressFromDB(userId, beliefId);
      
      // Update with new rating
      const updatedData: BeliefProgressData = {
        ...freshData,
        currentRating: newRating,
        hasSubmittedToday: true, // Since we just added a rating
        beliefId: beliefId,
        progressPercentage: this.calculateNewProgressPercentage(freshData.progressPercentage, newRating),
        stats: await this.calculateStats(userId, beliefId)
      };

      // Update cache
      await beliefCache.set(CACHE_PREFIXES.BELIEF_PROGRESS, { userId, beliefId }, updatedData);

      return updatedData;
    } catch (error) {
      console.error('Error updating belief progress:', error);
      return this.getDefaultBeliefProgress();
    }
  }

  // Calculate new progress percentage based on new rating
  private calculateNewProgressPercentage(currentPercentage: number, newRating: number): number {
    // Simple weighted average - you can adjust this formula
    const weight = 0.3; // Weight for new rating
    const newContribution = (newRating / 10) * 100 * weight;
    const existingContribution = currentPercentage * (1 - weight);
    return Math.min(100, Math.max(0, newContribution + existingContribution));
  }

  // Clear cache for user
  async clearCache(userId: string): Promise<void> {
    try {
      await beliefCache.invalidate(CACHE_PREFIXES.BELIEF_PROGRESS);
    } catch (error) {
      console.error('Error clearing belief progress cache:', error);
    }
  }

  // Get default belief progress data
  private getDefaultBeliefProgress(): BeliefProgressData {
    return {
      progressPercentage: 0,
      hasSubmittedToday: false,
      hasRatings: false,
      currentRating: 0,
      beliefId: undefined,
      stats: {
        sessionTime: 0,
        streak: 0,
        consistency: 0
      }
    };
  }
}

export const beliefProgressService = new BeliefProgressService(); 