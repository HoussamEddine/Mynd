import { supabase } from '../lib/supabase';
import { uiCache } from './cacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileData {
  name: string;
  email: string;
  age: string;
  gender: string;
  identityStatement: string;
  voiceCloned: boolean;
  voiceTone: number;
  affirmationMode: string;
  affirmationLength: string;
  affirmationTone: string;
  morningReminder: string;
  morningReminderEnabled: boolean;
  eveningReminder: string;
  eveningReminderEnabled: boolean;
  pushNotifications: boolean;
  emailUpdates: boolean;
  subscriptionPlan: string;
  subscriptionRenewal: string;
  streak: number;
  sessionsCompleted: number;
  goalProgress: number;
  theme: string;
  fontSize: string;
  appVersion: string;
  breathingEnabled: boolean;
}

export interface UserProfile {
  user_id: string;
  full_name?: string;
  age?: number;
  gender?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserReminders {
  user_id: string;
  morning_time?: string;
  evening_time?: string;
  morning_enabled?: boolean;
  evening_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

class ProfileService {
  private cacheKey = 'profile_data';

  async getProfileData(userId: string): Promise<ProfileData> {
    try {
      // Check cache first
      const cached = await uiCache.get<ProfileData>('profile_data', { userId });
      if (cached) {
        return cached;
      }

      // Fetch from database
      const profileData = await this.fetchProfileDataFromDB(userId);
      
      // Cache the result
      await uiCache.set('profile_data', { userId }, profileData);

      return profileData;
    } catch (error) {
      console.error('Error getting profile data:', error);
      throw error;
    }
  }

  private async fetchProfileDataFromDB(userId: string): Promise<ProfileData> {
    // Default profile data
    const defaultProfileData: ProfileData = {
      name: '',
      email: '',
      age: '',
      gender: '',
      identityStatement: '',
      voiceCloned: false,
      voiceTone: 0.7,
      affirmationMode: 'Focused',
      affirmationLength: 'Short',
      affirmationTone: 'Gentle',
      morningReminder: '08:00',
      morningReminderEnabled: true,
      eveningReminder: '20:00',
      eveningReminderEnabled: true,
      pushNotifications: true,
      emailUpdates: false,
      subscriptionPlan: 'Free Plan',
      subscriptionRenewal: '',
      streak: 0,
      sessionsCompleted: 0,
      goalProgress: 0,
      theme: 'Light',
      fontSize: 'Normal',
      appVersion: '1.0.0',
      breathingEnabled: true,
    };

    try {
      // Get user data from users table (basic info only)
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, email, voice_clone_status, onboarding_data')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
      }



      // Get onboarding data from dedicated onboarding_data table
      let onboardingData = null;
      try {
  
        const { data, error } = await supabase
          .from('onboarding_data')
          .select('name, age, gender, limiting_belief')
          .eq('user_id', userId)
          .single();
        

        
        if (!error && data) {
          onboardingData = data;

        } else if (error) {

        }
      } catch (error) {

      }

      // If no onboarding data exists, create some sample data
      if (!onboardingData && !userData?.onboarding_data) {

        await this.createSampleOnboardingData(userId, user?.email || '');
      }

      // Get reminder settings from user_reminders table
      let reminderData = null;
      try {
        const { data, error } = await supabase
          .from('user_reminders')
          .select('morning_time, evening_time, morning_enabled, evening_enabled')
          .eq('user_id', userId)
          .single();
        if (!error) {
          reminderData = data;
        }
      } catch (error) {

      }

      // Get session data for streak calculation from practice_sessions table
      const { data: sessions, error: sessionsError } = await supabase
        .from('practice_sessions')
        .select('session_date, completed')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('session_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      }

      // Calculate streak
      const currentStreak = this.calculateStreak(sessions || []);

      // Get breathing setting
      const breathingEnabled = await this.getBreathingSetting();

      // Update profile data with database values
      const profileData: ProfileData = {
        ...defaultProfileData,
        name: userData?.full_name || onboardingData?.name || userData?.onboarding_data?.name || '',
        email: user?.email || '',
        age: onboardingData?.age?.toString() || userData?.onboarding_data?.age?.toString() || '',
        gender: onboardingData?.gender || userData?.onboarding_data?.gender || '',
        identityStatement: onboardingData?.limiting_belief || userData?.onboarding_data?.identity_statement || userData?.onboarding_data?.limiting_belief || '',
        voiceCloned: userData?.voice_clone_status === 'completed',
        morningReminder: this.calculateMorningRoutineTime(userData?.onboarding_data?.wake_sleep_time),
        eveningReminder: this.calculateEveningRoutineTime(userData?.onboarding_data?.wake_sleep_time),
        morningReminderEnabled: reminderData?.morning_enabled ?? true,
        eveningReminderEnabled: reminderData?.evening_enabled ?? true,
        streak: currentStreak,
        sessionsCompleted: sessions?.length || 0,
        breathingEnabled,
      };



      return profileData;
    } catch (error) {
      console.error('Error fetching profile data from DB:', error);
      return defaultProfileData;
    }
  }

  private async createSampleOnboardingData(userId: string, email: string): Promise<void> {
    try {
      // Create sample onboarding data in the users table
      const sampleOnboardingData = {
        name: email.split('@')[0], // Use email prefix as name
        age: 25,
        gender: 'Other',
        identity_statement: 'I am capable of growth and positive change',
        motivation: ['Self-improvement', 'Mental health'],
        struggling_emotions: ['Anxiety', 'Self-doubt'],
        self_relationship: ['Working on self-acceptance'],
        inner_voice_change: ['More compassionate', 'More encouraging'],
        affirmation_tone: 'Gentle',
        wake_sleep_time: { 
          wakeUp: { hour: 7, minute: 0 }, 
          bedTime: { hour: 22, minute: 0 } 
        },
        limiting_belief: 'I am not good enough',
      };

      await supabase
        .from('users')
        .update({
          onboarding_data: sampleOnboardingData,
          is_onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);


    } catch (error) {
      console.error('Error creating sample onboarding data:', error);
    }
  }

  private calculateStreak(sessions: Array<{ session_date: string; completed: boolean }>): number {
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const hasTodaySession = sessions.some(s => s.session_date === today);
    const hasYesterdaySession = sessions.some(s => s.session_date === yesterday);
    
    if (hasTodaySession) {
      currentStreak = 1;
      // Count consecutive days backwards
      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const hasSession = sessions.some(s => s.session_date === checkDate);
        if (hasSession) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (hasYesterdaySession) {
      currentStreak = 1;
      // Count consecutive days backwards from yesterday
      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const hasSession = sessions.some(s => s.session_date === checkDate);
        if (hasSession) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return currentStreak;
  }

  private calculateMorningRoutineTime(wakeSleepTime: any): string {
    if (!wakeSleepTime?.wakeUp) {
      return '08:05'; // Default if no time data
    }
    const wakeUp = wakeSleepTime.wakeUp;
    const wakeUpHour = wakeUp.hour;
    const wakeUpMinute = wakeUp.minute;

    // Calculate 5 minutes after wake up
    const totalMinutes = wakeUpHour * 60 + wakeUpMinute + 5;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;

    return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
  }

  private calculateEveningRoutineTime(wakeSleepTime: any): string {
    if (!wakeSleepTime?.bedTime) {
      return '19:55'; // Default if no time data
    }
    const bedTime = wakeSleepTime.bedTime;
    const bedTimeHour = bedTime.hour;
    const bedTimeMinute = bedTime.minute;

    // Calculate 5 minutes before bed time
    const totalMinutes = bedTimeHour * 60 + bedTimeMinute - 5;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;

    return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
  }

  async updateProfileField(userId: string, field: string, value: string | number | boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update database based on field type
      if (['name', 'age', 'gender'].includes(field)) {
        // Get current onboarding data
        const { data: currentUserData } = await supabase
          .from('users')
          .select('onboarding_data')
          .eq('id', userId)
          .single();

        // Prepare updated onboarding data
        const currentOnboardingData = currentUserData?.onboarding_data || {};
        const updatedOnboardingData = {
          ...currentOnboardingData,
          [field]: field === 'age' ? (typeof value === 'string' ? parseInt(value) || null : value) : value,
        };

        // Update the onboarding_data JSONB field in users table
        await supabase
          .from('users')
          .update({
            onboarding_data: updatedOnboardingData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

  
      } else if (field === 'email') {
        // Update email in auth.users table
        await supabase.auth.updateUser({ email: value as string });
      } else if (field === 'password') {
        // Update password in auth.users table
        await supabase.auth.updateUser({ password: value as string });
      }

      // Invalidate cache
      this.invalidateCache();
    } catch (error) {
      console.error('Error updating profile field:', error);
      throw error;
    }
  }

  async updateReminderSettings(userId: string, type: 'morning' | 'evening', value: string | boolean): Promise<void> {
    try {
      const updateData: any = {};
      if (type === 'morning') {
        if (typeof value === 'string') {
          updateData.morning_time = value;
        } else {
          updateData.morning_enabled = value;
        }
      } else if (type === 'evening') {
        if (typeof value === 'string') {
          updateData.evening_time = value;
        } else {
          updateData.evening_enabled = value;
        }
      }

      // Try to update user_reminders table, create if it doesn't exist
      try {
        await supabase
          .from('user_reminders')
          .upsert({
            user_id: userId,
            ...updateData,
            updated_at: new Date().toISOString(),
          });
      } catch (error) {
        // Table might not exist, store in users table as fallback

        const reminderSettings = {
          morning_time: type === 'morning' && typeof value === 'string' ? value : '08:00',
          evening_time: type === 'evening' && typeof value === 'string' ? value : '20:00',
          morning_enabled: type === 'morning' && typeof value === 'boolean' ? value : true,
          evening_enabled: type === 'evening' && typeof value === 'boolean' ? value : true,
        };
        
        await supabase
          .from('users')
          .update({
            reminder_settings: reminderSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      // Invalidate cache
      this.invalidateCache();
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  }

  async updateBreathingSetting(enabled: boolean): Promise<void> {
    try {
      // Save to AsyncStorage (local setting)
      await AsyncStorage.setItem('breathing_enabled', JSON.stringify(enabled));
      
      // Invalidate cache
      this.invalidateCache();
    } catch (error) {
      console.error('Error updating breathing setting:', error);
      throw error;
    }
  }

  async updateNotificationSettings(userId: string, pushNotifications: boolean, emailUpdates: boolean): Promise<void> {
    try {
      // Update notification settings in users table (new structure)
      await supabase
        .from('users')
        .update({
          // Store notification settings in the users table or as JSONB
          // For now, we'll comment this out as the new structure may not have these specific fields
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Invalidate cache
      this.invalidateCache();
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  async getBreathingSetting(): Promise<boolean> {
    try {
      const breathingEnabled = await AsyncStorage.getItem('breathing_enabled');
      return breathingEnabled === null ? true : JSON.parse(breathingEnabled);
    } catch (error) {
      console.error('Error getting breathing setting:', error);
      return true; // Default to enabled
    }
  }

  invalidateCache(): void {
    uiCache.invalidate('profile_data');
  }

  async refreshProfileData(userId: string): Promise<ProfileData> {
    // Force refresh by invalidating cache and fetching fresh data
    this.invalidateCache();
    return this.getProfileData(userId);
  }
}

export const profileService = new ProfileService(); 