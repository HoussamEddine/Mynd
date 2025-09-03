import { supabase } from '../lib/supabase';

interface SessionCompletionData {
  sessionId: string;
  totalDuration: number; // in seconds
  listenedDuration: number; // in seconds
  completionPercentage: number;
  isCompleted: boolean;
}

class SessionCompletionService {
  private static instance: SessionCompletionService;
  private sessionTracking: Map<string, SessionCompletionData> = new Map();

  static getInstance(): SessionCompletionService {
    if (!SessionCompletionService.instance) {
      SessionCompletionService.instance = new SessionCompletionService();
    }
    return SessionCompletionService.instance;
  }

  // Start tracking a session
  startSessionTracking(sessionId: string, totalDuration: number): void {
    this.sessionTracking.set(sessionId, {
      sessionId,
      totalDuration,
      listenedDuration: 0,
      completionPercentage: 0,
      isCompleted: false
    });
  }

  // Update listened duration for a session
  updateSessionProgress(sessionId: string, listenedDuration: number): void {
    const session = this.sessionTracking.get(sessionId);
    if (!session) return;

    session.listenedDuration = Math.min(listenedDuration, session.totalDuration);
    session.completionPercentage = (session.listenedDuration / session.totalDuration) * 100;
    session.isCompleted = session.completionPercentage >= 90; // 90% threshold
  }

  // Check if a session is completed (90% or more listened)
  isSessionCompleted(sessionId: string): boolean {
    const session = this.sessionTracking.get(sessionId);
    return session?.isCompleted || false;
  }

  // Get session completion data
  getSessionCompletionData(sessionId: string): SessionCompletionData | null {
    return this.sessionTracking.get(sessionId) || null;
  }

  // Mark session as completed in database
  async markSessionAsCompleted(
    userId: string, 
    beliefId: string, 
    sessionType: string = 'practice',
    durationSeconds?: number
  ): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if a session already exists for today
      const { data: existingSession } = await supabase
        .from('practice_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('belief_id', beliefId)
        .eq('session_date', today)
        .eq('session_type', sessionType)
        .single();

      if (existingSession) {
        // Update existing session
        const { error } = await supabase
          .from('practice_sessions')
          .update({
            completed: true,
            duration_seconds: durationSeconds || 0,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingSession.id);

        if (error) throw error;
      } else {
        // Create new session
        const { error } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: userId,
            belief_id: beliefId,
            session_date: today,
            session_type: sessionType,
            completed: true,
            duration_seconds: durationSeconds || 0,
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking session as completed:', error);
      return false;
    }
  }

  // Check if user has completed a session today
  async hasCompletedSessionToday(
    userId: string, 
    beliefId: string, 
    sessionType: string = 'practice'
  ): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: session, error } = await supabase
        .from('practice_sessions')
        .select('completed')
        .eq('user_id', userId)
        .eq('belief_id', beliefId)
        .eq('session_date', today)
        .eq('session_type', sessionType)
        .eq('completed', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return !!session?.completed;
    } catch (error) {
      console.error('Error checking session completion:', error);
      return false;
    }
  }

  // Clear session tracking data
  clearSessionTracking(sessionId?: string): void {
    if (sessionId) {
      this.sessionTracking.delete(sessionId);
    } else {
      this.sessionTracking.clear();
    }
  }
}

export const sessionCompletionService = SessionCompletionService.getInstance();
export default sessionCompletionService;
