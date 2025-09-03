import { supabase } from '../lib/supabase';
import { 
  OnboardingResponse, 
  validateOnboardingResponse, 
  sanitizeOnboardingResponse,
  WakeSleepTime,
  ManualReminderTimes
} from '../types/onboarding';

export interface OnboardingServiceError {
  message: string;
  field?: string;
  code?: string;
}

export class OnboardingService {
  /**
   * Save onboarding responses to database with validation and sanitization
   */
  static async saveOnboardingResponses(
    userId: string, 
    answers: Record<string, any>
  ): Promise<{ success: boolean; error?: OnboardingServiceError }> {
    try {
      // Transform answers to match database schema
      const onboardingData = this.transformAnswersToOnboardingResponse(userId, answers);
      
      // Sanitize the data
      const sanitizedData = sanitizeOnboardingResponse(onboardingData);
      
      // Validate the data
      const validation = validateOnboardingResponse(sanitizedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            field: validation.errors.join(', ')
          }
        };
      }

      // Insert into onboarding_data table (new structure)
      const { data, error } = await supabase
        .from('onboarding_data')
        .upsert([{
          user_id: sanitizedData.user_id,
          survey_data: sanitizedData, // Store all data as JSONB
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          error: {
            message: 'Failed to save onboarding responses',
            code: 'DATABASE_ERROR'
          }
        };
      }

      // Update user profile to mark onboarding as completed
      const { error: profileError } = await supabase
        .from('users')
        .update({ 
          is_onboarding_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail the whole operation if profile update fails
      }

      return { success: true };

    } catch (error) {
      console.error('Onboarding service error:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR'
        }
      };
    }
  }

  /**
   * Get onboarding responses for a user
   */
  static async getOnboardingResponses(userId: string): Promise<{
    success: boolean;
    data?: OnboardingResponse;
    error?: OnboardingServiceError;
  }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_data')
        .select('survey_data, onboarding_completed, created_at, updated_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return { success: true, data: undefined };
        }
        
        console.error('Database error:', error);
        return {
          success: false,
          error: {
            message: 'Failed to retrieve onboarding responses',
            code: 'DATABASE_ERROR'
          }
        };
      }

      // Return the survey_data as the main data (new structure)
      return { success: true, data: data?.survey_data };

    } catch (error) {
      console.error('Onboarding service error:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR'
        }
      };
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static async hasCompletedOnboarding(userId: string): Promise<{
    success: boolean;
    completed: boolean;
    error?: OnboardingServiceError;
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_onboarding_complete')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          completed: false,
          error: {
            message: 'Failed to check onboarding status',
            code: 'DATABASE_ERROR'
          }
        };
      }

      return { 
        success: true, 
        completed: (data as any).is_onboarding_complete || false 
      };

    } catch (error) {
      console.error('Onboarding service error:', error);
      return {
        success: false,
        completed: false,
        error: {
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR'
        }
      };
    }
  }

  /**
   * Transform answers from the frontend to match database schema
   */
  private static transformAnswersToOnboardingResponse(
    userId: string, 
    answers: Record<string, any>
  ): Partial<OnboardingResponse> {
    return {
      user_id: userId,
      name: answers.name || '',
      age: answers.age || 18,
      gender: answers.gender || 'Woman',
      motivation: Array.isArray(answers.motivation) ? answers.motivation : [],
      struggling_emotions: Array.isArray(answers.struggling_emotions) ? answers.struggling_emotions : [],
      self_relationship: Array.isArray(answers.self_relationship) ? answers.self_relationship : [],
      self_talk_difficult: answers.self_talk_difficult || 'I\'m not sure',
      inner_voice_change: Array.isArray(answers.inner_voice_change) ? answers.inner_voice_change : [],
      current_self_talk: Array.isArray(answers.current_self_talk) ? answers.current_self_talk : [],
      affirmation_tone: answers.affirmation_tone || 'Neutral',
      wake_sleep_time: this.transformWakeSleepTime(answers.wake_sleep_time),
      limiting_belief: answers.limiting_belief || '',
    };
  }

  /**
   * Transform wake/sleep time data
   */
  private static transformWakeSleepTime(data: any): WakeSleepTime {
    if (data && typeof data === 'object' && data.wakeUp && data.bedtime) {
      return {
        wakeUp: {
          hour: parseInt(data.wakeUp.hour) || 7,
          minute: parseInt(data.wakeUp.minute) || 0
        },
        bedtime: {
          hour: parseInt(data.bedtime.hour) || 22,
          minute: parseInt(data.bedtime.minute) || 0
        }
      };
    }

    // Default values
    return {
      wakeUp: { hour: 7, minute: 0 },
      bedtime: { hour: 22, minute: 0 }
    };
  }

  /**
   * Transform manual reminder times data
   */
  private static transformManualReminderTimes(data: any): ManualReminderTimes | undefined {
    if (data && typeof data === 'object' && data.wakeUp && data.bedtime) {
      return {
        wakeUp: {
          hour: parseInt(data.wakeUp.hour) || 7,
          minute: parseInt(data.wakeUp.minute) || 0
        },
        bedtime: {
          hour: parseInt(data.bedtime.hour) || 22,
          minute: parseInt(data.bedtime.minute) || 0
        }
      };
    }

    return undefined;
  }

  /**
   * Validate individual field values
   */
  static validateField(fieldName: string, value: any): { isValid: boolean; error?: string } {
    switch (fieldName) {
      case 'name':
        if (!value || typeof value !== 'string' || value.trim().length < 1) {
          return { isValid: false, error: 'Name is required' };
        }
        if (value.trim().length > 255) {
          return { isValid: false, error: 'Name must be 255 characters or less' };
        }
        break;

      case 'age':
        if (!value || typeof value !== 'number') {
          return { isValid: false, error: 'Age is required' };
        }
        if (value < 18 || value > 100) {
          return { isValid: false, error: 'Age must be between 18 and 100' };
        }
        break;

      case 'gender':
        if (!value || !['Woman', 'Man'].includes(value)) {
          return { isValid: false, error: 'Please select a valid gender' };
        }
        break;

      case 'motivation':
      case 'struggling_emotions':
      case 'self_relationship':
      case 'inner_voice_change':
      case 'current_self_talk':
        if (!Array.isArray(value) || value.length < 1) {
          return { isValid: false, error: 'Please select at least one option' };
        }
        break;

      case 'self_talk_difficult':
        if (!value || ![
          'I\'m hard on myself',
          'I try to stay optimistic',
          'I emotionally shut down',
          'I don\'t really notice my self-talk',
          'I\'m not sure'
        ].includes(value)) {
          return { isValid: false, error: 'Please select a valid option' };
        }
        break;

      case 'affirmation_tone':
        if (!value || ![
          'Gentle & supportive',
          'Motivational & bold',
          'Calm & meditative',
          'Spiritual',
          'Neutral'
        ].includes(value)) {
          return { isValid: false, error: 'Please select a valid tone' };
        }
        break;

      case 'wake_sleep_time':
        if (!value || typeof value !== 'object') {
          return { isValid: false, error: 'Please set your wake and sleep times' };
        }
        break;

      case 'limiting_belief':
        if (!value || typeof value !== 'string' || value.trim().length < 1) {
          return { isValid: false, error: 'Please share your limiting belief' };
        }
        if (value.trim().length > 1000) {
          return { isValid: false, error: 'Limiting belief must be 1000 characters or less' };
        }
        break;

      default:
        return { isValid: true };
    }

    return { isValid: true };
  }

  /**
   * Sanitize individual field values
   */
  static sanitizeField(fieldName: string, value: any): any {
    switch (fieldName) {
      case 'name':
      case 'limiting_belief':
        if (typeof value === 'string') {
          return value.trim().replace(/\s+/g, ' ');
        }
        break;

      case 'motivation':
      case 'struggling_emotions':
      case 'self_relationship':
      case 'inner_voice_change':
      case 'current_self_talk':
        if (Array.isArray(value)) {
          return [...new Set(value.filter(item => item && item.trim()))];
        }
        break;

      case 'age':
        if (typeof value === 'number') {
          return Math.max(18, Math.min(100, value));
        }
        break;

      case 'wake_sleep_time':
        if (value && typeof value === 'object') {
          return {
            wakeUp: {
              hour: Math.max(0, Math.min(23, parseInt(value.wakeUp?.hour) || 7)),
              minute: Math.max(0, Math.min(59, parseInt(value.wakeUp?.minute) || 0))
            },
            bedtime: {
              hour: Math.max(0, Math.min(23, parseInt(value.bedtime?.hour) || 22)),
              minute: Math.max(0, Math.min(59, parseInt(value.bedtime?.minute) || 0))
            }
          };
        }
        break;
    }

    return value;
  }
} 