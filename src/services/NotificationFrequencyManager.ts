import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationPreferencesService } from './NotificationPreferences';
import { NotificationPreferences } from '../types/notifications';

interface NotificationFrequencyData {
  lastNotificationTime: number;
  dailyCount: number;
  lastResetDate: string;
  userEngagementLevel: 'high' | 'medium' | 'low';
  lastAppOpenTime: number;
  consecutiveDaysActive: number;
}

export class NotificationFrequencyManager {
  private static instance: NotificationFrequencyManager;
  private readonly FREQUENCY_DATA_KEY = '@mynd_notification_frequency_data';
  private readonly MAX_DAILY_NOTIFICATIONS = 8;
  private readonly MIN_INTERVAL_MINUTES = 30;

  private constructor() {}

  public static getInstance(): NotificationFrequencyManager {
    if (!NotificationFrequencyManager.instance) {
      NotificationFrequencyManager.instance = new NotificationFrequencyManager();
    }
    return NotificationFrequencyManager.instance;
  }

  /**
   * Check if a notification can be sent based on frequency rules
   */
  async canSendNotification(
    userId: string,
    notificationType: string
  ): Promise<{ canSend: boolean; reason?: string; nextAvailableTime?: Date }> {
    try {
      const frequencyData = await this.getFrequencyData(userId);
      const preferences = await notificationPreferencesService.loadPreferences(userId);

      // Check if notifications are enabled
      if (!preferences.enabled) {
        return { canSend: false, reason: 'Notifications disabled' };
      }

      // Check daily limit
      if (frequencyData.dailyCount >= preferences.maxDailyNotifications) {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        return { 
          canSend: false, 
          reason: 'Daily limit reached',
          nextAvailableTime: nextDay
        };
      }

      // Check minimum interval between notifications
      const timeSinceLastNotification = Date.now() - frequencyData.lastNotificationTime;
      const minIntervalMs = this.MIN_INTERVAL_MINUTES * 60 * 1000;
      
      if (timeSinceLastNotification < minIntervalMs) {
        const nextAvailableTime = new Date(frequencyData.lastNotificationTime + minIntervalMs);
        return { 
          canSend: false, 
          reason: 'Too soon since last notification',
          nextAvailableTime
        };
      }

      // Check quiet hours
      if (this.isWithinQuietHours(preferences)) {
        const nextAvailableTime = this.getNextAvailableTimeAfterQuietHours(preferences);
        return { 
          canSend: false, 
          reason: 'Within quiet hours',
          nextAvailableTime
        };
      }

      return { canSend: true };
    } catch (error) {
      console.error('Error checking notification frequency:', error);
      return { canSend: true }; // Allow if there's an error
    }
  }

  /**
   * Record that a notification was sent
   */
  async recordNotificationSent(userId: string, notificationType: string): Promise<void> {
    try {
      const frequencyData = await this.getFrequencyData(userId);
      
      // Update frequency data
      frequencyData.lastNotificationTime = Date.now();
      frequencyData.dailyCount += 1;
      
      await this.saveFrequencyData(userId, frequencyData);
    } catch (error) {
      console.error('Error recording notification sent:', error);
    }
  }

  /**
   * Update user engagement level based on app usage
   */
  async updateUserEngagement(userId: string, appOpenTime: number): Promise<void> {
    try {
      const frequencyData = await this.getFrequencyData(userId);
      
      // Calculate engagement level based on app usage patterns
      const timeSinceLastOpen = appOpenTime - frequencyData.lastAppOpenTime;
      const hoursSinceLastOpen = timeSinceLastOpen / (1000 * 60 * 60);
      
      // Update engagement level
      if (hoursSinceLastOpen < 2) {
        frequencyData.userEngagementLevel = 'high';
      } else if (hoursSinceLastOpen < 24) {
        frequencyData.userEngagementLevel = 'medium';
      } else {
        frequencyData.userEngagementLevel = 'low';
      }
      
      frequencyData.lastAppOpenTime = appOpenTime;
      
      // Update consecutive days active
      const today = new Date().toDateString();
      const lastOpenDate = new Date(frequencyData.lastAppOpenTime).toDateString();
      
      if (today === lastOpenDate) {
        // Same day, increment consecutive days
        frequencyData.consecutiveDaysActive += 1;
      } else {
        // Different day, check if consecutive
        const daysDiff = Math.floor((appOpenTime - frequencyData.lastAppOpenTime) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          frequencyData.consecutiveDaysActive += 1;
        } else {
          frequencyData.consecutiveDaysActive = 1;
        }
      }
      
      await this.saveFrequencyData(userId, frequencyData);
    } catch (error) {
      console.error('Error updating user engagement:', error);
    }
  }

  /**
   * Get optimal notification timing based on user behavior
   */
  async getOptimalNotificationTime(
    userId: string,
    notificationType: string
  ): Promise<Date> {
    try {
      const frequencyData = await this.getFrequencyData(userId);
      const preferences = await notificationPreferencesService.loadPreferences(userId);
      
      const now = new Date();
      let optimalTime = new Date(now);
      
      // Adjust timing based on user engagement level
      switch (frequencyData.userEngagementLevel) {
        case 'high':
          // High engagement users can receive notifications more frequently
          optimalTime.setMinutes(optimalTime.getMinutes() + 15);
          break;
        case 'medium':
          // Medium engagement users get notifications with moderate spacing
          optimalTime.setMinutes(optimalTime.getMinutes() + 45);
          break;
        case 'low':
          // Low engagement users get notifications with longer spacing
          optimalTime.setHours(optimalTime.getHours() + 2);
          break;
      }
      
      // Ensure it's not during quiet hours
      if (this.isWithinQuietHours(preferences, optimalTime)) {
        optimalTime = this.getNextAvailableTimeAfterQuietHours(preferences, optimalTime);
      }
      
      return optimalTime;
    } catch (error) {
      console.error('Error getting optimal notification time:', error);
      return new Date(Date.now() + 60 * 60 * 1000); // Default to 1 hour from now
    }
  }

  /**
   * Reset daily counters if it's a new day
   */
  async resetDailyCountersIfNeeded(userId: string): Promise<void> {
    try {
      const frequencyData = await this.getFrequencyData(userId);
      const today = new Date().toDateString();
      
      if (frequencyData.lastResetDate !== today) {
        frequencyData.dailyCount = 0;
        frequencyData.lastResetDate = today;
        await this.saveFrequencyData(userId, frequencyData);
      }
    } catch (error) {
      console.error('Error resetting daily counters:', error);
    }
  }

  /**
   * Get frequency data for a user
   */
  private async getFrequencyData(userId: string): Promise<NotificationFrequencyData> {
    try {
      const stored = await AsyncStorage.getItem(`${this.FREQUENCY_DATA_KEY}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Return default data
      return {
        lastNotificationTime: 0,
        dailyCount: 0,
        lastResetDate: new Date().toDateString(),
        userEngagementLevel: 'medium',
        lastAppOpenTime: Date.now(),
        consecutiveDaysActive: 0
      };
    } catch (error) {
      console.error('Error getting frequency data:', error);
      return {
        lastNotificationTime: 0,
        dailyCount: 0,
        lastResetDate: new Date().toDateString(),
        userEngagementLevel: 'medium',
        lastAppOpenTime: Date.now(),
        consecutiveDaysActive: 0
      };
    }
  }

  /**
   * Save frequency data for a user
   */
  private async saveFrequencyData(userId: string, data: NotificationFrequencyData): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.FREQUENCY_DATA_KEY}_${userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving frequency data:', error);
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isWithinQuietHours(preferences: NotificationPreferences, time?: Date): boolean {
    const checkTime = time || new Date();
    const currentTime = checkTime.getHours() * 60 + checkTime.getMinutes();
    
    const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Handles overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Get next available time after quiet hours
   */
  private getNextAvailableTimeAfterQuietHours(
    preferences: NotificationPreferences, 
    fromTime?: Date
  ): Date {
    const baseTime = fromTime || new Date();
    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
    
    const nextAvailable = new Date(baseTime);
    nextAvailable.setHours(endHour, endMinute, 0, 0);
    
    // If the end time is before the current time, it means quiet hours end tomorrow
    if (nextAvailable <= baseTime) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }
    
    return nextAvailable;
  }

  /**
   * Get user engagement statistics
   */
  async getUserEngagementStats(userId: string): Promise<{
    engagementLevel: string;
    consecutiveDaysActive: number;
    dailyNotificationCount: number;
    lastNotificationTime: Date;
  }> {
    try {
      const frequencyData = await this.getFrequencyData(userId);
      return {
        engagementLevel: frequencyData.userEngagementLevel,
        consecutiveDaysActive: frequencyData.consecutiveDaysActive,
        dailyNotificationCount: frequencyData.dailyCount,
        lastNotificationTime: new Date(frequencyData.lastNotificationTime)
      };
    } catch (error) {
      console.error('Error getting user engagement stats:', error);
      return {
        engagementLevel: 'medium',
        consecutiveDaysActive: 0,
        dailyNotificationCount: 0,
        lastNotificationTime: new Date(0)
      };
    }
  }
}

// Export singleton instance
export const notificationFrequencyManager = NotificationFrequencyManager.getInstance(); 