import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationFrequencyManager } from './NotificationFrequencyManager';
import { NotificationType } from '../types/notifications';

interface NotificationAnalyticsData {
  totalSent: number;
  totalOpened: number;
  totalDismissed: number;
  typeStats: Record<NotificationType, {
    sent: number;
    opened: number;
    dismissed: number;
    openRate: number;
  }>;
  dailyStats: Record<string, {
    sent: number;
    opened: number;
    dismissed: number;
  }>;
  weeklyStats: Record<string, {
    sent: number;
    opened: number;
    dismissed: number;
    averageOpenRate: number;
  }>;
  lastUpdated: number;
}

interface NotificationEvent {
  id: string;
  type: NotificationType;
  action: 'sent' | 'opened' | 'dismissed';
  timestamp: number;
  userId: string;
  data?: Record<string, any>;
}

export class NotificationAnalytics {
  private static instance: NotificationAnalytics;
  private readonly ANALYTICS_DATA_KEY = '@mynd_notification_analytics';
  private readonly EVENTS_KEY = '@mynd_notification_events';

  private constructor() {}

  public static getInstance(): NotificationAnalytics {
    if (!NotificationAnalytics.instance) {
      NotificationAnalytics.instance = new NotificationAnalytics();
    }
    return NotificationAnalytics.instance;
  }

  /**
   * Record a notification event
   */
  async recordEvent(event: NotificationEvent): Promise<void> {
    try {
      // Store the event
      await this.storeEvent(event);
      
      // Update analytics data
      await this.updateAnalyticsData(event);
      
      console.log(`Notification event recorded: ${event.action} for ${event.type}`);
    } catch (error) {
      console.error('Error recording notification event:', error);
    }
  }

  /**
   * Record notification sent
   */
  async recordNotificationSent(
    userId: string,
    type: NotificationType,
    notificationId: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.recordEvent({
      id: notificationId,
      type,
      action: 'sent',
      timestamp: Date.now(),
      userId,
      data
    });
  }

  /**
   * Record notification opened
   */
  async recordNotificationOpened(
    userId: string,
    type: NotificationType,
    notificationId: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.recordEvent({
      id: notificationId,
      type,
      action: 'opened',
      timestamp: Date.now(),
      userId,
      data
    });
  }

  /**
   * Record notification dismissed
   */
  async recordNotificationDismissed(
    userId: string,
    type: NotificationType,
    notificationId: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.recordEvent({
      id: notificationId,
      type,
      action: 'dismissed',
      timestamp: Date.now(),
      userId,
      data
    });
  }

  /**
   * Get analytics summary for a user
   */
  async getAnalyticsSummary(userId: string): Promise<{
    totalSent: number;
    totalOpened: number;
    totalDismissed: number;
    overallOpenRate: number;
    typeBreakdown: Record<NotificationType, {
      sent: number;
      opened: number;
      dismissed: number;
      openRate: number;
    }>;
    recentTrends: {
      last7Days: { sent: number; opened: number; openRate: number };
      last30Days: { sent: number; opened: number; openRate: number };
    };
    engagementLevel: string;
    consecutiveDaysActive: number;
  }> {
    try {
      const analyticsData = await this.getAnalyticsData(userId);
      const engagementStats = await notificationFrequencyManager.getUserEngagementStats(userId);
      
      const overallOpenRate = analyticsData.totalSent > 0 
        ? (analyticsData.totalOpened / analyticsData.totalSent) * 100 
        : 0;

      // Calculate recent trends
      const last7Days = this.calculateRecentTrends(analyticsData.dailyStats, 7);
      const last30Days = this.calculateRecentTrends(analyticsData.dailyStats, 30);

      return {
        totalSent: analyticsData.totalSent,
        totalOpened: analyticsData.totalOpened,
        totalDismissed: analyticsData.totalDismissed,
        overallOpenRate,
        typeBreakdown: analyticsData.typeStats,
        recentTrends: {
          last7Days,
          last30Days
        },
        engagementLevel: engagementStats.engagementLevel,
        consecutiveDaysActive: engagementStats.consecutiveDaysActive
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        totalSent: 0,
        totalOpened: 0,
        totalDismissed: 0,
        overallOpenRate: 0,
        typeBreakdown: {} as any,
        recentTrends: {
          last7Days: { sent: 0, opened: 0, openRate: 0 },
          last30Days: { sent: 0, opened: 0, openRate: 0 }
        },
        engagementLevel: 'medium',
        consecutiveDaysActive: 0
      };
    }
  }

  /**
   * Get performance insights
   */
  async getPerformanceInsights(userId: string): Promise<{
    bestPerformingType: NotificationType | null;
    worstPerformingType: NotificationType | null;
    optimalSendingTime: string;
    recommendations: string[];
  }> {
    try {
      const analyticsData = await this.getAnalyticsData(userId);
      const events = await this.getEvents(userId);
      
      // Find best and worst performing notification types
      let bestType: NotificationType | null = null;
      let worstType: NotificationType | null = null;
      let bestOpenRate = 0;
      let worstOpenRate = 100;

      Object.entries(analyticsData.typeStats).forEach(([type, stats]) => {
        if (stats.sent > 5) { // Only consider types with sufficient data
          if (stats.openRate > bestOpenRate) {
            bestOpenRate = stats.openRate;
            bestType = type as NotificationType;
          }
          if (stats.openRate < worstOpenRate) {
            worstOpenRate = stats.openRate;
            worstType = type as NotificationType;
          }
        }
      });

      // Analyze optimal sending time (simplified - in real app, you'd analyze hour patterns)
      const optimalSendingTime = this.analyzeOptimalSendingTime(events);

      // Generate recommendations
      const recommendations = this.generateRecommendations(analyticsData, events);

      return {
        bestPerformingType: bestType,
        worstPerformingType: worstType,
        optimalSendingTime,
        recommendations
      };
    } catch (error) {
      console.error('Error getting performance insights:', error);
      return {
        bestPerformingType: null,
        worstPerformingType: null,
        optimalSendingTime: '9:00 AM',
        recommendations: ['Continue monitoring notification performance']
      };
    }
  }

  /**
   * Store an event
   */
  private async storeEvent(event: NotificationEvent): Promise<void> {
    try {
      const events = await this.getEvents(event.userId);
      events.push(event);
      
      // Keep only last 1000 events to prevent storage bloat
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      await AsyncStorage.setItem(
        `${this.EVENTS_KEY}_${event.userId}`,
        JSON.stringify(events)
      );
    } catch (error) {
      console.error('Error storing event:', error);
    }
  }

  /**
   * Get events for a user
   */
  private async getEvents(userId: string): Promise<NotificationEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(`${this.EVENTS_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Update analytics data based on an event
   */
  private async updateAnalyticsData(event: NotificationEvent): Promise<void> {
    try {
      const analyticsData = await this.getAnalyticsData(event.userId);
      const dateKey = new Date(event.timestamp).toDateString();
      const weekKey = this.getWeekKey(event.timestamp);

      // Update overall stats
      if (event.action === 'sent') analyticsData.totalSent++;
      if (event.action === 'opened') analyticsData.totalOpened++;
      if (event.action === 'dismissed') analyticsData.totalDismissed++;

      // Update type stats
      if (!analyticsData.typeStats[event.type]) {
        analyticsData.typeStats[event.type] = {
          sent: 0,
          opened: 0,
          dismissed: 0,
          openRate: 0
        };
      }

      const typeStats = analyticsData.typeStats[event.type];
      if (event.action === 'sent') typeStats.sent++;
      if (event.action === 'opened') typeStats.opened++;
      if (event.action === 'dismissed') typeStats.dismissed++;

      // Calculate open rate for this type
      if (typeStats.sent > 0) {
        typeStats.openRate = (typeStats.opened / typeStats.sent) * 100;
      }

      // Update daily stats
      if (!analyticsData.dailyStats[dateKey]) {
        analyticsData.dailyStats[dateKey] = { sent: 0, opened: 0, dismissed: 0 };
      }

      const dailyStats = analyticsData.dailyStats[dateKey];
      if (event.action === 'sent') dailyStats.sent++;
      if (event.action === 'opened') dailyStats.opened++;
      if (event.action === 'dismissed') dailyStats.dismissed++;

      // Update weekly stats
      if (!analyticsData.weeklyStats[weekKey]) {
        analyticsData.weeklyStats[weekKey] = { sent: 0, opened: 0, dismissed: 0, averageOpenRate: 0 };
      }

      const weeklyStats = analyticsData.weeklyStats[weekKey];
      if (event.action === 'sent') weeklyStats.sent++;
      if (event.action === 'opened') weeklyStats.opened++;
      if (event.action === 'dismissed') weeklyStats.dismissed++;

      // Calculate weekly average open rate
      if (weeklyStats.sent > 0) {
        weeklyStats.averageOpenRate = (weeklyStats.opened / weeklyStats.sent) * 100;
      }

      analyticsData.lastUpdated = Date.now();

      await this.saveAnalyticsData(event.userId, analyticsData);
    } catch (error) {
      console.error('Error updating analytics data:', error);
    }
  }

  /**
   * Get analytics data for a user
   */
  private async getAnalyticsData(userId: string): Promise<NotificationAnalyticsData> {
    try {
      const stored = await AsyncStorage.getItem(`${this.ANALYTICS_DATA_KEY}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      return {
        totalSent: 0,
        totalOpened: 0,
        totalDismissed: 0,
        typeStats: {} as Record<NotificationType, any>,
        dailyStats: {},
        weeklyStats: {},
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return {
        totalSent: 0,
        totalOpened: 0,
        totalDismissed: 0,
        typeStats: {} as Record<NotificationType, any>,
        dailyStats: {},
        weeklyStats: {},
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Save analytics data for a user
   */
  private async saveAnalyticsData(userId: string, data: NotificationAnalyticsData): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.ANALYTICS_DATA_KEY}_${userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  /**
   * Calculate recent trends
   */
  private calculateRecentTrends(dailyStats: Record<string, any>, days: number): {
    sent: number;
    opened: number;
    openRate: number;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let totalSent = 0;
    let totalOpened = 0;

    Object.entries(dailyStats).forEach(([dateKey, stats]) => {
      const date = new Date(dateKey);
      if (date >= cutoffDate) {
        totalSent += stats.sent;
        totalOpened += stats.opened;
      }
    });

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    return { sent: totalSent, opened: totalOpened, openRate };
  }

  /**
   * Get week key for a timestamp
   */
  private getWeekKey(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  /**
   * Analyze optimal sending time (simplified)
   */
  private analyzeOptimalSendingTime(events: NotificationEvent[]): string {
    // In a real implementation, you'd analyze which hours have the highest open rates
    // For now, return a default time
    return '9:00 AM';
  }

  /**
   * Generate recommendations based on analytics
   */
  private generateRecommendations(analyticsData: NotificationAnalyticsData, events: NotificationEvent[]): string[] {
    const recommendations: string[] = [];

    // Check overall open rate
    const overallOpenRate = analyticsData.totalSent > 0 
      ? (analyticsData.totalOpened / analyticsData.totalSent) * 100 
      : 0;

    if (overallOpenRate < 20) {
      recommendations.push('Consider reducing notification frequency to improve engagement');
    }

    if (analyticsData.totalDismissed > analyticsData.totalOpened) {
      recommendations.push('Many notifications are being dismissed - review timing and content');
    }

    // Check for notification types with low engagement
    Object.entries(analyticsData.typeStats).forEach(([type, stats]) => {
      if (stats.sent > 10 && stats.openRate < 15) {
        recommendations.push(`Consider optimizing ${type} notifications - low engagement detected`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Notification performance looks good - keep up the great work!');
    }

    return recommendations;
  }
}

// Export singleton instance
export const notificationAnalytics = NotificationAnalytics.getInstance(); 