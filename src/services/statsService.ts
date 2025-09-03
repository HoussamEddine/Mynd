import { supabase } from '../lib/supabase';
import { errorHandlerService } from './errorHandlerService';
import { databaseService } from './databaseService';
import { differenceInDays, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export interface StatsData {
  // Daily Streak & Consistency
  currentStreak: number;
  longestStreak: number;
  perfectDays: number;
  weeklyCompletionRate: number;
  
  // Session Performance
  totalSessions: number;
  averageSessionDuration: number;
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  
  // Belief Evolution
  beliefStrength: number;
  beliefTransformationProgress: number;
  daysSinceStarted: number;
  beliefAge: number;
  
  // Feature Engagement
  affirmationsUsed: number;
  boostsUsed: number;
  daydreamsLogged: number;
  daydreamsThisWeek: number;
  daydreamsLastWeek: number;
  mostUsedFeature: string;
  
  // Progress Velocity
  weeklyProgressRate: number;
  breakthroughMoments: number;
  accelerationScore: number;
  
  // Wellness Indicators
  moodImprovement: number;
  stressReduction: number;
  sleepQuality: number;
  
  // Achievements
  achievements: Achievement[];
  
  // Social/Community
  userRank: number;
  topPercentage: number;
  communityAverage: number;
  beliefGrowth: number;
  transformationSpeed: number;
  hiddenBeliefsDetected: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockDate?: string;
}

class StatsService {
  private static instance: StatsService;

  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  async getUserStats(userId: string): Promise<StatsData> {
    try {
      // Get user data
      const user = await databaseService.getUser(userId);
      if (!user) throw new Error('User not found');

      // Get beliefs
      const beliefs = await this.getUserBeliefs(userId);
      
      // Get the active belief ID (most recent active belief)
      const activeBelief = beliefs.find((belief: any) => belief.status === 'active') || beliefs[0];
      
      // Get belief progress (strength ratings) for the active belief
      const beliefProgress = await this.getUserBeliefProgress(userId, activeBelief?.id);
      
      // Get practice sessions
      const sessions = await this.getUserSessions(userId);
      
      // Get stories (daydreams)
      const stories = await this.getUserStories(userId);
      
      // Get AI audio content (boosts)
      const audioContent = await this.getUserAudioContent(userId);

      // Calculate stats
      const stats: StatsData = {
        // Daily Streak & Consistency
        currentStreak: await this.calculateCurrentStreak(userId),
        longestStreak: await this.calculateLongestStreak(userId),
        perfectDays: await this.calculatePerfectDays(userId),
        weeklyCompletionRate: await this.calculateWeeklyCompletionRate(userId),
        
        // Session Performance
        totalSessions: this.calculateSessionsThisWeek(sessions), // Changed to show last 7 days instead of all time
        averageSessionDuration: this.calculateAverageSessionDuration(sessions),
        sessionsThisWeek: this.calculateSessionsThisWeek(sessions),
        sessionsLastWeek: this.calculateSessionsLastWeek(sessions),
        
        // Belief Evolution
        beliefStrength: this.calculateLatestBeliefStrength(beliefProgress),
        beliefTransformationProgress: await this.calculateBeliefTransformationProgress(userId, beliefs, sessions),
        daysSinceStarted: this.calculateDaysSinceStarted(user.created_at),
        beliefAge: this.calculateAverageBeliefAge(beliefs),
        
        // Feature Engagement
        affirmationsUsed: 0, // Placeholder - not tracking individual affirmations
        boostsUsed: audioContent.filter((content: any) => content.content_type === 'daily_boost').length,
        daydreamsLogged: this.calculateStoriesThisWeek(stories), // Changed to show last 7 days instead of all time
        daydreamsThisWeek: this.calculateStoriesThisWeek(stories),
        daydreamsLastWeek: this.calculateStoriesLastWeek(stories),
        mostUsedFeature: this.calculateMostUsedFeature(audioContent, stories),
        
        // Progress Velocity
        weeklyProgressRate: await this.calculateWeeklyProgressRate(userId),
        breakthroughMoments: await this.calculateBreakthroughMoments(userId),
        accelerationScore: await this.calculateAccelerationScore(userId),
        
        // Wellness Indicators (placeholder values for now)
        moodImprovement: 15,
        stressReduction: 25,
        sleepQuality: 20,
        
        // Achievements
        achievements: await this.calculateAchievements(userId, beliefs, sessions, stories),
        
        // Social/Community (calculated from real data)
        userRank: await this.calculateUserRank(userId),
        topPercentage: await this.calculateTopPercentage(userId),
        communityAverage: await this.calculateCommunityAverage(),
        beliefGrowth: this.calculateBeliefGrowth(beliefProgress),
        transformationSpeed: await this.calculateTransformationSpeed(userId, beliefs, sessions),
        hiddenBeliefsDetected: await this.calculateHiddenBeliefsDetected(stories),
      };

      return stats;
    } catch (error) {
      errorHandlerService.logError(error, 'STATS_SERVICE - Error getting user stats');
      throw error;
    }
  }

  private async getUserBeliefs(userId: string) {
    const { data, error } = await supabase
      .from('beliefs')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  private async getUserBeliefProgress(userId: string, beliefId?: string) {
    let query = supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', 'rating')
      .not('repetitions_completed', 'is', null)
      .order('session_date', { ascending: true });
    
    // If beliefId is provided, filter by it
    if (beliefId) {
      query = query.eq('belief_id', beliefId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  private async getUserSessions(userId: string) {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true);
    
    if (error) throw error;
    return data || [];
  }

  private async getUserStories(userId: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        errorHandlerService.logError('Stories table query failed, using fallback data: ' + error.message, 'STATS_SERVICE');
        // Return empty array as fallback - this will show 0 in stats
        return [];
      }
      return data || [];
    } catch (error) {
      errorHandlerService.logError(error, 'STATS_SERVICE - Error fetching stories, using fallback data');
      // Return empty array as fallback - this will show 0 in stats
      return [];
    }
  }


  private async getUserAudioContent(userId: string) {
    const { data, error } = await supabase
      .from('ai_audio_content')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);
      if (sessions.length === 0) return 0;

      // Group sessions by date
      const sessionsByDate = new Set(
        sessions.map((session: any) => session.session_date.split('T')[0])
      );

      const sortedDates = Array.from(sessionsByDate).sort().reverse() as string[];
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];

      // Check if today has a session
      if (sessionsByDate.has(today)) {
        currentStreak = 1;
        
        // Count consecutive days backwards from today
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i]);
          const previousDate = new Date(sortedDates[i - 1]);
          const diffTime = Math.abs(previousDate.getTime() - currentDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else {
        // If no session today, check recent consecutive days
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const currentDate = new Date(sortedDates[i]);
          const nextDate = new Date(sortedDates[i + 1]);
          const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
        if (currentStreak > 0) currentStreak++; // Add the last day
      }

      return currentStreak;
    } catch (error) {
      errorHandlerService.logError(error, 'STATS_SERVICE - Error calculating current streak');
      return 0;
    }
  }

  private async calculateLongestStreak(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);
      if (sessions.length === 0) return 0;

      // Group sessions by date and calculate longest streak
      const sessionsByDate = new Set(
        sessions.map((session: any) => session.session_date.split('T')[0])
      );

      let longestStreak = 0;
      let currentStreak = 0;
      const sortedDates = Array.from(sessionsByDate).sort() as string[];

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0 || this.areConsecutiveDays(sortedDates[i - 1], sortedDates[i])) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }

      return Math.max(longestStreak, currentStreak);
    } catch (error) {
      errorHandlerService.logError(error, 'STATS_SERVICE - Error calculating longest streak');
      return 0;
    }
  }

  private areConsecutiveDays(date1: string, date2: string): boolean {
    const day1 = new Date(date1);
    const day2 = new Date(date2);
    const diffTime = Math.abs(day2.getTime() - day1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }

  private async calculatePerfectDays(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);
      const thisWeekStart = startOfWeek(new Date());
      const thisWeekEnd = endOfWeek(new Date());

      const thisWeekSessions = sessions.filter((session: any) => {
        const sessionDate = new Date(session.session_date);
        return sessionDate >= thisWeekStart && sessionDate <= thisWeekEnd;
      });

      const sessionsByDate = new Set(
        thisWeekSessions.map((session: any) => session.session_date.split('T')[0])
      );

      return sessionsByDate.size;
    } catch (error) {
      console.error('Error calculating perfect days:', error);
      return 0;
    }
  }

  private async calculateWeeklyCompletionRate(userId: string): Promise<number> {
    try {
      const beliefs = await this.getUserBeliefs(userId);
      const sessions = await this.getUserSessions(userId);
      
      if (beliefs.length === 0) return 0;

      const thisWeekStart = startOfWeek(new Date());
      const thisWeekEnd = endOfWeek(new Date());

      const thisWeekSessions = sessions.filter((session: any) => {
        const sessionDate = new Date(session.session_date);
        return sessionDate >= thisWeekStart && sessionDate <= thisWeekEnd;
      });

      const sessionsByDate = new Set(
        thisWeekSessions.map((session: any) => session.session_date.split('T')[0])
      );

      const daysInWeek = 7;
      const completionRate = (sessionsByDate.size / daysInWeek) * 100;

      return Math.round(completionRate);
    } catch (error) {
      console.error('Error calculating weekly completion rate:', error);
      return 0;
    }
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum: number, session: any) => sum + (session.duration_seconds || 0), 0);
    const averageMinutes = totalDuration / sessions.length / 60;
    
    return Math.round(averageMinutes * 10) / 10; // Round to 1 decimal place
  }

  private calculateSessionsThisWeek(sessions: any[]): number {
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const today = new Date();

    return sessions.filter((session: any) => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= sevenDaysAgo && sessionDate <= today;
    }).length;
  }

  private calculateSessionsLastWeek(sessions: any[]): number {
    const fourteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return sessions.filter((session: any) => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= fourteenDaysAgo && sessionDate <= sevenDaysAgo;
    }).length;
  }

  private calculateLatestBeliefStrength(beliefProgress: any[]): number {
    if (beliefProgress.length === 0) return 0;
    
    // Get the most recent rating (latest rating)
    const sortedProgress = beliefProgress.sort((a: any, b: any) => 
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );
    
    const latestStrength = sortedProgress[0].repetitions_completed || 0;
    
    // Return the latest rating (1-10 scale)
    return latestStrength;
  }

  private async calculateBeliefTransformationProgress(userId: string, beliefs: any[], sessions: any[]): Promise<number> {
    if (beliefs.length === 0) return 0;
    
    // Get the active belief ID (most recent active belief)
    const activeBelief = beliefs.find(belief => belief.status === 'active') || beliefs[0];
    if (!activeBelief) return 0;
    
    // Get belief progress data (ratings) for this specific belief - ordered by date to get first and latest
    const beliefProgress = await this.getUserBeliefProgress(userId, activeBelief.id);
    
    if (beliefProgress.length === 0) return 0;
    
    // Get the first rating (starting point)
    const firstRating = beliefProgress[0]?.repetitions_completed || 0;
    
    // Get the highest rating achieved (best progress point)
    const highestRating = Math.max(...beliefProgress.map((p: any) => p.repetitions_completed || 0));
    
    // Get the most recent rating (current point)
    const latestRating = beliefProgress[beliefProgress.length - 1]?.repetitions_completed || 0;
    
    // Target is always 10
    const targetRating = 10;
    
    // Calculate transformation progress: ((Current - Starting) / (Target - Starting)) * 100
    if (targetRating === firstRating) {
      // If starting point is already the target, return 100%
      return 100;
    }
    
    const transformationProgress = ((highestRating - firstRating) / (targetRating - firstRating)) * 100;
    
    // Handle negative progress (when belief strength decreases)
    if (transformationProgress < 0) {
      return 0;
    }
    
    // Ensure the result is between 0 and 100
    return Math.min(100, Math.round(transformationProgress));
  }

  private calculateDaysSinceStarted(createdAt: string): number {
    return differenceInDays(new Date(), new Date(createdAt));
  }

  private calculateAverageBeliefAge(beliefs: any[]): number {
    if (beliefs.length === 0) return 0;
    
    const totalAge = beliefs.reduce((sum, belief) => {
      return sum + differenceInDays(new Date(), new Date(belief.created_at));
    }, 0);
    
    return Math.round(totalAge / beliefs.length);
  }

  private calculateStoriesThisWeek(stories: any[]): number {
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const today = new Date();

    return stories.filter((story: any) => {
      const storyDate = new Date(story.created_at);
      return storyDate >= sevenDaysAgo && storyDate <= today;
    }).length;
  }

  private calculateStoriesLastWeek(stories: any[]): number {
    const fourteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return stories.filter((story: any) => {
      const storyDate = new Date(story.created_at);
      return storyDate >= fourteenDaysAgo && storyDate <= sevenDaysAgo;
    }).length;
  }

  private calculateMostUsedFeature(audioContent: any[], stories: any[]): string {
    const featureCounts = {
      'Boosts': audioContent.filter((content: any) => content.content_type === 'daily_boost').length,
      'Daydreams': stories.length,
    };

    return Object.entries(featureCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  private async calculateWeeklyProgressRate(userId: string): Promise<number> {
    // Placeholder implementation
    return 12;
  }

  private async calculateBreakthroughMoments(userId: string): Promise<number> {
    try {
      const stories = await this.getUserStories(userId);
      // Count stories with AI insights as breakthrough moments
      return stories.filter((story: any) => story.ai_insights).length;
    } catch (error) {
      console.error('Error calculating breakthrough moments:', error);
      return 0;
    }
  }

  private async calculateAccelerationScore(userId: string): Promise<number> {
    // Placeholder implementation
    return 8.2;
  }

  private async calculateHiddenBeliefsDetected(stories: any[]): Promise<number> {
    // Count stories that have AI insights with hidden core beliefs
    return stories.filter((story: any) => 
      story.ai_insights && story.ai_insights.hidden_core_belief
    ).length;
  }

  private async calculateUserRank(userId: string): Promise<number> {
    try {
      // Use a single query to get user rankings based on total sessions
      const { data: userRankings, error } = await supabase
        .from('practice_sessions')
        .select('user_id')
        .eq('completed', true)
        .then((result: any) => {
          if (result.error) throw result.error;
          
          // Group by user_id and count sessions
          const sessionCounts = new Map<string, number>();
          result.data?.forEach((session: any) => {
            const count = sessionCounts.get(session.user_id) || 0;
            sessionCounts.set(session.user_id, count + 1);
          });
          
          // Sort by session count (descending)
          const sortedUsers = Array.from(sessionCounts.entries())
            .sort(([, a], [, b]) => b - a);
          
          // Find user's rank
          const userSessionCount = sessionCounts.get(userId) || 0;
          const rank = sortedUsers.findIndex(([, count]) => count <= userSessionCount) + 1;
          
          return { data: rank, error: null };
        });
      
      if (error) throw error;
      return userRankings || 1;
    } catch (error) {
      console.error('Error calculating user rank:', error);
      return 1; // Fallback to top rank
    }
  }

  private async calculateTopPercentage(userId: string): Promise<number> {
    try {
      // Get total unique users who have completed sessions
      const { data: uniqueUsers, error } = await supabase
        .from('practice_sessions')
        .select('user_id')
        .eq('completed', true)
        .then((result: any) => {
          if (result.error) throw result.error;
          
          // Get unique user count
          const uniqueUserIds = new Set(result.data?.map((session: any) => session.user_id));
          return { data: uniqueUserIds.size, error: null };
        });
      
      if (error || !uniqueUsers) return 10;
      
      const userRank = await this.calculateUserRank(userId);
      const percentage = Math.round((userRank / uniqueUsers) * 100);
      return Math.min(100, Math.max(1, percentage));
    } catch (error) {
      console.error('Error calculating top percentage:', error);
      return 10; // Fallback
    }
  }

  private async calculateCommunityAverage(): Promise<number> {
    try {
      // Get average session duration across all users
      const { data: avgDuration, error } = await supabase
        .from('practice_sessions')
        .select('duration_seconds')
        .eq('completed', true)
        .then((result: any) => {
          if (result.error) throw result.error;
          
          if (!result.data || result.data.length === 0) return { data: 0, error: null };
          
          const totalDuration = result.data.reduce((sum: number, session: any) => 
            sum + (session.duration_seconds || 0), 0);
          const averageMinutes = totalDuration / result.data.length / 60;
          
          return { data: Math.round(averageMinutes * 10) / 10, error: null };
        });
      
      if (error) throw error;
      return avgDuration || 6.2;
    } catch (error) {
      console.error('Error calculating community average:', error);
      return 6.2; // Fallback
    }
  }

  private calculateBeliefGrowth(beliefProgress: any[]): number {
    if (beliefProgress.length === 0) return 0;
    
    // Group progress by belief_id to calculate growth per belief
    const progressByBelief = new Map<string, any[]>();
    beliefProgress.forEach((progress: any) => {
      if (!progressByBelief.has(progress.belief_id)) {
        progressByBelief.set(progress.belief_id, []);
      }
      progressByBelief.get(progress.belief_id)!.push(progress);
    });
    
    let totalGrowth = 0;
    let beliefCount = 0;
    
    // Calculate growth for each belief (first rating vs latest rating)
    progressByBelief.forEach((progressList: any[]) => {
      if (progressList.length >= 2) {
        // Sort by date to get first and latest ratings
        const sortedProgress = progressList.sort((a: any, b: any) => 
          new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
        );
        
        const initialStrength = sortedProgress[0].repetitions_completed;
        const latestStrength = sortedProgress[sortedProgress.length - 1].repetitions_completed;
        const growth = latestStrength - initialStrength;
        
        totalGrowth += growth;
        beliefCount++;
      }
    });
    
    if (beliefCount === 0) return 0;
    
    const averageGrowth = totalGrowth / beliefCount;
    return Math.round(averageGrowth * 10) / 10; // Round to 1 decimal place
  }

  private async calculateTransformationSpeed(userId: string, beliefs: any[], sessions: any[]): Promise<number> {
    if (beliefs.length === 0 || sessions.length === 0) return 1.0;
    
    // Get belief progress data to calculate rating improvement speed
    const beliefProgress = await this.getUserBeliefProgress(userId);
    
    if (beliefProgress.length < 2) return 1.0;
    
    // Calculate how quickly ratings are improving
    const sortedProgress = beliefProgress.sort((a: any, b: any) => 
      new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );
    
    const firstRating = sortedProgress[0].repetitions_completed;
    const latestRating = sortedProgress[sortedProgress.length - 1].repetitions_completed;
    const totalImprovement = latestRating - firstRating;
    
    // Calculate days between first and latest rating
    const firstDate = new Date(sortedProgress[0].session_date);
    const latestDate = new Date(sortedProgress[sortedProgress.length - 1].session_date);
    const daysBetween = Math.max(1, (latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate improvement per day
    const improvementPerDay = totalImprovement / daysBetween;
    
    // Convert to speed multiplier (0.5x to 3x)
    // 0.1 improvement per day = 1x speed
    // 0.2 improvement per day = 2x speed
    // 0.05 improvement per day = 0.5x speed
    const speedMultiplier = Math.min(3, Math.max(0.5, improvementPerDay * 10));
    
    return Math.round(speedMultiplier * 10) / 10;
  }

  private async calculateAchievements(
    userId: string, 
    beliefs: any[], 
    sessions: any[], 
    stories: any[]
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = [];
    const now = new Date();

    // First Week Warrior
    const firstWeekAchievement: Achievement = {
      id: 1,
      title: 'First Week Warrior',
      description: 'One week straight',
      icon: '',
      isUnlocked: await this.calculateCurrentStreak(userId) >= 7,
      progress: Math.min(await this.calculateCurrentStreak(userId), 7),
      maxProgress: 7,
      unlockDate: await this.calculateCurrentStreak(userId) >= 7 ? format(now, 'yyyy-MM-dd') : undefined,
    };
    achievements.push(firstWeekAchievement);

    // Belief Builder
    const beliefBuilderAchievement: Achievement = {
      id: 2,
      title: 'Belief Builder',
      description: '10 sessions completed',
      icon: '',
      isUnlocked: sessions.length >= 10,
      progress: Math.min(sessions.length, 10),
      maxProgress: 10,
      unlockDate: sessions.length >= 10 ? format(now, 'yyyy-MM-dd') : undefined,
    };
    achievements.push(beliefBuilderAchievement);

    // Feature Explorer
    const featureExplorerAchievement: Achievement = {
      id: 3,
      title: 'Feature Explorer',
      description: 'Used all features',
      icon: '',
      isUnlocked: beliefs.length > 0 && sessions.length > 0 && stories.length > 0,
      progress: [beliefs.length, sessions.length, stories.length].filter(count => count > 0).length,
      maxProgress: 3,
      unlockDate: beliefs.length > 0 && sessions.length > 0 && stories.length > 0 ? format(now, 'yyyy-MM-dd') : undefined,
    };
    achievements.push(featureExplorerAchievement);

    // Transformation Seeker
    const transformationSeekerAchievement: Achievement = {
      id: 4,
      title: 'Transformation Seeker',
      description: '30 days of practice',
      icon: '',
      isUnlocked: await this.calculateCurrentStreak(userId) >= 30,
      progress: Math.min(await this.calculateCurrentStreak(userId), 30),
      maxProgress: 30,
    };
    achievements.push(transformationSeekerAchievement);

    // Consistency Master
    const consistencyMasterAchievement: Achievement = {
      id: 5,
      title: 'Consistency Master',
      description: 'Perfect week',
      icon: '',
      isUnlocked: await this.calculatePerfectDays(userId) >= 7,
      progress: await this.calculatePerfectDays(userId),
      maxProgress: 7,
    };
    achievements.push(consistencyMasterAchievement);

    // Daydream Pioneer
    const daydreamPioneerAchievement: Achievement = {
      id: 6,
      title: 'Daydream Pioneer',
      description: '20 daydreams explored',
      icon: '',
      isUnlocked: stories.length >= 20,
      progress: Math.min(stories.length, 20),
      maxProgress: 20,
    };
    achievements.push(daydreamPioneerAchievement);

    // Hidden Belief Detective
    const hiddenBeliefDetectiveAchievement: Achievement = {
      id: 7,
      title: 'Hidden Belief Detective',
      description: '5 hidden beliefs discovered',
      icon: '',
      isUnlocked: await this.calculateHiddenBeliefsDetected(stories) >= 5,
      progress: Math.min(await this.calculateHiddenBeliefsDetected(stories), 5),
      maxProgress: 5,
    };
    achievements.push(hiddenBeliefDetectiveAchievement);

    // Belief Strength Champion
    const beliefStrengthChampionAchievement: Achievement = {
      id: 8,
      title: 'Belief Strength Champion',
      description: 'Reach 9/10 belief strength',
      icon: '',
      isUnlocked: this.calculateLatestBeliefStrength(beliefs) >= 9,
      progress: Math.min(this.calculateLatestBeliefStrength(beliefs), 9),
      maxProgress: 9,
    };
    achievements.push(beliefStrengthChampionAchievement);

    // Transformation Accelerator
    const transformationAcceleratorAchievement: Achievement = {
      id: 9,
      title: 'Transformation Accelerator',
      description: '50 sessions completed',
      icon: '',
      isUnlocked: sessions.length >= 50,
      progress: Math.min(sessions.length, 50),
      maxProgress: 50,
    };
    achievements.push(transformationAcceleratorAchievement);

    // Mindset Master
    const mindsetMasterAchievement: Achievement = {
      id: 10,
      title: 'Mindset Master',
      description: '100 days of practice',
      icon: '',
      isUnlocked: await this.calculateCurrentStreak(userId) >= 100,
      progress: Math.min(await this.calculateCurrentStreak(userId), 100),
      maxProgress: 100,
    };
    achievements.push(mindsetMasterAchievement);

    return achievements;
  }
}

export const statsService = StatsService.getInstance();
