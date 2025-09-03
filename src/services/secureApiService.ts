import { supabase } from '../lib/supabase';
import type { ApiUsageInsert } from '../types/database';
import { EXPO_PUBLIC_BACKEND_API_URL } from '@env';

const BACKEND_API_URL = EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cost_cents?: number;
}

export interface AIAnalysisRequest {
  text: string;
  analysis_type: 'sentiment' | 'insights' | 'suggestions' | 'mood_detection';
}

export interface AIAnalysisResponse {
  sentiment_score: number;
  insights: Record<string, any>;
  suggestions: string[];
  mood_prediction: number;
  confidence: number;
}

export interface VoiceRequest {
  text: string;
  voice_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
  };
}

export interface VoiceResponse {
  audio_url: string;
  audio_duration: number;
  voice_id: string;
}

export interface NotificationRequest {
  title: string;
  message: string;
  user_tokens: string[];
  data?: Record<string, any>;
  scheduled_for?: string;
}

export interface EmailRequest {
  to: string;
  template: 'welcome' | 'password_reset' | 'progress_report' | 'reminder';
  variables: Record<string, any>;
}

export interface PaymentRequest {
  amount_cents: number;
  currency: 'usd';
  subscription_tier: 'premium' | 'pro';
  payment_method_id?: string;
}

export interface AnalyticsEvent {
  event_name: string;
  properties: Record<string, any>;
  user_properties?: Record<string, any>;
}

class SecureApiService {
  private async makeAuthenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('No valid auth session');
      }

      const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        cost_cents: data.cost_cents || 0
      };
    } catch (error) {
      console.error(`[SECURE_API] Request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cost_cents: 0
      };
    }
  }

  private async logApiUsage(
    service: string,
    requestType: string,
    success: boolean,
    errorMessage?: string,
    costCents: number = 0
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const apiUsage: ApiUsageInsert = {
        user_id: user.id,
        service_name: service,
        endpoint: `/${service}/${requestType}`,
        request_type: requestType,
        request_date: new Date().toISOString().split('T')[0],
        cost_cents: costCents,
        success,
        error_message: errorMessage,
      };

      await supabase.from('api_usage').insert(apiUsage);
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
  }

  // ============= AI SERVICES (OpenAI, etc.) =============
  
  async analyzeText(request: AIAnalysisRequest): Promise<ApiResponse<AIAnalysisResponse>> {
    const result = await this.makeAuthenticatedRequest<AIAnalysisResponse>(
      '/ai/analyze',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    await this.logApiUsage(
      'openai',
      request.analysis_type,
      result.success,
      result.error,
      result.cost_cents
    );

    return result;
  }

  async generateAffirmations(beliefText: string, count: number = 5): Promise<ApiResponse<string[]>> {
    const result = await this.makeAuthenticatedRequest<string[]>(
      '/ai/generate-affirmations',
      {
        method: 'POST',
        body: JSON.stringify({ belief_text: beliefText, count }),
      }
    );

    await this.logApiUsage(
      'openai',
      'generate_affirmations',
      result.success,
      result.error,
      result.cost_cents
    );

    return result;
  }

  async analyzeMoodPattern(moodLogs: any[]): Promise<ApiResponse<any>> {
    const result = await this.makeAuthenticatedRequest(
      '/ai/analyze-mood-pattern',
      {
        method: 'POST',
        body: JSON.stringify({ mood_logs: moodLogs }),
      }
    );

    await this.logApiUsage(
      'openai',
      'mood_analysis',
      result.success,
      result.error,
      result.cost_cents
    );

    return result;
  }

  // ============= VOICE SERVICES (ElevenLabs) =============
  
  async generateSpeech(request: VoiceRequest): Promise<ApiResponse<VoiceResponse>> {
    const result = await this.makeAuthenticatedRequest<VoiceResponse>(
      '/voice/generate-speech',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    await this.logApiUsage(
      'elevenlabs',
      'text_to_speech',
      result.success,
      result.error,
      result.cost_cents
    );

    return result;
  }

  async cloneVoice(audioFiles: string[], name: string): Promise<ApiResponse<{ voice_id: string }>> {
    const result = await this.makeAuthenticatedRequest<{ voice_id: string }>(
      '/voice/clone',
      {
        method: 'POST',
        body: JSON.stringify({ audio_files: audioFiles, name }),
      }
    );

    await this.logApiUsage(
      'elevenlabs',
      'voice_clone',
      result.success,
      result.error,
      result.cost_cents
    );

    return result;
  }

  // ============= NOTIFICATION SERVICES =============
  
  async sendPushNotification(request: NotificationRequest): Promise<ApiResponse<{ sent_count: number }>> {
    const result = await this.makeAuthenticatedRequest<{ sent_count: number }>(
      '/notifications/push',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    await this.logApiUsage(
      'fcm',
      'push_notification',
      result.success,
      result.error
    );

    return result;
  }

  async scheduleReminder(
    title: string,
    message: string,
    scheduledFor: string
  ): Promise<ApiResponse<{ notification_id: string }>> {
    const result = await this.makeAuthenticatedRequest<{ notification_id: string }>(
      '/notifications/schedule',
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          message,
          scheduled_for: scheduledFor,
        }),
      }
    );

    await this.logApiUsage(
      'fcm',
      'schedule_notification',
      result.success,
      result.error
    );

    return result;
  }

  // ============= EMAIL SERVICES =============
  
  async sendEmail(request: EmailRequest): Promise<ApiResponse<{ message_id: string }>> {
    const result = await this.makeAuthenticatedRequest<{ message_id: string }>(
      '/email/send',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    await this.logApiUsage(
      'sendgrid',
      `email_${request.template}`,
      result.success,
      result.error
    );

    return result;
  }

  // ============= PAYMENT SERVICES =============
  
  async createSubscription(request: PaymentRequest): Promise<ApiResponse<{ subscription_id: string }>> {
    const result = await this.makeAuthenticatedRequest<{ subscription_id: string }>(
      '/payments/subscribe',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    await this.logApiUsage(
      'stripe',
      'create_subscription',
      result.success,
      result.error
    );

    return result;
  }

  async cancelSubscription(): Promise<ApiResponse<{ cancelled_at: string }>> {
    const result = await this.makeAuthenticatedRequest<{ cancelled_at: string }>(
      '/payments/cancel',
      {
        method: 'POST',
      }
    );

    await this.logApiUsage(
      'stripe',
      'cancel_subscription',
      result.success,
      result.error
    );

    return result;
  }

  // ============= ANALYTICS SERVICES =============
  
  async trackEvent(event: AnalyticsEvent): Promise<ApiResponse<void>> {
    const result = await this.makeAuthenticatedRequest<void>(
      '/analytics/track',
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );

    await this.logApiUsage(
      'mixpanel',
      'track_event',
      result.success,
      result.error
    );

    return result;
  }

  async updateUserProperties(properties: Record<string, any>): Promise<ApiResponse<void>> {
    const result = await this.makeAuthenticatedRequest<void>(
      '/analytics/user-properties',
      {
        method: 'POST',
        body: JSON.stringify(properties),
      }
    );

    await this.logApiUsage(
      'mixpanel',
      'update_user_properties',
      result.success,
      result.error
    );

    return result;
  }

  // ============= FILE UPLOAD SERVICES =============
  
  async uploadFile(
    file: string, // Base64 encoded file
    fileName: string,
    fileType: 'audio' | 'image' | 'document'
  ): Promise<ApiResponse<{ file_url: string }>> {
    const result = await this.makeAuthenticatedRequest<{ file_url: string }>(
      '/files/upload',
      {
        method: 'POST',
        body: JSON.stringify({
          file,
          file_name: fileName,
          file_type: fileType,
        }),
      }
    );

    await this.logApiUsage(
      'cloudinary',
      'file_upload',
      result.success,
      result.error
    );

    return result;
  }

  // ============= USAGE MONITORING =============
  
  async getUsageSummary(): Promise<ApiResponse<{
    current_month_cost: number;
    api_usage_by_service: Record<string, number>;
    subscription_tier: string;
    usage_limits: Record<string, number>;
  }>> {
    return this.makeAuthenticatedRequest('/usage/summary');
  }

  async checkRateLimit(service: string): Promise<ApiResponse<{
    can_make_request: boolean;
    requests_remaining: number;
    reset_time: string;
  }>> {
    return this.makeAuthenticatedRequest(`/usage/rate-limit/${service}`);
  }
}

export const secureApiService = new SecureApiService(); 