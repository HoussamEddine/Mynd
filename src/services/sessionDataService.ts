import { supabase } from '../lib/supabase';
import { sessionCache, CACHE_PREFIXES } from './cacheService';

export interface SessionData {
  completedDates: Date[];
  currentStreak: number;
  dailyRepetitions: Array<{ date: string; completed: number; total: number }>;
  totalSessions: number;
  averageRating: number;
}

export interface DailyRepetition {
  date: string;
  completed: number;
  total: number;
}

class SessionDataService {
  // Get session data from cache or database
  async getSessionData(userId: string): Promise<SessionData> {
    try {
      // Check cache first
      const cached = await sessionCache.get(CACHE_PREFIXES.SESSIONS, { userId });
      if (cached) {
        return cached;
      }

      // Fetch from database
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('session_date, completed, repetitions_completed, session_type')
        .eq('user_id', userId)
        .gte('session_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error) {
        console.error('Error fetching practice sessions:', error);
        return this.getDefaultSessionData();
      }

      const sessionData = this.processSessionData(sessions || []);

      // Cache the result
      await sessionCache.set(CACHE_PREFIXES.SESSIONS, { userId }, sessionData);

      return sessionData;
    } catch (error) {
      console.error('Error getting session data:', error);
      return this.getDefaultSessionData();
    }
  }

  // Process raw session data into structured format
  private processSessionData(sessions: any[]): SessionData {
    const completedDates = sessions
      .filter((session: any) => session.completed)
      .map((session: any) => new Date(session.session_date));

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const hasTodaySession = sessions.some((s: any) => s.session_date === today && s.completed);
    const hasYesterdaySession = sessions.some((s: any) => s.session_date === yesterday && s.completed);
    
    if (hasTodaySession) {
      currentStreak = 1;
      // Count consecutive days backwards
      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const hasSession = sessions.some((s: any) => s.session_date === checkDate && s.completed);
        if (hasSession) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (hasYesterdaySession) {
      currentStreak = 1;
      // Count consecutive days backwards from yesterday
      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const hasSession = sessions.some((s: any) => s.session_date === checkDate && s.completed);
        if (hasSession) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Create daily repetitions data
    const dailyRepetitions = sessions
      .filter((session: any) => session.completed)
      .map((session: any) => ({
        date: session.session_date,
        completed: session.repetitions_completed || 0,
        total: 10 // Default total repetitions
      }));

    // Calculate total sessions and average rating
    const totalSessions = sessions.filter((s: any) => s.completed).length;
    const ratingSessions = sessions.filter((s: any) => s.session_type === 'rating' && s.completed);
    const averageRating = ratingSessions.length > 0 
      ? ratingSessions.reduce((sum: number, s: any) => sum + (s.repetitions_completed || 0), 0) / ratingSessions.length
      : 0;

    return {
      completedDates,
      currentStreak,
      dailyRepetitions,
      totalSessions,
      averageRating
    };
  }

  // Get default session data
  private getDefaultSessionData(): SessionData {
    return {
      completedDates: [],
      currentStreak: 0,
      dailyRepetitions: [],
      totalSessions: 0,
      averageRating: 0
    };
  }

  // Get current streak
  async getCurrentStreak(userId: string): Promise<number> {
    try {
      const sessionData = await this.getSessionData(userId);
      return sessionData.currentStreak;
    } catch (error) {
      console.error('Error getting current streak:', error);
      return 0;
    }
  }

  // Get completed dates
  async getCompletedDates(userId: string): Promise<Date[]> {
    try {
      const sessionData = await this.getSessionData(userId);
      return sessionData.completedDates;
    } catch (error) {
      console.error('Error getting completed dates:', error);
      return [];
    }
  }

  // Get daily repetitions
  async getDailyRepetitions(userId: string): Promise<DailyRepetition[]> {
    try {
      const sessionData = await this.getSessionData(userId);
      return sessionData.dailyRepetitions;
    } catch (error) {
      console.error('Error getting daily repetitions:', error);
      return [];
    }
  }

  // Get total sessions
  async getTotalSessions(userId: string): Promise<number> {
    try {
      const sessionData = await this.getSessionData(userId);
      return sessionData.totalSessions;
    } catch (error) {
      console.error('Error getting total sessions:', error);
      return 0;
    }
  }

  // Get average rating
  async getAverageRating(userId: string): Promise<number> {
    try {
      const sessionData = await this.getSessionData(userId);
      return sessionData.averageRating;
    } catch (error) {
      console.error('Error getting average rating:', error);
      return 0;
    }
  }

  // Add new session
  async addSession(userId: string, sessionData: {
    beliefId: string;
    sessionType: string;
    completed: boolean;
    repetitionsCompleted?: number;
    durationSeconds?: number;
  }): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if a session of this type already exists for today
      const { data: existingSession } = await supabase
        .from('practice_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('belief_id', sessionData.beliefId)
        .eq('session_date', today)
        .eq('session_type', sessionData.sessionType)
        .single();

      if (existingSession) {
        // Update existing session instead of creating a new one
        const { error } = await supabase
          .from('practice_sessions')
          .update({
            completed: sessionData.completed,
            repetitions_completed: sessionData.repetitionsCompleted || 0,
            duration_seconds: sessionData.durationSeconds || 0,
          })
          .eq('id', existingSession.id);

        if (error) {
          console.error('Error updating existing session:', error);
          return false;
        }
      } else {
        // Create new session
        const { error } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: userId,
            belief_id: sessionData.beliefId,
            session_date: today,
            session_type: sessionData.sessionType,
            completed: sessionData.completed,
            repetitions_completed: sessionData.repetitionsCompleted || 0,
            duration_seconds: sessionData.durationSeconds || 0,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error adding session:', error);
          return false;
        }
      }

      // Invalidate cache
      await this.invalidateCache(userId);

      return true;
    } catch (error) {
      console.error('Error adding session:', error);
      return false;
    }
  }

  // Invalidate session cache
  async invalidateCache(userId: string): Promise<void> {
    try {
      await sessionCache.invalidate(CACHE_PREFIXES.SESSIONS);
    } catch (error) {
      console.error('Error invalidating session cache:', error);
    }
  }

  // Preload session data for app startup
  async preloadSessionData(userId: string): Promise<void> {
    try {
      // Preload session data in background
      this.getSessionData(userId);
    } catch (error) {
      console.error('Error preloading session data:', error);
    }
  }
}

export const sessionDataService = new SessionDataService(); 