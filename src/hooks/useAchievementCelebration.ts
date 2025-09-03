import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCelebration } from './useCelebration';
import { achievementService, AchievementCheck } from '../services/achievementService';
import { statsService, StatsData } from '../services/statsService';

export const useAchievementCelebration = () => {
  const { user } = useAuth();
  const { celebrate } = useCelebration();
  const lastStatsRef = useRef<StatsData | null>(null);
  const isCheckingRef = useRef(false);

  // Check for achievements when stats change
  const checkForAchievements = useCallback(async (currentStats: StatsData) => {
    if (!user?.id || isCheckingRef.current) return;

    isCheckingRef.current = true;

    try {
      const achievementCheck: AchievementCheck = {
        userId: user.id,
        stats: currentStats,
        previousStats: lastStatsRef.current
      };

      const newAchievements = await achievementService.checkAchievements(achievementCheck);

      // Trigger celebrations for new achievements
      for (const achievement of newAchievements) {
        try {
          celebrate({
            title: 'Community Leader',
            subtitle: `${achievementCheck.stats.userRank || 0}`,
            description: `${achievementCheck.stats.topPercentage || 0}`,
            celebrationType: achievement.celebrationType,
            onContinue: () => {
              // Optional: Navigate to achievements screen or stats
            }
          });
        } catch (error) {
          console.error('Error calling celebration:', error);
        }
      }

      // Update last stats reference
      lastStatsRef.current = currentStats;
    } catch (error) {
      console.error('Error checking achievements:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [user?.id, celebrate]);



  // Clear achievement checks when user changes
  useEffect(() => {
    achievementService.clearRecentChecks();
  }, [user?.id]);

  return {
    checkForAchievements,
    // Expose achievement service methods for manual checks
    getUserAchievements: () => user?.id ? achievementService.getUserAchievements(user.id) : Promise.resolve([]),
    getAllAchievementTriggers: achievementService.getAllAchievementTriggers,
    getAchievementTrigger: achievementService.getAchievementTrigger
  };
};
