import { supabase } from '../lib/supabase';
import { userCache, CACHE_PREFIXES } from './cacheService';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // Computed from first_name + last_name for backward compatibility
  avatar_url?: string;
  timezone: string;
  language?: string;
  subscription_tier: 'free' | 'premium';
  elevenlabs_voice_id?: string;
  voice_clone_status: 'pending' | 'processing' | 'completed' | 'failed';
  is_onboarding_complete: boolean;
  onboarding_data?: {
    name?: string;
    age?: number;
    gender?: string;
    motivation?: string;
    struggling_emotions?: string[];
    self_relationship?: string[];
    inner_voice_change?: string[];
    current_self_talk?: string[];
    affirmation_tone?: string;
    wake_sleep_time?: {
      wakeUp: { hour: number; minute: number };
      bedTime: { hour: number; minute: number };
    };
    limiting_belief?: string;
    language?: string;
    identity_statement?: string;
    primary_goal?: string;
  };
}

class UserDataService {
  // Get user profile from cache or database
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      const cached = await userCache.get(CACHE_PREFIXES.USER_PROFILE, { userId });
      if (cached) {
        return cached;
      }

      // Fetch from users table (new structure)
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, avatar_url, timezone, language, elevenlabs_voice_id, voice_clone_status, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !userData) {
        return null;
      }

      // Fetch onboarding data from separate table (new structure)
      let onboardingData = null;
      try {
        const { data: onboardingResult } = await supabase
          .from('onboarding_data')
          .select('survey_data, onboarding_completed')
          .eq('user_id', userId)
          .single();
        
        if (onboardingResult?.survey_data) {
          onboardingData = onboardingResult.survey_data;
        }
      } catch (onboardingError) {
        // Onboarding data not found, continue with null
      }

      const userProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || undefined,
        avatar_url: userData.avatar_url,
        timezone: userData.timezone || 'UTC',
        language: userData.language,
        subscription_tier: 'free', // Default for new structure
        elevenlabs_voice_id: userData.elevenlabs_voice_id,
        voice_clone_status: userData.voice_clone_status || 'pending',
        is_onboarding_complete: onboardingData ? true : false,
        onboarding_data: onboardingData
      };

      // Cache the result
      await userCache.set(CACHE_PREFIXES.USER_PROFILE, { userId }, userProfile);

      return userProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Get user name
  async getUserName(userId: string): Promise<string> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.onboarding_data?.name || profile?.full_name || 'Friend';
    } catch (error) {
      console.error('Error getting user name:', error);
      return 'Friend';
    }
  }

  // Get user subscription tier
  async getSubscriptionTier(userId: string): Promise<'free' | 'premium'> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.subscription_tier || 'free';
    } catch (error) {
      console.error('Error getting subscription tier:', error);
      return 'free';
    }
  }

  // Get user voice ID
  async getVoiceId(userId: string): Promise<string | null> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.elevenlabs_voice_id || null;
    } catch (error) {
      console.error('Error getting voice ID:', error);
      return null;
    }
  }

  // Get user onboarding data
  async getOnboardingData(userId: string): Promise<any> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.onboarding_data || {};
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return {};
    }
  }

  // Get user language preference
  async getLanguagePreference(userId: string): Promise<string> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.onboarding_data?.language || 'English';
    } catch (error) {
      console.error('Error getting language preference:', error);
      return 'English';
    }
  }

  // Check if user has completed voice cloning
  async hasVoiceClone(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.voice_clone_status === 'completed' && !!profile?.elevenlabs_voice_id;
    } catch (error) {
      console.error('Error checking voice clone status:', error);
      return false;
    }
  }

  // Check if user has completed onboarding
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.is_onboarding_complete || false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      // Invalidate cache
      await this.invalidateCache(userId);

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Invalidate user cache
  async invalidateCache(userId: string): Promise<void> {
    try {
      await userCache.invalidate(CACHE_PREFIXES.USER_PROFILE);
    } catch (error) {
      console.error('Error invalidating user cache:', error);
    }
  }

  // Preload user data for app startup
  async preloadUserData(userId: string): Promise<void> {
    try {
      // Preload user profile in background
      this.getUserProfile(userId);
    } catch (error) {
      console.error('Error preloading user data:', error);
    }
  }
}

export const userDataService = new UserDataService(); 