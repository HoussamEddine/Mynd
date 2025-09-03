import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import Constants from 'expo-constants';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = Constants.expoConfig?.extra?.elevenLabsApiKey;

if (!ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY is not set in environment variables');
}

export interface VoiceCloneRequest {
  name: string;
  description?: string;
  files: File[];
  labels?: Record<string, string>;
}

export interface VoiceCloneResponse {
  voice_id: string;
  name: string;
  samples: Array<{
    sample_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    hash: string;
  }>;
  category: string;
  fine_tuning: {
    is_allowed_to_fine_tune: boolean;
    finetuning_requested: boolean;
    finetuning_state: string;
    verification_attempts: any[];
    verification_failures: any[];
    verification_attempts_count: number;
    slice_ids: any[];
    manual_verification: any;
    manual_verification_requested: boolean;
  };
  labels: Record<string, string>;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
  settings: any;
  sharing: any;
  high_quality_base_model_ids: string[];
  safety_control: any;
  voice_verification: {
    requires_verification: boolean;
    is_verified: boolean;
    verification_failures: any[];
    verification_attempts_count: number;
    language: any;
  };
  permission_on_resource: any;
}

export interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface TextToSpeechResponse {
  audio: ArrayBuffer;
  content_type: string;
}

class ElevenLabsService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${ELEVENLABS_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Handle binary responses (audio)
    if (response.headers.get('content-type')?.includes('audio/')) {
      const arrayBuffer = await response.arrayBuffer();
      return {
        audio: arrayBuffer,
        content_type: response.headers.get('content-type') || 'audio/mpeg',
      } as T;
    }

    return response.json();
  }

  private async logApiUsage(
    userId: string,
    requestType: string,
    endpoint: string,
    success: boolean,
    errorMessage?: string,
    tokensUsed: number = 0,
    costCents: number = 0
  ) {
    try {
      const apiUsage = {
        user_id: userId,
        service_name: 'elevenlabs',
        endpoint,
        request_type: requestType,
        request_date: new Date().toISOString().split('T')[0],
        tokens_used: tokensUsed,
        cost_cents: costCents,
        success,
        error_message: errorMessage,
      } as const;

      await supabase.from('api_usage').insert(apiUsage);
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
  }

  async cloneVoice(
    userId: string,
    request: VoiceCloneRequest
  ): Promise<VoiceCloneResponse> {
    try {
      const formData = new FormData();
      formData.append('name', request.name);
      
      if (request.description) {
        formData.append('description', request.description);
      }

      // Add audio files
      request.files.forEach((file, index) => {
        formData.append('files', file as any);
      });

      if (request.labels) {
        formData.append('labels', JSON.stringify(request.labels));
      }

      const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        await this.logApiUsage(
          userId,
          'voice_clone',
          '/voices/add',
          false,
          errorText
        );
        throw new Error(`Voice cloning failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      await this.logApiUsage(
        userId,
        'voice_clone',
        '/voices/add',
        true,
        undefined,
        0,
        1000 // Estimated cost in cents
      );

      return result;
    } catch (error) {
      await this.logApiUsage(
        userId,
        'voice_clone',
        '/voices/add',
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  async generateSpeech(
    userId: string,
    request: TextToSpeechRequest
  ): Promise<TextToSpeechResponse> {
    try {
      const payload = {
        text: request.text,
        model_id: request.model_id || 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
          ...request.voice_settings,
        },
      };

      const response = await this.makeRequest<TextToSpeechResponse>(
        `/text-to-speech/${request.voice_id}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      await this.logApiUsage(
        userId,
        'text_to_speech',
        `/text-to-speech/${request.voice_id}`,
        true,
        undefined,
        request.text.length,
        Math.ceil(request.text.length * 0.1) // Estimated cost based on character count
      );

      return response;
    } catch (error) {
      await this.logApiUsage(
        userId,
        'text_to_speech',
        `/text-to-speech/${request.voice_id}`,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      const response = await this.makeRequest<{ voices: any[] }>('/voices');
      return response.voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      throw error;
    }
  }

  async getVoice(voiceId: string): Promise<any> {
    try {
      return await this.makeRequest(`/voices/${voiceId}`);
    } catch (error) {
      console.error(`Failed to fetch voice ${voiceId}:`, error);
      throw error;
    }
  }

  async deleteVoice(userId: string, voiceId: string): Promise<void> {
    try {
      await this.makeRequest(`/voices/${voiceId}`, {
        method: 'DELETE',
      });

      await this.logApiUsage(
        userId,
        'voice_delete',
        `/voices/${voiceId}`,
        true
      );
    } catch (error) {
      await this.logApiUsage(
        userId,
        'voice_delete',
        `/voices/${voiceId}`,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  async getVoiceSettings(voiceId: string): Promise<any> {
    try {
      return await this.makeRequest(`/voices/${voiceId}/settings`);
    } catch (error) {
      console.error(`Failed to fetch voice settings for ${voiceId}:`, error);
      throw error;
    }
  }

  async updateVoiceSettings(
    voiceId: string,
    settings: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    }
  ): Promise<any> {
    try {
      return await this.makeRequest(`/voices/${voiceId}/settings/edit`, {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error(`Failed to update voice settings for ${voiceId}:`, error);
      throw error;
    }
  }

  // Helper method to convert audio ArrayBuffer to base64 for storage
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Helper method to convert base64 back to ArrayBuffer for playback
  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const elevenLabsService = new ElevenLabsService(); 