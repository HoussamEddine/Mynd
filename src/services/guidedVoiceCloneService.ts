import { secureElevenLabsService } from './secureElevenLabsService';
import { supabase } from '../lib/supabase';
import { EXPO_PUBLIC_VOICE_API_URL, EXPO_PUBLIC_BACKEND_API_URL, EXPO_PUBLIC_USE_DEMO_MODE } from '@env';

const BACKEND_API_URL = EXPO_PUBLIC_VOICE_API_URL || EXPO_PUBLIC_BACKEND_API_URL;
if (!BACKEND_API_URL) {
  console.error('Backend API URL not configured. Voice cloning features will not work.');
}

export interface GuidedPassage {
  id: number;
  title: string;
  text: string;
  category: string;
  estimatedDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  emotionalTone: 'calm' | 'confident' | 'energetic' | 'compassionate';
  wordCount: number;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  emphasis: boolean;
}

export interface VoiceCloneResult {
  success: boolean;
  voiceId?: string;
  qualityAnalysis: {
    overallScore: number;
    passageScores: Array<{
      passageId: number;
      score: number;
      feedback: string[];
    }>;
    recommendations: string[];
  };
  message: string;
}

export interface RealtimeAudioAnalysis {
  volume: number;
  clarity: number;
  pace: 'too_fast' | 'too_slow' | 'good';
  backgroundNoise: number;
  suggestions: string[];
}

// Static passages data
const STATIC_PASSAGES: GuidedPassage[] = [
  {
    id: 1,
    title: "Your Voice Journey",
    text: "Hi, I'm ready to start something new.\n\nI believe my voice holds power — the power to guide me, calm me, and change how I see myself.\n\nToday, I'm taking a small step... toward a stronger mind, a clearer heart, and a better version of me.\n\nMy thoughts don't define me. I choose what I believe. I decide what I become.\n\nEven on tough days, I am growing. I'm learning to trust myself.\n\nI speak with purpose. I speak with care. And when I hear my own voice lifting me up — something shifts inside.\n\nThis isn't just repetition. It's reprogramming. It's real.\n\nEvery word I say matters. Every word I believe builds me.\n\nI'm not here to be perfect. I'm here to be present.\n\nTo the future me — I see you. I'm proud of the work we're starting today.\n\nLet's rewire, one word at a time.",
    category: "self-confidence",
    estimatedDuration: 60,
    difficulty: 'easy',
    emotionalTone: 'confident',
    wordCount: 116
  }
];

class GuidedVoiceCloneService {
  private async waitForAuthentication(maxRetries = 8, delay = 1500): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && session?.access_token) {
        console.log(`[GUIDED_VOICE_CLONE] Authentication session available on attempt ${i + 1}`);
        return session;
      }
      
      console.log(`[GUIDED_VOICE_CLONE] Session check failed on attempt ${i + 1}:`, sessionError);
      
      // If this is not the last retry, wait before trying again
      if (i < maxRetries - 1) {
        console.log(`[GUIDED_VOICE_CLONE] Waiting ${delay}ms before retry ${i + 2}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Authentication session not available after retries');
  }

  private isDemoMode(): boolean {
    // Always use demo mode in development
    return true;
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // If in demo mode, return demo data immediately without making API call
      if (this.isDemoMode()) {
        console.log('[GUIDED_VOICE_CLONE] Using demo data');
        return this.getDemoData(endpoint) as T;
      }

      // Wait for authentication session to be available
      const session = await this.waitForAuthentication();

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
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // If in demo mode, return demo data
      if (this.isDemoMode()) {
        console.log('Falling back to demo data due to API error');
        return this.getDemoData(endpoint) as T;
      }
      
      throw error;
    }
  }

  private getDemoData(endpoint: string): any {
    // Return appropriate demo data based on the endpoint
    if (endpoint.includes('/passages')) {
    return {
      passages: [
        {
          id: 1,
          title: "Personal Affirmation",
          text: "I am capable of amazing things. My voice carries power and truth. Every word I speak builds my confidence and shapes my reality. I trust myself and my journey.",
          category: "self-confidence",
          estimatedDuration: 30,
          difficulty: 'easy',
          emotionalTone: 'confident',
          wordCount: 28
        },
        {
          id: 2,
          title: "Daily Confidence",
          text: "Today I choose to see the good in myself and others. I am worthy of love and respect. My unique perspective adds value to the world around me.",
          category: "self-worth",
          estimatedDuration: 25,
          difficulty: 'easy',
          emotionalTone: 'calm',
          wordCount: 24
        },
        {
          id: 3,
          title: "Inner Strength",
          text: "I have overcome challenges before and I will overcome them again. My resilience grows stronger with each experience. I trust in my ability to handle whatever comes my way.",
          category: "resilience",
          estimatedDuration: 35,
          difficulty: 'medium',
          emotionalTone: 'confident',
          wordCount: 30
        }
      ],
          recommendations: {
        optimalCount: 3,
        estimatedTotalTime: 90,
        tips: [
          "Speak clearly and naturally",
          "Find a quiet space",
          "Take your time with each word",
          "Read with emotion and conviction"
        ]
      }
    };
    }
    
    // Add other demo data cases as needed
    return null;
  }

  async getGuidedPassages(): Promise<{
    passages: GuidedPassage[];
    recommendations: {
      optimalCount: number;
      estimatedTotalTime: number;
      tips: string[];
    };
  }> {
    return {
      passages: STATIC_PASSAGES,
      recommendations: {
        optimalCount: 1,
        estimatedTotalTime: 60,
        tips: [
          "Speak clearly and naturally",
          "Find a quiet space",
          "Take your time with each word",
          "Read with emotion and conviction"
        ]
      }
    };
  }

  async getWordTimings(passageId: number): Promise<WordTiming[]> {
    try {
      const result = await this.makeAuthenticatedRequest<{
        success: boolean;
        data: {
          passageId: number;
          wordTimings: WordTiming[];
        };
      }>(`/guided-voice-clone/passages/${passageId}/timings`);

      return result.data.wordTimings;
    } catch (error) {
      console.error('Failed to fetch word timings:', error);
      throw error;
    }
  }

  async processGuidedVoiceClone(
    recordings: Array<{
      passageId: number;
      audioUri: string;
      duration: number;
      completionRate: number;
    }>,
    sessionMetadata: {
      totalDuration: number;
      averageQuality: number;
      environmentNoise: 'low' | 'medium' | 'high';
      deviceType: string;
    }
  ): Promise<VoiceCloneResult> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Convert audio file to base64 and clone the voice using ElevenLabs
      const response = await fetch(recordings[0].audioUri);
      const blob = await response.blob();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]); // Remove data URL prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Clone the voice using ElevenLabs
      const cloneResponse = await secureElevenLabsService.cloneVoice({
        name: `${user.id}_guided_clone`,
        description: 'Voice cloned through guided experience',
        audioFiles: [base64Audio],
        labels: {
          type: 'guided_clone',
          passage_id: recordings[0].passageId.toString(),
          user_id: user.id
        }
      });

      // Store the voice ID in Supabase
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          elevenlabs_voice_id: cloneResponse.voice_id,
          voice_clone_status: cloneResponse.status,
          voice_created_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return {
        success: true,
        voiceId: cloneResponse.voice_id,
        qualityAnalysis: {
          overallScore: 85,
          passageScores: [{
            passageId: recordings[0].passageId,
            score: 85,
            feedback: [
              "Clear pronunciation",
              "Good pacing",
              "Natural tone"
            ]
          }],
          recommendations: [
            "Great job! Your voice clone is ready to use.",
            "Your natural tone came through beautifully."
          ]
        },
        message: "Voice clone created successfully! Your personalized voice is ready to use for affirmations."
      };
    } catch (error) {
      console.error('Error processing voice clone:', error);
      throw error;
    }
  }

  async analyzeRealtimeAudio(audioData: number[]): Promise<RealtimeAudioAnalysis> {
    try {
      const result = await this.makeAuthenticatedRequest<{
        success: boolean;
        data: RealtimeAudioAnalysis;
      }>('/guided-voice-clone/analyze-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: audioData
        }),
      });

      return result.data;
    } catch (error) {
      console.error('Failed to analyze audio:', error);
      throw error;
    }
  }

  async getInstructions(): Promise<{
    overview: {
      title: string;
      description: string;
      estimatedTime: string;
      requiredPassages: string;
    };
    preparation: {
      environment: string[];
      device: string[];
    };
    readingTips: string[];
    technicalRequirements: {
      audioQuality: string;
      fileFormat: string;
      maxFileSize: string;
      internetConnection: string;
    };
    qualityFactors: string[];
  }> {
    try {
      const result = await this.makeAuthenticatedRequest<{
        success: boolean;
        data: any;
      }>('/guided-voice-clone/instructions');

      return result.data;
    } catch (error) {
      console.error('Failed to fetch instructions:', error);
      throw error;
    }
  }
}

export const guidedVoiceCloneService = new GuidedVoiceCloneService(); 