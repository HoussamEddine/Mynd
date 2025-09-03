import { supabase } from '../lib/supabase';
import type {
  Database,
  User,
  UserInsert,
  UserUpdate,
  Belief,
  BeliefInsert,
  BeliefUpdate,
  Affirmation,
  AffirmationInsert,
  AffirmationUpdate,
  PracticeSession,
  PracticeSessionInsert,
  PracticeSessionUpdate,
  MoodLog,
  MoodLogInsert,
  MoodLogUpdate,
  JournalEntry,
  JournalEntryInsert,
  JournalEntryUpdate,
  Goal,
  GoalInsert,
  GoalUpdate,
  MeditationSession,
  MeditationSessionInsert,
  MeditationSessionUpdate,
  UserAnalyticsSummary,
} from '../types/database';

class DatabaseService {
  // ============= USER MANAGEMENT =============
  
  async createUser(userData: UserInsert): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(userId: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateVoiceCloneStatus(
    userId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    voiceId?: string
  ): Promise<void> {
    const updates: UserUpdate = {
      voice_clone_status: status,
      ...(voiceId && { elevenlabs_voice_id: voiceId }),
      ...(status === 'completed' && { voice_created_at: new Date().toISOString() }),
    };

    await this.updateUser(userId, updates);
  }

  async updateUserAuthProviders(userId: string, provider: string): Promise<User> {
    const user = await this.getUser(userId);
    const currentProviders = user?.auth_providers || [];
    
    if (!currentProviders.includes(provider)) {
      const { data, error } = await supabase
        .from('users')
        .update({
          auth_providers: [...currentProviders, provider]
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    
    return user;
  }

  // ============= BELIEFS MANAGEMENT =============

  async createBelief(beliefData: BeliefInsert): Promise<Belief> {
    const { data, error } = await supabase
      .from('beliefs')
      .insert(beliefData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateBelief(beliefId: string, updates: BeliefUpdate): Promise<Belief> {
    const { data, error } = await supabase
      .from('beliefs')
      .update(updates)
      .eq('id', beliefId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getBelief(beliefId: string): Promise<Belief | null> {
    const { data, error } = await supabase
      .from('beliefs')
      .select('*')
      .eq('id', beliefId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserBeliefs(
    userId: string,
    status?: 'active' | 'in_progress' | 'transformed' | 'archived'
  ): Promise<Belief[]> {
    let query = supabase
      .from('beliefs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async deleteBelief(beliefId: string): Promise<void> {
    const { error } = await supabase
      .from('beliefs')
      .delete()
      .eq('id', beliefId);
    
    if (error) throw error;
  }

  async updateBeliefProgress(
    beliefId: string,
    progressPercentage: number,
    currentStreak?: number
  ): Promise<Belief> {
    const updates: BeliefUpdate = {
      progress_percentage: Math.max(0, Math.min(100, progressPercentage)),
      ...(currentStreak !== undefined && { current_streak: currentStreak }),
    };

    // Update status based on progress
    if (progressPercentage >= 100) {
      updates.status = 'transformed';
    } else if (progressPercentage > 0) {
      updates.status = 'in_progress';
    }

    return this.updateBelief(beliefId, updates);
  }

  // ============= AFFIRMATIONS MANAGEMENT =============

  async createAffirmation(affirmationData: AffirmationInsert): Promise<Affirmation> {
    const { data, error } = await supabase
      .from('affirmations')
      .insert(affirmationData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateAffirmation(affirmationId: string, updates: AffirmationUpdate): Promise<Affirmation> {
    const { data, error } = await supabase
      .from('affirmations')
      .update(updates)
      .eq('id', affirmationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getBeliefAffirmations(beliefId: string): Promise<Affirmation[]> {
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('belief_id', beliefId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getUserAffirmations(userId: string): Promise<Affirmation[]> {
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getFavoriteAffirmations(userId: string): Promise<Affirmation[]> {
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async updateAffirmationAudio(
    affirmationId: string,
    audioUrl: string,
    audioDuration: number,
    elevenLabsAudioId?: string
  ): Promise<Affirmation> {
    return this.updateAffirmation(affirmationId, {
      audio_url: audioUrl,
      audio_duration: audioDuration,
      elevenlabs_audio_id: elevenLabsAudioId,
      audio_generated_at: new Date().toISOString(),
    });
  }

  // ============= PRACTICE SESSIONS =============

  async createPracticeSession(sessionData: PracticeSessionInsert): Promise<PracticeSession> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updatePracticeSession(sessionId: string, updates: PracticeSessionUpdate): Promise<PracticeSession> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getTodayPracticeSession(
    userId: string,
    beliefId: string
  ): Promise<PracticeSession | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('belief_id', beliefId)
      .eq('session_date', today)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserPracticeSessions(
    userId: string,
    limit: number = 30
  ): Promise<PracticeSession[]> {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  async completePracticeSession(
    sessionId: string,
    repetitionsCompleted: number,
    durationSeconds: number,
    moodAfter?: number,
    notes?: string
  ): Promise<PracticeSession> {
    return this.updatePracticeSession(sessionId, {
      completed: true,
      repetitions_completed: repetitionsCompleted,
      duration_seconds: durationSeconds,
      mood_after: moodAfter,
      notes,
    });
  }

  // ============= MOOD TRACKING =============

  async logMood(moodData: MoodLogInsert): Promise<MoodLog> {
    const { data, error } = await supabase
      .from('mood_logs')
      .insert(moodData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserMoodLogs(
    userId: string,
    days: number = 30
  ): Promise<MoodLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startDate.toISOString())
      .order('logged_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getTodayMoodLog(userId: string): Promise<MoodLog | null> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay.toISOString())
      .lt('logged_at', endOfDay.toISOString())
      .order('logged_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ============= JOURNAL ENTRIES =============

  async createJournalEntry(entryData: JournalEntryInsert): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entryData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateJournalEntry(entryId: string, updates: JournalEntryUpdate): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserJournalEntries(
    userId: string,
    limit: number = 20
  ): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  async deleteJournalEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);
    
    if (error) throw error;
  }

  // ============= GOALS MANAGEMENT =============

  async createGoal(goalData: GoalInsert): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert(goalData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateGoal(goalId: string, updates: GoalUpdate): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserGoals(
    userId: string,
    status?: 'active' | 'completed' | 'paused' | 'archived'
  ): Promise<Goal[]> {
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async completeGoal(goalId: string): Promise<Goal> {
    return this.updateGoal(goalId, {
      status: 'completed',
      progress_percentage: 100,
    });
  }

  // ============= MEDITATION SESSIONS =============

  async createMeditationSession(sessionData: MeditationSessionInsert): Promise<MeditationSession> {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async completeMeditationSession(
    sessionId: string,
    completedAt: string,
    moodAfter?: number,
    focusRating?: number,
    notes?: string
  ): Promise<MeditationSession> {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .update({
        completed: true,
        completed_at: completedAt,
        mood_after: moodAfter,
        focus_rating: focusRating,
        notes,
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserMeditationSessions(
    userId: string,
    limit: number = 20
  ): Promise<MeditationSession[]> {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  // ============= ANALYTICS =============

  async getUserAnalyticsSummary(
    userId: string,
    daysBack: number = 30
  ): Promise<UserAnalyticsSummary> {
    const { data, error } = await supabase
      .rpc('get_user_analytics_summary', {
        user_uuid: userId,
        days_back: daysBack,
      });
    
    if (error) throw error;
    return data;
  }

  async calculateUserStreak(
    userId: string,
    streakType: string = 'practice'
  ): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_user_streak', {
        user_uuid: userId,
        streak_type: streakType,
      });
    
    if (error) throw error;
    return data;
  }

  // ============= SEARCH AND FILTERS =============

  async searchBeliefs(
    userId: string,
    searchTerm: string,
    category?: string
  ): Promise<Belief[]> {
    let query = supabase
      .from('beliefs')
      .select('*')
      .eq('user_id', userId)
      .ilike('title', `%${searchTerm}%`);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async searchAffirmations(
    userId: string,
    searchTerm: string
  ): Promise<Affirmation[]> {
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('user_id', userId)
      .ilike('text', `%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async searchJournalEntries(
    userId: string,
    searchTerm: string
  ): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

export const databaseService = new DatabaseService(); 