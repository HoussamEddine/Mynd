import { EXPO_PUBLIC_BACKEND_API_URL, EXPO_PUBLIC_VOICE_API_URL } from '@env';
import { supabase } from '../lib/supabase';
import type { ApiUsageInsert } from '../types/database';

const BACKEND_API_URL = EXPO_PUBLIC_VOICE_API_URL || EXPO_PUBLIC_BACKEND_API_URL;
if (!BACKEND_API_URL) {
  console.error('Backend API URL not configured. Voice cloning features will not work.');
}

export interface VoiceCloneRequest {
  name: string;
  description?: string;
  audioFiles: string[]; // Base64 encoded audio files
  labels?: Record<string, string>;
}

export interface VoiceCloneResponse {
  voice_id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  preview_url?: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface TextToSpeechResponse {
  audio_url: string; // URL to download the generated audio
  audio_duration: number;
  cost_cents: number;
}

class SecureElevenLabsService {
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('User must be authenticated to use voice services');
    }

    const url = `${BACKEND_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  private async logApiUsage(
    userId: string,
    requestType: string,
    success: boolean,
    errorMessage?: string,
    costCents: number = 0
  ) {
    try {
      const apiUsage: ApiUsageInsert = {
        user_id: userId,
        service_name: 'elevenlabs',
        endpoint: '/voice-services',
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

  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await this.makeAuthenticatedRequest<VoiceCloneResponse>(
        '/voice/clone',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      await this.logApiUsage(
        user.id,
        'voice_clone',
        true,
        undefined,
        1000 // Estimated cost
      );

      return response;
    } catch (error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.logApiUsage(
          user.id,
          'voice_clone',
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      throw error;
    }
  }

  async generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await this.makeAuthenticatedRequest<TextToSpeechResponse>(
        '/voice/generate-speech',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      await this.logApiUsage(
        user.id,
        'text_to_speech',
        true,
        undefined,
        response.cost_cents
      );

      return response;
    } catch (error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.logApiUsage(
          user.id,
          'text_to_speech',
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      throw error;
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest<{ voices: any[] }>('/voice/list');
      return response.voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      throw error;
    }
  }

  async getVoice(voiceId: string): Promise<any> {
    try {
      return await this.makeAuthenticatedRequest(`/voice/${voiceId}`);
    } catch (error) {
      console.error(`Failed to fetch voice ${voiceId}:`, error);
      throw error;
    }
  }

  async deleteVoice(voiceId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await this.makeAuthenticatedRequest(`/voice/${voiceId}`, {
        method: 'DELETE',
      });

      await this.logApiUsage(
        user.id,
        'voice_delete',
        true
      );
    } catch (error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.logApiUsage(
          user.id,
          'voice_delete',
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      throw error;
    }
  }

  // Check user's subscription and usage limits
  async checkUsageLimits(): Promise<{
    canUseVoiceCloning: boolean;
    canGenerateSpeech: boolean;
    remainingCredits: number;
    subscriptionTier: string;
  }> {
    try {
      return await this.makeAuthenticatedRequest('/voice/usage-limits');
    } catch (error) {
      console.error('Failed to check usage limits:', error);
      throw error;
    }
  }
}

export const secureElevenLabsService = new SecureElevenLabsService(); 