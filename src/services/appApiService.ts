import { secureApiService } from './secureApiService';
import type { 
  AIAnalysisRequest, 
  VoiceRequest, 
  NotificationRequest,
  AnalyticsEvent,
  AIAnalysisResponse,
  VoiceResponse,
  ApiResponse,
  PaymentRequest
} from './secureApiService';
import type { MoodLog } from '../types/database';

interface BeliefSentimentAnalysis {
  sentiment: number;
  suggestions: string[];
  insights: Record<string, unknown>;
}

interface MoodAnalysis {
  mood: number;
  confidence: number;
  insights: string[];
}

interface JournalInsights {
  insights: Record<string, unknown>;
  suggestions: string[];
}

interface MoodPattern {
  trend: 'improving' | 'declining' | 'stable';
  insights: string[];
  recommendations: string[];
}

interface UsageLimits {
  canUseAI: boolean;
  canUseVoice: boolean;
  remainingCredits: number;
  subscriptionTier: string;
}

/**
 * High-level service for common app functions
 * Uses the secure API service under the hood
 */
class AppApiService {
  
  // ============= BELIEF & AFFIRMATION SERVICES =============
  
  async generateAffirmationsForBelief(beliefText: string): Promise<string[]> {
    const result = await secureApiService.generateAffirmations(beliefText, 5);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate affirmations');
    }
    
    return result.data || [];
  }

  async analyzeBeliefSentiment(beliefText: string): Promise<BeliefSentimentAnalysis> {
    const request: AIAnalysisRequest = {
      text: beliefText,
      analysis_type: 'sentiment'
    };

    const result = await secureApiService.analyzeText(request);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze belief');
    }

    return {
      sentiment: result.data?.sentiment_score || 0,
      suggestions: result.data?.suggestions || [],
      insights: result.data?.insights || {}
    };
  }

  // ============= VOICE & AUDIO SERVICES =============
  
  async generateAffirmationAudio(
    affirmationText: string, 
    userVoiceId?: string
  ): Promise<string> {
    const request: VoiceRequest = {
      text: affirmationText,
      voice_id: userVoiceId,
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.85
      }
    };

    const result = await secureApiService.generateSpeech(request);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate audio');
    }

    return result.data?.audio_url || '';
  }

  async cloneUserVoice(audioFiles: string[], voiceName: string): Promise<string> {
    const result = await secureApiService.cloneVoice(audioFiles, voiceName);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to clone voice');
    }

    return result.data?.voice_id || '';
  }

  // ============= MOOD & JOURNAL ANALYSIS =============
  
  async analyzeMoodFromText(journalText: string): Promise<MoodAnalysis> {
    const request: AIAnalysisRequest = {
      text: journalText,
      analysis_type: 'mood_detection'
    };

    const result = await secureApiService.analyzeText(request);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze mood');
    }

    return {
      mood: result.data?.mood_prediction || 5,
      confidence: result.data?.confidence || 0.5,
      insights: result.data?.suggestions || []
    };
  }

  async getJournalInsights(journalText: string): Promise<JournalInsights> {
    const request: AIAnalysisRequest = {
      text: journalText,
      analysis_type: 'insights'
    };

    const result = await secureApiService.analyzeText(request);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get insights');
    }

    return {
      insights: result.data?.insights || {},
      suggestions: result.data?.suggestions || []
    };
  }

  async analyzeMoodPattern(moodLogs: MoodLog[]): Promise<MoodPattern> {
    const result = await secureApiService.analyzeMoodPattern(moodLogs);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze mood pattern');
    }

    return result.data || {
      trend: 'stable',
      insights: [],
      recommendations: []
    };
  }

  // ============= NOTIFICATION SERVICES =============
  
  async sendDailyReminder(
    title: string = "Time for your daily reflection",
    message: string = "Take a moment to check in with yourself today"
  ): Promise<boolean> {
    const userTokens = await this.getUserPushTokens();
    
    if (userTokens.length === 0) {
      return false;
    }

    const request: NotificationRequest = {
      title,
      message,
      user_tokens: userTokens,
      data: {
        type: 'daily_reminder',
        action: 'open_mood_log'
      }
    };

    const result = await secureApiService.sendPushNotification(request);
    return result.success;
  }

  async scheduleAffirmationReminder(
    affirmationText: string,
    scheduledTime: Date
  ): Promise<boolean> {
    const userTokens = await this.getUserPushTokens();
    
    if (userTokens.length === 0) {
      return false;
    }

    const request: NotificationRequest = {
      title: "Your Daily Affirmation",
      message: affirmationText,
      user_tokens: userTokens,
      scheduled_for: scheduledTime.toISOString(),
      data: {
        type: 'affirmation_reminder',
        action: 'open_affirmations'
      }
    };

    const result = await secureApiService.sendPushNotification(request);
    return result.success;
  }

  // ============= ANALYTICS TRACKING =============
  
  async trackBeliefProgress(beliefId: string, action: string): Promise<void> {
    const event: AnalyticsEvent = {
      event_name: 'belief_progress',
      properties: {
        belief_id: beliefId,
        action: action, // 'created', 'practiced', 'completed'
        timestamp: new Date().toISOString()
      }
    };

    await secureApiService.trackEvent(event);
  }

  async trackMoodLog(mood: number, activities: string[]): Promise<void> {
    const event: AnalyticsEvent = {
      event_name: 'mood_logged',
      properties: {
        mood_value: mood,
        activities: activities,
        timestamp: new Date().toISOString()
      }
    };

    await secureApiService.trackEvent(event);
  }

  async trackAppUsage(screenName: string, duration: number): Promise<void> {
    const event: AnalyticsEvent = {
      event_name: 'screen_view',
      properties: {
        screen_name: screenName,
        duration_seconds: duration,
        timestamp: new Date().toISOString()
      }
    };

    await secureApiService.trackEvent(event);
  }

  // ============= USER SUBSCRIPTION & LIMITS =============
  
  async checkUsageLimits(): Promise<UsageLimits> {
    const result = await secureApiService.getUsageSummary();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to check usage limits');
    }

    const data = result.data!;
    const limits = data.usage_limits;
    const currentUsage = data.api_usage_by_service;

    return {
      canUseAI: (currentUsage.openai || 0) < (limits.openai || 10),
      canUseVoice: (currentUsage.elevenlabs || 0) < (limits.elevenlabs || 5),
      remainingCredits: Math.max(0, (limits.total || 100) - (data.current_month_cost || 0)),
      subscriptionTier: data.subscription_tier
    };
  }

  async upgradeSubscription(tier: 'premium' | 'pro'): Promise<boolean> {
    const request: PaymentRequest = {
      amount_cents: tier === 'premium' ? 999 : 1999,
      currency: 'usd',
      subscription_tier: tier
    };

    const result = await secureApiService.createSubscription(request);
    return result.success;
  }
  
  async uploadVoiceRecording(audioBase64: string, fileName: string): Promise<string> {
    const result = await secureApiService.uploadFile(
      audioBase64,
      fileName,
      'audio'
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload voice recording');
    }

    return result.data?.file_url || '';
  }
  
  private async getUserPushTokens(): Promise<string[]> {
    // Implementation would typically fetch from user profile or device storage
    return [];
  }

  // ============= ERROR HANDLING =============
  
  async handleApiError(error: Error | unknown, context: string): Promise<void> {
    console.error(`API Error in ${context}:`, error);
    
    // Track error for analytics
    const event: AnalyticsEvent = {
      event_name: 'api_error',
      properties: {
        context,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    };

    try {
      await secureApiService.trackEvent(event);
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }
}

export const appApiService = new AppApiService(); 