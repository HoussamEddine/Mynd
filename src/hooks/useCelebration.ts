import { useNavigation } from '@react-navigation/native';

interface CelebrationData {
  title?: string;
  subtitle?: string;
  description?: string;
  celebrationType?: 'achievement' | 'milestone' | 'breakthrough' | 'streak';
  onContinue?: () => void;
}

export const useCelebration = () => {
  const navigation = useNavigation();

  const celebrate = (data: CelebrationData = {}) => {
    try {
      navigation.navigate('CelebrationScreen' as never, {
        title: data.title || "Incredible Achievement!",
        subtitle: data.subtitle || "You're doing amazing!",
        description: data.description || "Your dedication and consistency are paying off. Keep up the fantastic work!",
        celebrationType: data.celebrationType || 'achievement',
        onContinue: data.onContinue,
      } as never);
    } catch (error) {
      console.error('useCelebration: Navigation error:', error);
    }
  };

  const celebrateAchievement = (title: string, description?: string) => {
    celebrate({
      title,
      subtitle: "Achievement Unlocked!",
      description: description || "You've reached a new milestone in your journey!",
      celebrationType: 'achievement',
    });
  };

  const celebrateMilestone = (title: string, description?: string) => {
    celebrate({
      title,
      subtitle: "Milestone Reached!",
      description: description || "You're making incredible progress!",
      celebrationType: 'milestone',
    });
  };

  const celebrateBreakthrough = (title: string, description?: string) => {
    celebrate({
      title,
      subtitle: "Breakthrough Moment!",
      description: description || "You've discovered something powerful about yourself!",
      celebrationType: 'breakthrough',
    });
  };

  const celebrateStreak = (days: number) => {
    celebrate({
      title: `${days} Day Streak!`,
      subtitle: "Consistency Champion!",
      description: `You've practiced for ${days} days in a row. Your dedication is inspiring!`,
      celebrationType: 'streak',
    });
  };

  return {
    celebrate,
    celebrateAchievement,
    celebrateMilestone,
    celebrateBreakthrough,
    celebrateStreak,
  };
};
