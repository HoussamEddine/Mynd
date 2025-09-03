import { supabase } from '../lib/supabase';
import { useCelebration } from '../hooks/useCelebration';

export interface AchievementTrigger {
  id: string;
  type: 'streak' | 'sessions' | 'rating' | 'community' | 'transformation';
  title: string;
  description: string;
  condition: (stats: any) => boolean;
  celebrationType: 'achievement' | 'milestone' | 'breakthrough' | 'streak';
}

export interface AchievementCheck {
  userId: string;
  stats: any;
  previousStats?: any;
}

class AchievementService {
  private static instance: AchievementService;
  private lastCheckedAchievements: Set<string> = new Set();

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  // Define achievement triggers - Only Community Achievements
  private achievementTriggers: AchievementTrigger[] = [
    // Community Achievements Only
    {
      id: 'top_10_percent',
      type: 'community',
      title: 'Community Leader',
      description: 'Reach top 10% of users',
      condition: (stats) => stats.topPercentage <= 10 && stats.topPercentage > 5,
      celebrationType: 'achievement'
    },
    {
      id: 'top_5_percent',
      type: 'community',
      title: 'Elite Performer',
      description: 'Reach top 5% of users',
      condition: (stats) => stats.topPercentage <= 5 && stats.topPercentage > 1,
      celebrationType: 'milestone'
    },
    {
      id: 'top_1_percent',
      type: 'community',
      title: 'Legendary Status',
      description: 'Reach top 1% of users',
      condition: (stats) => stats.topPercentage <= 1,
      celebrationType: 'breakthrough'
    }
  ];

  // Check for new achievements
  async checkAchievements(check: AchievementCheck): Promise<AchievementTrigger[]> {
    const newAchievements: AchievementTrigger[] = [];

    for (const trigger of this.achievementTriggers) {
      const achievementKey = `${check.userId}_${trigger.id}`;
      
      // Skip if we've already checked this achievement recently
      if (this.lastCheckedAchievements.has(achievementKey)) {
        continue;
      }

      // Check if achievement condition is met
      if (trigger.condition(check.stats)) {
        // Check if this is a new achievement (not previously unlocked)
        const isNewAchievement = await this.isNewAchievement(check.userId, trigger.id);
        
        if (isNewAchievement) {
          newAchievements.push(trigger);
          // Mark as checked to avoid duplicate celebrations
          this.lastCheckedAchievements.add(achievementKey);
          
          // Store achievement unlock
          await this.storeAchievementUnlock(check.userId, trigger);
        }
      }
    }

    return newAchievements;
  }

  // Check if achievement is new (not previously unlocked)
  private async isNewAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking achievement:', error);
        return false;
      }

      // If no record exists, it's a new achievement
      return !data;
    } catch (error) {
      console.error('Error checking achievement status:', error);
      return false;
    }
  }

  // Store achievement unlock in database
  private async storeAchievementUnlock(userId: string, trigger: AchievementTrigger): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: trigger.id,
          title: trigger.title,
          description: trigger.description,
          type: trigger.type,
          unlocked_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing achievement unlock:', error);
      }
    } catch (error) {
      console.error('Error storing achievement:', error);
    }
  }

  // Get user's unlocked achievements
  async getUserAchievements(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('Error fetching user achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  // Clear recent achievement checks (call this periodically)
  clearRecentChecks(): void {
    this.lastCheckedAchievements.clear();
  }

  // Get achievement trigger by ID
  getAchievementTrigger(achievementId: string): AchievementTrigger | undefined {
    return this.achievementTriggers.find(trigger => trigger.id === achievementId);
  }

  // Get all achievement triggers
  getAllAchievementTriggers(): AchievementTrigger[] {
    return [...this.achievementTriggers];
  }
}

export const achievementService = AchievementService.getInstance();
