import { theme } from './theme';

export { theme };

// Export commonly used theme parts for convenience
export const {
  foundations: { colors, spacing, radii, shadows, fonts },
  components: { typography, button, layout },
  utils: { createSpacing, createTextStyle, createButtonStyle }
} = theme;

export { ScreenWrapper } from './ScreenWrapper'; 

export const ONBOARDING_ANSWERS_KEY = 'onboarding_answers_completed';
export const VOICE_CLONE_STATUS_KEY = 'voice_clone_status';
export const FIRST_TIME_USER_KEY = '@first_time_user'; 