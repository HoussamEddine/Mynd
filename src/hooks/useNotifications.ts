import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/NotificationService';
import { notificationPreferencesService } from '../services/NotificationPreferences';
import { notificationScheduler } from '../services/NotificationScheduler';
import { NotificationPreferences } from '../types/notifications';

export function useNotifications(userId: string = 'user123') {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences and check notification status
  const loadNotificationState = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if notifications are enabled at system level
      const systemEnabled = await notificationService.areNotificationsEnabled();
      setIsNotificationsEnabled(systemEnabled);

      // Load user preferences
      const userPreferences = await notificationPreferencesService.loadPreferences(userId);
      setPreferences(userPreferences);

      // Schedule notifications if enabled
      if (systemEnabled && userPreferences.enabled) {
        await notificationScheduler.scheduleAllNotifications(userPreferences);
      }
    } catch (error) {
      console.error('Error loading notification state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Request notification permissions
  const requestPermissions = useCallback(async () => {
    try {
      const granted = await notificationService.requestPermissions();
      setIsNotificationsEnabled(granted);
      
      if (granted && preferences) {
        await notificationScheduler.scheduleAllNotifications(preferences);
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, [preferences]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      await notificationPreferencesService.savePreferences(updatedPrefs);
      setPreferences(updatedPrefs);

      // Reschedule notifications if enabled
      if (isNotificationsEnabled && updatedPrefs.enabled) {
        await notificationScheduler.scheduleAllNotifications(updatedPrefs);
      } else {
        await notificationService.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }, [preferences, isNotificationsEnabled]);

  // Toggle specific notification type
  const toggleNotificationType = useCallback(async (
    type: keyof Pick<NotificationPreferences, 
      'sessionReminders' | 'boostNotifications' | 'affirmations' | 
      'daydreamLogs' | 'habitTracking' | 'progressUpdates' | 
      'achievements' | 'reEngagement'
    >
  ) => {
    if (!preferences) return;

    try {
      const updatedPrefs = await notificationPreferencesService.toggleNotificationType(userId, type);
      setPreferences(updatedPrefs);

      if (isNotificationsEnabled && updatedPrefs.enabled) {
        await notificationScheduler.scheduleAllNotifications(updatedPrefs);
      }
    } catch (error) {
      console.error('Error toggling notification type:', error);
    }
  }, [preferences, userId, isNotificationsEnabled]);

  // Toggle all notifications
  const toggleAllNotifications = useCallback(async (enabled: boolean) => {
    if (!preferences) return;

    try {
      const updatedPrefs = await notificationPreferencesService.toggleAllNotifications(userId, enabled);
      setPreferences(updatedPrefs);

      if (enabled && isNotificationsEnabled) {
        await notificationScheduler.scheduleAllNotifications(updatedPrefs);
      } else {
        await notificationService.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Error toggling all notifications:', error);
    }
  }, [preferences, userId, isNotificationsEnabled]);

  // Send immediate notification
  const sendNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    try {
      return await notificationService.sendImmediateNotification({
        type: 'session_reminder' as any, // Default type
        title,
        body,
        data,
        sound: true,
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }, []);

  // Schedule notification for specific time
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    scheduledDate: Date,
    data?: Record<string, any>
  ) => {
    try {
      return await notificationScheduler.scheduleOneTimeNotification(
        'session_reminder' as any, // Default type
        title,
        body,
        scheduledDate,
        data
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }, []);

  // Send achievement notification
  const sendAchievementNotification = useCallback(async (
    achievementType: string,
    message: string
  ) => {
    try {
      return await notificationScheduler.scheduleAchievementNotification(
        achievementType,
        message
      );
    } catch (error) {
      console.error('Error sending achievement notification:', error);
      throw error;
    }
  }, []);

  // Send progress update notification
  const sendProgressNotification = useCallback(async (
    progressType: string,
    message: string
  ) => {
    try {
      return await notificationScheduler.scheduleProgressUpdateNotification(
        progressType,
        message
      );
    } catch (error) {
      console.error('Error sending progress notification:', error);
      throw error;
    }
  }, []);

  // Send re-engagement notification
  const sendReEngagementNotification = useCallback(async (message: string) => {
    try {
      return await notificationScheduler.scheduleReEngagementNotification(message);
    } catch (error) {
      console.error('Error sending re-engagement notification:', error);
      throw error;
    }
  }, []);

  // Check if specific notification type is enabled
  const isNotificationTypeEnabled = useCallback((
    type: keyof Pick<NotificationPreferences, 
      'sessionReminders' | 'boostNotifications' | 'affirmations' | 
      'daydreamLogs' | 'habitTracking' | 'progressUpdates' | 
      'achievements' | 'reEngagement'
    >
  ): boolean => {
    if (!preferences || !isNotificationsEnabled) return false;
    return preferences.enabled && preferences[type];
  }, [preferences, isNotificationsEnabled]);

  // Reset to default preferences
  const resetToDefaults = useCallback(async () => {
    try {
      const defaultPrefs = await notificationPreferencesService.resetToDefaults(userId);
      setPreferences(defaultPrefs);

      if (isNotificationsEnabled && defaultPrefs.enabled) {
        await notificationScheduler.scheduleAllNotifications(defaultPrefs);
      }
    } catch (error) {
      console.error('Error resetting to defaults:', error);
    }
  }, [userId, isNotificationsEnabled]);

  // Load state on mount
  useEffect(() => {
    loadNotificationState();
  }, [loadNotificationState]);

  return {
    // State
    preferences,
    isNotificationsEnabled,
    isLoading,
    
    // Actions
    requestPermissions,
    updatePreferences,
    toggleNotificationType,
    toggleAllNotifications,
    sendNotification,
    scheduleNotification,
    sendAchievementNotification,
    sendProgressNotification,
    sendReEngagementNotification,
    isNotificationTypeEnabled,
    resetToDefaults,
    loadNotificationState,
  };
} 