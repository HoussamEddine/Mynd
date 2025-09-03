export enum NotificationType {
  // Core Session Notifications
  SESSION_REMINDER = 'session_reminder',
  SESSION_COMPLETION = 'session_completion',
  SESSION_PROGRESS = 'session_progress',
  
  // Daily Boost Notifications
  BOOST_AVAILABLE = 'boost_available',
  BOOST_REMINDER = 'boost_reminder',
  
  // Affirmation System
  AFFIRMATION_DELIVERY = 'affirmation_delivery',
  AFFIRMATION_PROGRESS = 'affirmation_progress',
  AFFIRMATION_COMPLETION = 'affirmation_completion',
  
  // Dedicated Tracks
  TRACK_REMINDER = 'track_reminder',
  TRACK_SUGGESTION = 'track_suggestion',
  
  // Daydreaming & Reflection
  DAYDREAM_LOG_REMINDER = 'daydream_log_reminder',
  MESSAGE_DELIVERY = 'message_delivery',
  MESSAGE_INSIGHT = 'message_insight',
  
  // Habit Tracker
  HABIT_CHECK_IN = 'habit_check_in',
  HABIT_STREAK = 'habit_streak',
  HABIT_COMPLETION = 'habit_completion',
  
  // Belief Strength Analytics
  PROGRESS_UPDATE = 'progress_update',
  MILESTONE_ACHIEVEMENT = 'milestone_achievement',
  WEEKLY_REPORT = 'weekly_report',
  
  // Engagement & Motivation
  DAILY_STREAK = 'daily_streak',
  WEEKLY_CONSISTENCY = 'weekly_consistency',
  RE_ENGAGEMENT = 're_engagement'
}

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  priority?: 'default' | 'normal' | 'high';
}

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  sessionReminders: boolean;
  boostNotifications: boolean;
  affirmations: boolean;
  daydreamLogs: boolean;
  habitTracking: boolean;
  progressUpdates: boolean;
  achievements: boolean;
  reEngagement: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  maxDailyNotifications: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationHistory {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sentAt: Date;
  readAt?: Date;
  clickedAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  variables: string[]; // Array of variable names that can be replaced
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSchedule {
  id: string;
  userId: string;
  type: NotificationType;
  scheduledAt: Date;
  data?: Record<string, any>;
  isRecurring: boolean;
  recurringPattern?: string; // cron-like pattern
  isActive: boolean;
  createdAt: Date;
} 