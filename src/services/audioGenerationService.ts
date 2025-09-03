import { supabase } from '../lib/supabase';
import { secureElevenLabsService } from './secureElevenLabsService';
import { audioCache } from './cacheService';

export interface AudioGenerationRequest {
  text: string;
  voice_id: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
}

export interface AudioGenerationResponse {
  audio_url: string;
  success: boolean;
  error?: string;
  audio_id?: string; // ID of stored audio record
}

class AudioGenerationService {
  async generateAudio(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    try {
      // Use the existing secure service to generate speech
      const response = await secureElevenLabsService.generateSpeech({
        text: request.text,
        voice_id: request.voice_id,
        voice_settings: request.voice_settings || {
          stability: 0.75,
          similarity_boost: 0.85
        }
      });

      if (!response.audio_url) {
        throw new Error('No audio URL received from ElevenLabs');
      }

      // Download the audio file from the URL
      const audioResponse = await fetch(response.audio_url);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.status}`);
      }

      const audioBlob = await audioResponse.blob();
      
      // Upload to Supabase Storage
      const fileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mpeg',
          cacheControl: '3600'
        });

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      return {
        audio_url: publicUrl,
        success: true
      };
    } catch (error) {
      console.error('Error generating audio:', error);
      return {
        audio_url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateAudioForAffirmation(affirmationText: string, voiceId: string, beliefId: string, affirmationIndex: number = 0): Promise<AudioGenerationResponse> {
    try {
      // Check if audio already exists in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check user's subscription tier
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      const isFreeUser = userData?.subscription_tier === 'free';

      // For free users, only allow first affirmation
      if (isFreeUser && affirmationIndex > 0) {
        return {
          audio_url: '',
          success: false,
          error: 'UPGRADE_REQUIRED'
        };
      }

      // Check for existing audio
      const { data: existingAudio } = await supabase
        .from('ai_audio_content')
        .select('audio_url, id, content_metadata')
        .eq('user_id', user.id)
        .eq('belief_id', beliefId)
        .eq('content_type', 'affirmation')
        .eq('source_text', affirmationText)
        .eq('voice_id', voiceId)
        .single();

      if (existingAudio?.audio_url) {
        return {
          audio_url: existingAudio.audio_url,
          success: true,
          audio_id: existingAudio.id
        };
      }

      // Generate new audio
      const result = await this.generateAudio({
        text: affirmationText,
        voice_id: voiceId,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85
        }
      });

      if (result.success) {
        // Store in database
        const { data: inserted, error: insertError } = await supabase
          .from('ai_audio_content')
          .insert({
            user_id: user.id,
            belief_id: beliefId,
            content_type: 'affirmation',
            source_text: affirmationText,
            audio_url: result.audio_url,
            voice_type: 'user_cloned_voice',
            generation_date: new Date().toISOString().split('T')[0],
            is_active: true,
            content_metadata: {
              affirmation_index: affirmationIndex,
              is_free_tier: isFreeUser
            }
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error storing affirmation audio:', insertError);
        } else {
          result.audio_id = inserted.id;
        }

        // Cache the result
        await audioCache.set('affirmation_audio', { 
          userId: user.id, 
          beliefId, 
          affirmationText 
        }, result);
      }

      return result;
    } catch (error) {
      console.error('Error generating affirmation audio:', error);
      return {
        audio_url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateAudioForDailyBoost(dailyBoostText: string, voiceId: string, beliefId: string): Promise<AudioGenerationResponse> {
    try {
      // Check if audio already exists in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check for existing audio
      const { data: existingAudio } = await supabase
        .from('ai_audio_content')
        .select('audio_url, id')
        .eq('user_id', user.id)
        .eq('belief_id', beliefId)
        .eq('content_type', 'daily_boost')
        .eq('source_text', dailyBoostText)
        .eq('voice_id', voiceId)
        .single();

      if (existingAudio?.audio_url) {
        return {
          audio_url: existingAudio.audio_url,
          success: true,
          audio_id: existingAudio.id
        };
      }

      // Generate new audio
      const audioResult = await this.generateAudio({
        text: dailyBoostText,
        voice_id: voiceId,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85
        }
      });

      if (audioResult.success) {
        // Store in database
        const { data: inserted, error: insertError } = await supabase
          .from('ai_audio_content')
          .insert({
            user_id: user.id,
            belief_id: beliefId,
            content_type: 'daily_boost',
            source_text: dailyBoostText,
            audio_url: audioResult.audio_url,
            voice_type: 'user_cloned_voice',
            generation_date: new Date().toISOString().split('T')[0],
            is_active: true
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error storing daily boost audio:', insertError);
        } else {
          audioResult.audio_id = inserted.id;
        }

        // Cache the result
        await audioCache.set('daily_boost_audio', { 
          userId: user.id, 
          beliefId, 
          text: dailyBoostText 
        }, audioResult);
      }

      return audioResult;
    } catch (error) {
      console.error('Error generating daily boost audio:', error);
      return {
        audio_url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateAudioForTransformation(transformationText: string, voiceId: string, beliefId: string, isPartial: boolean = false): Promise<AudioGenerationResponse> {
    try {
      // Check if audio already exists in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check user's subscription tier
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      const isFreeUser = userData?.subscription_tier === 'free';

      // For free users, only allow partial transformation
      if (isFreeUser && !isPartial) {
        return {
          audio_url: '',
          success: false,
          error: 'UPGRADE_REQUIRED'
        };
      }

      // Check for existing audio
      const { data: existingAudio } = await supabase
        .from('ai_audio_content')
        .select('audio_url, id')
        .eq('user_id', user.id)
        .eq('belief_id', beliefId)
        .eq('content_type', 'transformation')
        .eq('voice_id', voiceId)
        .single();

      if (existingAudio?.audio_url) {
        return {
          audio_url: existingAudio.audio_url,
          success: true,
          audio_id: existingAudio.id
        };
      }

      // Generate new audio
      const audioResult = await this.generateAudio({
        text: transformationText,
        voice_id: voiceId,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85
        }
      });

      if (audioResult.success) {
        // Store in database
        const { data: inserted, error: insertError } = await supabase
          .from('ai_audio_content')
          .insert({
            user_id: user.id,
            belief_id: beliefId,
            content_type: 'transformation',
            source_text: transformationText,
            audio_url: audioResult.audio_url,
            voice_type: 'user_cloned_voice',
            generation_date: new Date().toISOString().split('T')[0],
            is_active: true,
            content_metadata: {
              is_partial: isPartial,
              is_free_tier: isFreeUser
            }
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error storing transformation audio:', insertError);
        } else {
          audioResult.audio_id = inserted.id;
        }

        // Cache the result
        await audioCache.set('transformation_audio', { 
          userId: user.id, 
          beliefId, 
          isPartial 
        }, audioResult);
      }

      return audioResult;
    } catch (error) {
      console.error('Error generating transformation audio:', error);
      return {
        audio_url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get stored audio URLs from cache or database
  async getStoredAffirmationAudio(affirmationText: string, voiceId: string, beliefId: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = await audioCache.get('affirmation_audio', { 
        userId: (await supabase.auth.getUser()).data.user?.id, 
        beliefId, 
        affirmationText 
      });
      
      if (cached?.audio_url) {
        return cached.audio_url;
      }

      // Check database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('ai_audio_content')
        .select('audio_url')
        .eq('user_id', user.id)
        .eq('belief_id', beliefId)
        .eq('content_type', 'affirmation')
        .eq('source_text', affirmationText)
        .eq('voice_id', voiceId)
        .single();

      return data?.audio_url || null;
    } catch (error) {
      console.error('Error getting stored affirmation audio:', error);
      return null;
    }
  }

  async getStoredDailyBoostAudio(boostText: string, voiceId: string, beliefId: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = await audioCache.get('daily_boost_audio', { 
        userId: (await supabase.auth.getUser()).data.user?.id, 
        beliefId, 
        text: boostText 
      });
      
      if (cached?.audio_url) {
        return cached.audio_url;
      }

      // Check database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('ai_audio_content')
        .select('audio_url')
        .eq('user_id', user.id)
        .eq('belief_id', beliefId)
        .eq('content_type', 'daily_boost')
        .eq('source_text', boostText)
        .eq('voice_id', voiceId)
        .single();

      return data?.audio_url || null;
    } catch (error) {
      console.error('Error getting stored daily boost audio:', error);
      return null;
    }
  }

  async getStoredTransformationAudio(beliefId: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = await audioCache.get('transformation_audio', { 
        userId: (await supabase.auth.getUser()).data.user?.id, 
        beliefId 
      });
      
      if (cached?.audio_url) {
        return cached.audio_url;
      }

      // Check database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('ai_audio_content')
        .select('audio_url')
        .eq('user_id', user.id)
        .eq('belief_id', beliefId)
        .eq('content_type', 'transformation')
        .single();

      return data?.audio_url || null;
    } catch (error) {
      console.error('Error getting stored transformation audio:', error);
      return null;
    }
  }

  // Generate next affirmation audio when current one is played (for premium users)
  async generateNextAffirmationIfNeeded(currentIndex: number, affirmations: string[], voiceId: string, beliefId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check user's subscription tier
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      const isFreeUser = userData?.subscription_tier === 'free';

      // Only generate next affirmation for premium users
      if (isFreeUser) return;

      const nextIndex = currentIndex + 1;
      if (nextIndex < affirmations.length) {
        const nextAffirmation = affirmations[nextIndex];
        
        // Check if next affirmation audio already exists
        const { data: existingAudio } = await supabase
          .from('ai_audio_content')
          .select('audio_url')
          .eq('user_id', user.id)
          .eq('belief_id', beliefId)
          .eq('content_type', 'affirmation')
          .eq('source_text', nextAffirmation)
          .eq('voice_id', voiceId)
          .single();

        // Generate next affirmation audio if it doesn't exist
        if (!existingAudio?.audio_url) {
          this.generateAudioForAffirmation(nextAffirmation, voiceId, beliefId, nextIndex);
        }
      }
    } catch (error) {
      console.error('Error generating next affirmation:', error);
    }
  }
}

export const audioGenerationService = new AudioGenerationService(); 