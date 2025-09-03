import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationType, NotificationData, NotificationPreferences } from '../types/notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Get push token for remote notifications
      if (Platform.OS !== 'web') {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID || 'default',
        });
        this.expoPushToken = token.data;
        console.log('Expo push token:', this.expoPushToken);
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    notificationData: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: notificationData.sound ? 'default' : undefined,
          priority: notificationData.priority || 'default',
        },
        trigger: trigger || null, // null means send immediately
      });

      console.log('Notification scheduled with ID:', identifier);
      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Send immediate notification
   */
  async sendImmediateNotification(notificationData: NotificationData): Promise<string> {
    return this.scheduleNotification(notificationData);
  }

  /**
   * Schedule notification for specific date/time
   */
  async scheduleNotificationForDate(
    notificationData: NotificationData,
    date: Date
  ): Promise<string> {
    return this.scheduleNotification(notificationData, {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    });
  }

  /**
   * Schedule recurring notification
   */
  async scheduleRecurringNotification(
    notificationData: NotificationData,
    interval: 'minute' | 'hour' | 'day' | 'week',
    repeats: boolean = true
  ): Promise<string> {
    return this.scheduleNotification(notificationData, {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: this.getIntervalInSeconds(interval),
      repeats,
    });
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('Notification cancelled:', identifier);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Remove notification listener
   */
  removeNotificationSubscription(subscription: Notifications.Subscription): void {
    subscription.remove();
  }

  /**
   * Check if notification is within quiet hours
   */
  isWithinQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
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
   * Helper method to get interval in seconds
   */
  private getIntervalInSeconds(interval: 'minute' | 'hour' | 'day' | 'week'): number {
    switch (interval) {
      case 'minute':
        return 60;
      case 'hour':
        return 60 * 60;
      case 'day':
        return 24 * 60 * 60;
      case 'week':
        return 7 * 24 * 60 * 60;
      default:
        return 60;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 