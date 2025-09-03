import { supabase } from '../lib/supabase';
import { errorHandlerService } from './errorHandlerService';
import { EXPO_PUBLIC_BACKEND_API_URL } from '@env';

export interface VoiceCloneRequest {
  audioBuffer: string;
  quality?: 'low' | 'medium' | 'high';
  metadata?: any;
}

export interface SpeechGenerationRequest {
  text: string;
  voiceId: string;
  speed?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
}

class VoiceApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    };
  }

  async cloneVoice(request: VoiceCloneRequest): Promise<{ jobId: string; message: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_API_URL}/voice/clone`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Voice cloning failed');
      }

      return await response.json();
    } catch (error) {
      errorHandlerService.logError(error, 'VOICE_API - cloneVoice');
      throw error;
    }
  }

  async generateSpeech(request: SpeechGenerationRequest): Promise<{ jobId: string; message: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_API_URL}/voice/generate-speech`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Speech generation failed');
      }

      return await response.json();
    } catch (error) {
      errorHandlerService.logError(error, 'VOICE_API - generateSpeech');
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_API_URL}/voice/job/${jobId}`, {
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get job status');
      }

      return await response.json();
    } catch (error) {
      errorHandlerService.logError(error, 'VOICE_API - getJobStatus');
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; services: any }> {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_API_URL}/voice/health`);
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      errorHandlerService.logError(error, 'VOICE_API - healthCheck');
      throw error;
    }
  }
}

export const voiceApiService = new VoiceApiService();
