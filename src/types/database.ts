// Helper types
export interface NotificationSettings {
  daily_reminders: boolean;
  progress_updates: boolean;
  motivational_quotes: boolean;
}

export interface UserAnalyticsSummary {
  total_practice_sessions: number;
  total_meditation_minutes: number;
  total_journal_words: number;
  average_mood: number;
  current_streak: number;
  days_active: number;
  goals_completed: number;
}

// User types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  timezone: string;
  notification_settings: NotificationSettings;
  onboarding_completed: boolean;
  subscription_tier: 'free' | 'premium' | 'pro';
  elevenlabs_voice_id: string | null;
  voice_clone_status: 'pending' | 'processing' | 'completed' | 'failed';
  voice_sample_url: string | null;
  voice_created_at: string | null;
  auth_providers: string[];
}

export interface UserInsert {
  id?: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  timezone?: string;
  notification_settings?: NotificationSettings;
  onboarding_completed?: boolean;
  subscription_tier?: 'free' | 'premium' | 'pro';
  elevenlabs_voice_id?: string | null;
  voice_clone_status?: 'pending' | 'processing' | 'completed' | 'failed';
  voice_sample_url?: string | null;
  voice_created_at?: string | null;
  auth_providers?: string[];
}

export interface UserUpdate {
  id?: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  timezone?: string;
  notification_settings?: NotificationSettings;
  onboarding_completed?: boolean;
  subscription_tier?: 'free' | 'premium' | 'pro';
  elevenlabs_voice_id?: string | null;
  voice_clone_status?: 'pending' | 'processing' | 'completed' | 'failed';
  voice_sample_url?: string | null;
  voice_created_at?: string | null;
  auth_providers?: string[];
}

// Belief types
export interface Belief {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'active' | 'in_progress' | 'transformed' | 'archived';
  created_at: string;
  updated_at: string;
  progress_percentage: number;
  target_days: number;
  current_streak: number;
  longest_streak: number;
  category: string | null;
  priority: number;
  tags: string[] | null;
}

export interface BeliefInsert {
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  status?: 'active' | 'in_progress' | 'transformed' | 'archived';
  created_at?: string;
  updated_at?: string;
  progress_percentage?: number;
  target_days?: number;
  current_streak?: number;
  longest_streak?: number;
  category?: string | null;
  priority?: number;
  tags?: string[] | null;
}

export interface BeliefUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string | null;
  status?: 'active' | 'in_progress' | 'transformed' | 'archived';
  created_at?: string;
  updated_at?: string;
  progress_percentage?: number;
  target_days?: number;
  current_streak?: number;
  longest_streak?: number;
  category?: string | null;
  priority?: number;
  tags?: string[] | null;
}

// Affirmation types
export interface Affirmation {
  id: string;
  user_id: string;
  belief_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  is_custom: boolean;
  is_favorite: boolean;
  category: string | null;
  audio_url: string | null;
  audio_duration: number | null;
  elevenlabs_audio_id: string | null;
  audio_generated_at: string | null;
}

export interface AffirmationInsert {
  id?: string;
  user_id: string;
  belief_id: string;
  text: string;
  created_at?: string;
  updated_at?: string;
  is_custom?: boolean;
  is_favorite?: boolean;
  category?: string | null;
  audio_url?: string | null;
  audio_duration?: number | null;
  elevenlabs_audio_id?: string | null;
  audio_generated_at?: string | null;
}

export interface AffirmationUpdate {
  id?: string;
  user_id?: string;
  belief_id?: string;
  text?: string;
  created_at?: string;
  updated_at?: string;
  is_custom?: boolean;
  is_favorite?: boolean;
  category?: string | null;
  audio_url?: string | null;
  audio_duration?: number | null;
  elevenlabs_audio_id?: string | null;
  audio_generated_at?: string | null;
}

// Practice Session types
export interface PracticeSession {
  id: string;
  user_id: string;
  belief_id: string;
  affirmation_id: string | null;
  session_date: string;
  session_type: 'affirmation' | 'meditation' | 'reflection';
  duration_seconds: number;
  completed: boolean;
  created_at: string;
  repetitions_completed: number;
  repetitions_target: number;
  mood_before: number | null;
  mood_after: number | null;
  notes: string | null;
}

export interface PracticeSessionInsert {
  id?: string;
  user_id: string;
  belief_id: string;
  affirmation_id?: string | null;
  session_date: string;
  session_type?: 'affirmation' | 'meditation' | 'reflection';
  duration_seconds?: number;
  completed?: boolean;
  created_at?: string;
  repetitions_completed?: number;
  repetitions_target?: number;
  mood_before?: number | null;
  mood_after?: number | null;
  notes?: string | null;
}

export interface PracticeSessionUpdate {
  id?: string;
  user_id?: string;
  belief_id?: string;
  affirmation_id?: string | null;
  session_date?: string;
  session_type?: 'affirmation' | 'meditation' | 'reflection';
  duration_seconds?: number;
  completed?: boolean;
  created_at?: string;
  repetitions_completed?: number;
  repetitions_target?: number;
  mood_before?: number | null;
  mood_after?: number | null;
  notes?: string | null;
}

// Mood Log types
export interface MoodLog {
  id: string;
  user_id: string;
  mood_value: number;
  mood_label: string | null;
  logged_at: string;
  notes: string | null;
  triggers: string[] | null;
  activities: string[] | null;
  location: string | null;
  weather: string | null;
}

export interface MoodLogInsert {
  id?: string;
  user_id: string;
  mood_value: number;
  mood_label?: string | null;
  logged_at?: string;
  notes?: string | null;
  triggers?: string[] | null;
  activities?: string[] | null;
  location?: string | null;
  weather?: string | null;
}

export interface MoodLogUpdate {
  id?: string;
  user_id?: string;
  mood_value?: number;
  mood_label?: string | null;
  logged_at?: string;
  notes?: string | null;
  triggers?: string[] | null;
  activities?: string[] | null;
  location?: string | null;
  weather?: string | null;
}

// Journal Entry types
export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  ai_sentiment_score: number | null;
  ai_insights: Record<string, any> | null;
  ai_suggestions: string[] | null;
  word_count: number | null;
  reading_time_minutes: number | null;
  tags: string[] | null;
  is_private: boolean;
}

export interface JournalEntryInsert {
  id?: string;
  user_id: string;
  title?: string | null;
  content: string;
  created_at?: string;
  updated_at?: string;
  ai_sentiment_score?: number | null;
  ai_insights?: Record<string, any> | null;
  ai_suggestions?: string[] | null;
  word_count?: number | null;
  reading_time_minutes?: number | null;
  tags?: string[] | null;
  is_private?: boolean;
}

export interface JournalEntryUpdate {
  id?: string;
  user_id?: string;
  title?: string | null;
  content?: string;
  created_at?: string;
  updated_at?: string;
  ai_sentiment_score?: number | null;
  ai_insights?: Record<string, any> | null;
  ai_suggestions?: string[] | null;
  word_count?: number | null;
  reading_time_minutes?: number | null;
  tags?: string[] | null;
  is_private?: boolean;
}

// Goal types
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  target_date: string | null;
  status: 'active' | 'completed' | 'paused' | 'archived';
  progress_percentage: number;
  is_daily_habit: boolean;
  streak_count: number;
  completion_count: number;
}

export interface GoalInsert {
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
  target_date?: string | null;
  status?: 'active' | 'completed' | 'paused' | 'archived';
  progress_percentage?: number;
  is_daily_habit?: boolean;
  streak_count?: number;
  completion_count?: number;
}

export interface GoalUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
  target_date?: string | null;
  status?: 'active' | 'completed' | 'paused' | 'archived';
  progress_percentage?: number;
  is_daily_habit?: boolean;
  streak_count?: number;
  completion_count?: number;
}

// Meditation Session types
export interface MeditationSession {
  id: string;
  user_id: string;
  belief_id: string | null;
  session_type: string;
  duration_seconds: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
  audio_url: string | null;
  background_sound: string | null;
  mood_before: number | null;
  mood_after: number | null;
  focus_rating: number | null;
  notes: string | null;
}

export interface MeditationSessionInsert {
  id?: string;
  user_id: string;
  belief_id?: string | null;
  session_type?: string;
  duration_seconds: number;
  completed?: boolean;
  started_at?: string;
  completed_at?: string | null;
  audio_url?: string | null;
  background_sound?: string | null;
  mood_before?: number | null;
  mood_after?: number | null;
  focus_rating?: number | null;
  notes?: string | null;
}

export interface MeditationSessionUpdate {
  id?: string;
  user_id?: string;
  belief_id?: string | null;
  session_type?: string;
  duration_seconds?: number;
  completed?: boolean;
  started_at?: string;
  completed_at?: string | null;
  audio_url?: string | null;
  background_sound?: string | null;
  mood_before?: number | null;
  mood_after?: number | null;
  focus_rating?: number | null;
  notes?: string | null;
}

// API Usage types
export interface ApiUsage {
  id: string;
  user_id: string;
  service_name: string;
  endpoint: string | null;
  request_count: number;
  tokens_used: number;
  cost_cents: number;
  created_at: string;
  request_date: string;
  request_type: string | null;
  success: boolean;
  error_message: string | null;
}

export interface ApiUsageInsert {
  id?: string;
  user_id: string;
  service_name: string;
  endpoint?: string | null;
  request_count?: number;
  tokens_used?: number;
  cost_cents?: number;
  created_at?: string;
  request_date: string;
  request_type?: string | null;
  success?: boolean;
  error_message?: string | null;
}

export interface ApiUsageUpdate {
  id?: string;
  user_id?: string;
  service_name?: string;
  endpoint?: string | null;
  request_count?: number;
  tokens_used?: number;
  cost_cents?: number;
  created_at?: string;
  request_date?: string;
  request_type?: string | null;
  success?: boolean;
  error_message?: string | null;
}

// Database type for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      beliefs: {
        Row: Belief;
        Insert: BeliefInsert;
        Update: BeliefUpdate;
      };
      affirmations: {
        Row: Affirmation;
        Insert: AffirmationInsert;
        Update: AffirmationUpdate;
      };
      practice_sessions: {
        Row: PracticeSession;
        Insert: PracticeSessionInsert;
        Update: PracticeSessionUpdate;
      };
      mood_logs: {
        Row: MoodLog;
        Insert: MoodLogInsert;
        Update: MoodLogUpdate;
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: JournalEntryInsert;
        Update: JournalEntryUpdate;
      };
      goals: {
        Row: Goal;
        Insert: GoalInsert;
        Update: GoalUpdate;
      };
      meditation_sessions: {
        Row: MeditationSession;
        Insert: MeditationSessionInsert;
        Update: MeditationSessionUpdate;
      };
      api_usage: {
        Row: ApiUsage;
        Insert: ApiUsageInsert;
        Update: ApiUsageUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_analytics_summary: {
        Args: { user_id: string; days_back: number };
        Returns: UserAnalyticsSummary;
    };
      calculate_user_streak: {
        Args: { user_id: string; streak_type: string };
        Returns: number;
    };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
} 