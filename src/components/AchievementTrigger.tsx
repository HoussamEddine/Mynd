import React, { useEffect } from 'react';
import { useAchievementCelebration } from '../hooks/useAchievementCelebration';
import { statsService } from '../services/statsService';
import { useAuth } from '../contexts/AuthContext';

interface AchievementTriggerProps {
  triggerOnMount?: boolean;
  triggerOnStatsChange?: boolean;
  children?: React.ReactNode;
}

export const AchievementTrigger: React.FC<AchievementTriggerProps> = ({
  triggerOnMount = false,
  triggerOnStatsChange = false,
  children
}) => {
  const { user } = useAuth();
  const { checkForAchievements } = useAchievementCelebration();

  // Trigger achievement check on mount
  useEffect(() => {
    if (triggerOnMount && user?.id) {
      const triggerAchievementCheck = async () => {
        try {
          const stats = await statsService.getUserStats(user.id);
          if (stats) {
            await checkForAchievements(stats);
          }
        } catch (error) {
          console.error('Error triggering achievement check:', error);
        }
      };

      triggerAchievementCheck();
    }
  }, [triggerOnMount, user?.id, checkForAchievements]);

  // This component doesn't render anything visible
  // It's just a utility component for triggering achievement checks
  return <>{children}</>;
};

export default AchievementTrigger;
