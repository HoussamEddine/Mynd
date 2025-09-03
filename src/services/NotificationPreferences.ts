import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationPreferences } from '../types/notifications';

const NOTIFICATION_PREFERENCES_KEY = '@mynd_notification_preferences';

export class NotificationPreferencesService {
  private static instance: NotificationPreferencesService;

  private constructor() {}

  public static getInstance(): NotificationPreferencesService {
    if (!NotificationPreferencesService.instance) {
      NotificationPreferencesService.instance = new NotificationPreferencesService();
    }
    return NotificationPreferencesService.instance;
  }

  /**
   * Get default notification preferences
   */
  getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      enabled: true,
      sessionReminders: true,
      boostNotifications: true,
      affirmations: true,
      daydreamLogs: true,
      habitTracking: true,
      progressUpdates: true,
      achievements: true,
      reEngagement: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      maxDailyNotifications: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Load notification preferences from storage
   */
  async loadPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        // Ensure we have all required fields
        return {
          ...this.getDefaultPreferences(userId),
          ...preferences,
          userId, // Always use current userId
          updatedAt: new Date()
        };
      }
      // Return default preferences if none stored
      return this.getDefaultPreferences(userId);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Save notification preferences to storage
   */
  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const updatedPreferences = {
        ...preferences,
        updatedAt: new Date()
      };
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_KEY,
        JSON.stringify(updatedPreferences)
      );
      console.log('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update specific preference
   */
  async updatePreference<K extends keyof NotificationPreferences>(
    userId: string,
    key: K,
    value: NotificationPreferences[K]
  ): Promise<NotificationPreferences> {
    try {
      const preferences = await this.loadPreferences(userId);
      const updatedPreferences = {
        ...preferences,
        [key]: value,
        updatedAt: new Date()
      };
      await this.savePreferences(updatedPreferences);
      return updatedPreferences;
    } catch (error) {
      console.error('Error updating notification preference:', error);
      throw error;
    }
  }

  /**
   * Toggle notification type
   */
  async toggleNotificationType(
    userId: string,
    type: keyof Pick<NotificationPreferences, 
      'sessionReminders' | 'boostNotifications' | 'affirmations' | 
      'daydreamLogs' | 'habitTracking' | 'progressUpdates' | 
      'achievements' | 'reEngagement'
    >
  ): Promise<NotificationPreferences> {
    const preferences = await this.loadPreferences(userId);
    const newValue = !preferences[type];
    return await this.updatePreference(userId, type, newValue);
  }

  /**
   * Update quiet hours
   */
  async updateQuietHours(
    userId: string,
    start: string,
    end: string
  ): Promise<NotificationPreferences> {
    const preferences = await this.loadPreferences(userId);
    const updatedPreferences = {
      ...preferences,
      quietHoursStart: start,
      quietHoursEnd: end,
      updatedAt: new Date()
    };
    await this.savePreferences(updatedPreferences);
    return updatedPreferences;
  }

  /**
   * Update maximum daily notifications
   */
  async updateMaxDailyNotifications(
    userId: string,
    maxNotifications: number
  ): Promise<NotificationPreferences> {
    return await this.updatePreference(userId, 'maxDailyNotifications', maxNotifications);
  }

  /**
   * Enable/disable all notifications
   */
  async toggleAllNotifications(
    userId: string,
    enabled: boolean
  ): Promise<NotificationPreferences> {
    return await this.updatePreference(userId, 'enabled', enabled);
  }

  /**
   * Reset to default preferences
   */
  async resetToDefaults(userId: string): Promise<NotificationPreferences> {
    const defaultPreferences = this.getDefaultPreferences(userId);
    await this.savePreferences(defaultPreferences);
    return defaultPreferences;
  }

  /**
   * Clear all notification preferences
   */
  async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_PREFERENCES_KEY);
      console.log('Notification preferences cleared');
    } catch (error) {
      console.error('Error clearing notification preferences:', error);
      throw error;
    }
  }

  /**
   * Check if notifications are enabled for a specific type
   */
  async isNotificationTypeEnabled(
    userId: string,
    type: keyof Pick<NotificationPreferences, 
      'sessionReminders' | 'boostNotifications' | 'affirmations' | 
      'daydreamLogs' | 'habitTracking' | 'progressUpdates' | 
      'achievements' | 'reEngagement'
    >
  ): Promise<boolean> {
    const preferences = await this.loadPreferences(userId);
    return preferences.enabled && preferences[type];
  }

  /**
   * Get current notification count for today
   */
  async getTodayNotificationCount(): Promise<number> {
    try {
      const today = new Date().toDateString();
      const key = `@mynd_notification_count_${today}`;
      const count = await AsyncStorage.getItem(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Error getting today notification count:', error);
      return 0;
    }
  }

  /**
   * Increment today's notification count
   */
  async incrementTodayNotificationCount(): Promise<number> {
    try {
      const today = new Date().toDateString();
      const key = `@mynd_notification_count_${today}`;
      const currentCount = await this.getTodayNotificationCount();
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(key, newCount.toString());
      return newCount;
    } catch (error) {
      console.error('Error incrementing today notification count:', error);
      return 0;
    }
  }

  /**
   * Reset daily notification count (call this at midnight)
   */
  async resetDailyNotificationCount(): Promise<void> {
    try {
      const today = new Date().toDateString();
      const key = `@mynd_notification_count_${today}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error resetting daily notification count:', error);
    }
  }
}

// Export singleton instance
export const notificationPreferencesService = NotificationPreferencesService.getInstance(); 