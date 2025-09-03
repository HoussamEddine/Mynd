import { notificationService } from './NotificationService';
import { notificationFrequencyManager } from './NotificationFrequencyManager';
import { NotificationType, NotificationData, NotificationPreferences } from '../types/notifications';

export class NotificationScheduler {
  private static instance: NotificationScheduler;

  private constructor() {}

  public static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Schedule daily session reminders
   */
  async scheduleSessionReminders(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.sessionReminders || !preferences.enabled) {
      return;
    }

    // Morning session reminder (9 AM)
    const morningReminder: NotificationData = {
      type: NotificationType.SESSION_REMINDER,
      title: 'Ready to rewrite your story?',
      body: 'Your Core Belief Journey is waiting.',
      data: { sessionType: 'morning' },
      sound: true,
      priority: 'high'
    };

    // Evening session reminder (6 PM)
    const eveningReminder: NotificationData = {
      type: NotificationType.SESSION_REMINDER,
      title: 'Time for your transformation',
      body: 'Your evening belief shift session is ready.',
      data: { sessionType: 'evening' },
      sound: true,
      priority: 'high'
    };

    try {
      // Schedule morning reminder
      const morningDate = new Date();
      morningDate.setHours(9, 0, 0, 0);
      if (morningDate <= new Date()) {
        morningDate.setDate(morningDate.getDate() + 1);
      }
      await notificationService.scheduleNotificationForDate(morningReminder, morningDate);

      // Schedule evening reminder
      const eveningDate = new Date();
      eveningDate.setHours(18, 0, 0, 0);
      if (eveningDate <= new Date()) {
        eveningDate.setDate(eveningDate.getDate() + 1);
      }
      await notificationService.scheduleNotificationForDate(eveningReminder, eveningDate);

      console.log('Session reminders scheduled');
    } catch (error) {
      console.error('Error scheduling session reminders:', error);
    }
  }

  /**
   * Schedule daily boost notifications
   */
  async scheduleBoostNotifications(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.boostNotifications || !preferences.enabled) {
      return;
    }

    const boostNotification: NotificationData = {
      type: NotificationType.BOOST_AVAILABLE,
      title: 'Your daily boost is ready',
      body: 'Take a moment to reset and recharge.',
      data: { boostType: 'daily' },
      sound: true,
      priority: 'normal'
    };

    try {
      // Schedule for 12 PM (midday)
      const boostDate = new Date();
      boostDate.setHours(12, 0, 0, 0);
      if (boostDate <= new Date()) {
        boostDate.setDate(boostDate.getDate() + 1);
      }
      await notificationService.scheduleNotificationForDate(boostNotification, boostDate);

      console.log('Boost notification scheduled');
    } catch (error) {
      console.error('Error scheduling boost notification:', error);
    }
  }

  /**
   * Schedule affirmation delivery
   */
  async scheduleAffirmationDelivery(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.affirmations || !preferences.enabled) {
      return;
    }

    const affirmationTimes = [
      { hour: 8, minute: 0, affirmation: 1 },
      { hour: 11, minute: 0, affirmation: 2 },
      { hour: 14, minute: 0, affirmation: 3 },
      { hour: 17, minute: 0, affirmation: 4 },
      { hour: 20, minute: 0, affirmation: 5 }
    ];

    const affirmations = [
      'You have the power to create the life you want.',
      'Your confidence is growing stronger every day.',
      'You are worthy of love and success.',
      'You trust yourself and your intuition.',
      'Your new narrative is becoming your reality.'
    ];

    try {
      for (const time of affirmationTimes) {
        const affirmationData: NotificationData = {
          type: NotificationType.AFFIRMATION_DELIVERY,
          title: `Affirmation ${time.affirmation}/5`,
          body: affirmations[time.affirmation - 1],
          data: { 
            affirmationNumber: time.affirmation,
            totalAffirmations: 5
          },
          sound: true,
          priority: 'normal'
        };

        const scheduleDate = new Date();
        scheduleDate.setHours(time.hour, time.minute, 0, 0);
        if (scheduleDate <= new Date()) {
          scheduleDate.setDate(scheduleDate.getDate() + 1);
        }
        await notificationService.scheduleNotificationForDate(affirmationData, scheduleDate);
      }

      console.log('Affirmation notifications scheduled');
    } catch (error) {
      console.error('Error scheduling affirmation notifications:', error);
    }
  }

  /**
   * Schedule daydreaming log reminders
   */
  async scheduleDaydreamLogReminders(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.daydreamLogs || !preferences.enabled) {
      return;
    }

    const daydreamReminder: NotificationData = {
      type: NotificationType.DAYDREAM_LOG_REMINDER,
      title: 'Your next insight is waiting',
      body: 'Log your daydream to uncover new insights.',
      data: { logType: 'daydream' },
      sound: true,
      priority: 'normal'
    };

    try {
      // Schedule for 9 PM (evening reflection)
      const daydreamDate = new Date();
      daydreamDate.setHours(21, 0, 0, 0);
      if (daydreamDate <= new Date()) {
        daydreamDate.setDate(daydreamDate.getDate() + 1);
      }
      await notificationService.scheduleNotificationForDate(daydreamReminder, daydreamDate);

      console.log('Daydream log reminder scheduled');
    } catch (error) {
      console.error('Error scheduling daydream log reminder:', error);
    }
  }

  /**
   * Schedule habit tracking reminders
   */
  async scheduleHabitTrackingReminders(preferences: NotificationPreferences): Promise<void> {
    if (!preferences.habitTracking || !preferences.enabled) {
      return;
    }

    const habitReminder: NotificationData = {
      type: NotificationType.HABIT_CHECK_IN,
      title: 'Make today count',
      body: 'Don\'t forget to track your habits.',
      data: { reminderType: 'habit' },
      sound: true,
      priority: 'normal'
    };

    try {
      // Schedule for 8 PM (end of day)
      const habitDate = new Date();
      habitDate.setHours(20, 0, 0, 0);
      if (habitDate <= new Date()) {
        habitDate.setDate(habitDate.getDate() + 1);
      }
      await notificationService.scheduleNotificationForDate(habitReminder, habitDate);

      console.log('Habit tracking reminder scheduled');
    } catch (error) {
      console.error('Error scheduling habit tracking reminder:', error);
    }
  }

  /**
   * Schedule all notifications based on preferences
   */
  async scheduleAllNotifications(preferences: NotificationPreferences): Promise<void> {
    try {
      // Cancel existing notifications first
      await notificationService.cancelAllNotifications();

      // Schedule each type of notification
      await this.scheduleSessionReminders(preferences);
      await this.scheduleBoostNotifications(preferences);
      await this.scheduleAffirmationDelivery(preferences);
      await this.scheduleDaydreamLogReminders(preferences);
      await this.scheduleHabitTrackingReminders(preferences);

      console.log('All notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling all notifications:', error);
    }
  }

  /**
   * Schedule a one-time notification with smart frequency management
   */
  async scheduleOneTimeNotification(
    type: NotificationType,
    title: string,
    body: string,
    scheduledDate: Date,
    data?: Record<string, any>
  ): Promise<string> {
    const userId = 'user123'; // In real app, get from auth context
    
    // Check frequency limits
    const frequencyCheck = await notificationFrequencyManager.canSendNotification(userId, type);
    
    if (!frequencyCheck.canSend) {
      console.log(`Notification blocked: ${frequencyCheck.reason}`);
      
      // If blocked due to timing, schedule for later
      if (frequencyCheck.nextAvailableTime) {
        const notificationData: NotificationData = {
          type,
          title,
          body,
          data,
          sound: true,
          priority: 'normal'
        };
        
        return await notificationService.scheduleNotificationForDate(
          notificationData, 
          frequencyCheck.nextAvailableTime
        );
      }
      
      throw new Error(`Notification blocked: ${frequencyCheck.reason}`);
    }

    const notificationData: NotificationData = {
      type,
      title,
      body,
      data,
      sound: true,
      priority: 'normal'
    };

    const notificationId = await notificationService.scheduleNotificationForDate(notificationData, scheduledDate);
    
    // Record that notification was scheduled
    await notificationFrequencyManager.recordNotificationSent(userId, type);
    
    return notificationId;
  }

  /**
   * Schedule achievement notification with optimal timing
   */
  async scheduleAchievementNotification(
    achievementType: string,
    message: string,
    scheduledDate?: Date
  ): Promise<string> {
    const userId = 'user123'; // In real app, get from auth context
    
    // Get optimal timing based on user engagement
    const optimalTime = scheduledDate || await notificationFrequencyManager.getOptimalNotificationTime(userId, 'achievement');
    
    return await this.scheduleOneTimeNotification(
      NotificationType.MILESTONE_ACHIEVEMENT,
      'Congratulations!',
      message,
      optimalTime,
      { achievementType }
    );
  }

  /**
   * Schedule progress update notification with optimal timing
   */
  async scheduleProgressUpdateNotification(
    progressType: string,
    message: string,
    scheduledDate?: Date
  ): Promise<string> {
    const userId = 'user123'; // In real app, get from auth context
    
    // Get optimal timing based on user engagement
    const optimalTime = scheduledDate || await notificationFrequencyManager.getOptimalNotificationTime(userId, 'progress');
    
    return await this.scheduleOneTimeNotification(
      NotificationType.PROGRESS_UPDATE,
      'Progress Update',
      message,
      optimalTime,
      { progressType }
    );
  }

  /**
   * Schedule re-engagement notification with optimal timing
   */
  async scheduleReEngagementNotification(
    message: string,
    scheduledDate?: Date
  ): Promise<string> {
    const userId = 'user123'; // In real app, get from auth context
    
    // Get optimal timing based on user engagement
    const optimalTime = scheduledDate || await notificationFrequencyManager.getOptimalNotificationTime(userId, 're-engagement');
    
    return await this.scheduleOneTimeNotification(
      NotificationType.RE_ENGAGEMENT,
      'We miss you!',
      message,
      optimalTime
    );
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance(); 