// Onboarding Types - Matches Database Schema
// This file defines TypeScript interfaces for the new onboarding questionnaire structure

export interface WakeSleepTime {
  wakeUp: {
    hour: number; // 0-23
    minute: number; // 0-59
  };
  bedtime: {
    hour: number; // 0-23
    minute: number; // 0-59
  };
}

export interface ManualReminderTimes {
  wakeUp: {
    hour: number; // 0-23
    minute: number; // 0-59
  };
  bedtime: {
    hour: number; // 0-23
    minute: number; // 0-59
  };
}

// Valid options for each question type
export const VALID_GENDERS = ['Woman', 'Man'] as const;
export type Gender = typeof VALID_GENDERS[number];

export const VALID_MOTIVATION_OPTIONS = [
  'I want to shift negative self-talk',
  'I want to feel more confident and empowered',
  'I\'m going through a tough time emotionally',
  'I want to build a mindful daily practice',
  'I\'m curious about affirmations and self-growth',
] as const;
export type MotivationOption = typeof VALID_MOTIVATION_OPTIONS[number];

export const VALID_STRUGGLING_EMOTIONS = [
  'Anxiety',
  'Overthinking',
  'Self-doubt',
  'Shame',
  'Sadness',
  'Anger',
] as const;
export type StrugglingEmotion = typeof VALID_STRUGGLING_EMOTIONS[number];

export const VALID_SELF_RELATIONSHIP_OPTIONS = [
  'I criticize myself',
  'I avoid my emotions',
  'I shut down emotionally',
  'I distract myself by staying busy',
  'I try to stay positive, even if it\'s hard',
  'I\'m not sure',
] as const;
export type SelfRelationshipOption = typeof VALID_SELF_RELATIONSHIP_OPTIONS[number];

export const VALID_SELF_TALK_DIFFICULT_OPTIONS = [
  'I\'m hard on myself',
  'I try to stay optimistic',
  'I emotionally shut down',
  'I don\'t really notice my self-talk',
  'I\'m not sure',
] as const;
export type SelfTalkDifficultOption = typeof VALID_SELF_TALK_DIFFICULT_OPTIONS[number];

export const VALID_INNER_VOICE_CHANGE_OPTIONS = [
  'I want to be less self-critical',
  'I want to be more encouraging',
  'I want to be more forgiving toward myself',
  'I want to trust myself more',
] as const;
export type InnerVoiceChangeOption = typeof VALID_INNER_VOICE_CHANGE_OPTIONS[number];

export const VALID_CURRENT_SELF_TALK_OPTIONS = [
  'Critical',
  'Doubtful',
  'Confused',
  'Neutral',
  'Encouraging',
  'Empowering',
] as const;
export type CurrentSelfTalkOption = typeof VALID_CURRENT_SELF_TALK_OPTIONS[number];

export const VALID_AFFIRMATION_TONES = [
  'Gentle & supportive',
  'Motivational & bold',
  'Calm & meditative',
  'Spiritual',
  'Neutral',
] as const;
export type AffirmationTone = typeof VALID_AFFIRMATION_TONES[number];

// Main onboarding response interface
export interface OnboardingResponse {
  id?: string;
  user_id: string;
  
  // Question 1: Name
  name: string;
  
  // Question 2: Age
  age: number;
  
  // Question 3: Gender
  gender: Gender;
  
  // Question 4: Motivation (Multiple choice)
  motivation: MotivationOption[];
  
  // Question 5: Struggling Emotions (Multiple choice)
  struggling_emotions: StrugglingEmotion[];
  
  // Question 6: Self Relationship (Multiple choice)
  self_relationship: SelfRelationshipOption[];
  
  // Question 7: Self Talk in Difficult Moments (Single choice)
  self_talk_difficult: SelfTalkDifficultOption;
  
  // Question 8: Inner Voice Change (Multiple choice)
  inner_voice_change: InnerVoiceChangeOption[];
  
  // Question 9: Current Self Talk (Multiple choice)
  current_self_talk: CurrentSelfTalkOption[];
  
  // Question 10: Affirmation Tone (Single choice)
  affirmation_tone: AffirmationTone;
  
  // Question 11: Wake/Sleep Time (JSON object)
  wake_sleep_time: WakeSleepTime;
  
  // Question 13: Limiting Belief (Text input)
  limiting_belief: string;
  
  // Metadata
  onboarding_completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Validation functions
export const validateOnboardingResponse = (data: Partial<OnboardingResponse>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate name
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else if (data.name.trim().length < 1 || data.name.trim().length > 255) {
    errors.push('Name must be between 1 and 255 characters');
  }

  // Validate age
  if (!data.age || typeof data.age !== 'number') {
    errors.push('Age is required and must be a number');
  } else if (data.age < 18 || data.age > 100) {
    errors.push('Age must be between 18 and 100');
  }

  // Validate gender
  if (!data.gender || !VALID_GENDERS.includes(data.gender as Gender)) {
    errors.push('Gender must be either "Woman" or "Man"');
  }

  // Validate motivation array
  if (!data.motivation || !Array.isArray(data.motivation) || data.motivation.length < 1) {
    errors.push('Motivation must be an array with at least one selection');
  } else {
    const invalidMotivations = data.motivation.filter(m => !VALID_MOTIVATION_OPTIONS.includes(m as MotivationOption));
    if (invalidMotivations.length > 0) {
      errors.push('Invalid motivation options selected');
    }
  }

  // Validate struggling emotions array
  if (!data.struggling_emotions || !Array.isArray(data.struggling_emotions) || data.struggling_emotions.length < 1) {
    errors.push('Struggling emotions must be an array with at least one selection');
  } else {
    const invalidEmotions = data.struggling_emotions.filter(e => !VALID_STRUGGLING_EMOTIONS.includes(e as StrugglingEmotion));
    if (invalidEmotions.length > 0) {
      errors.push('Invalid struggling emotions selected');
    }
  }

  // Validate self relationship array
  if (!data.self_relationship || !Array.isArray(data.self_relationship) || data.self_relationship.length < 1) {
    errors.push('Self relationship must be an array with at least one selection');
  } else {
    const invalidRelationships = data.self_relationship.filter(r => !VALID_SELF_RELATIONSHIP_OPTIONS.includes(r as SelfRelationshipOption));
    if (invalidRelationships.length > 0) {
      errors.push('Invalid self relationship options selected');
    }
  }

  // Validate self talk difficult
  if (!data.self_talk_difficult || !VALID_SELF_TALK_DIFFICULT_OPTIONS.includes(data.self_talk_difficult as SelfTalkDifficultOption)) {
    errors.push('Invalid self talk difficult option');
  }

  // Validate inner voice change array
  if (!data.inner_voice_change || !Array.isArray(data.inner_voice_change) || data.inner_voice_change.length < 1) {
    errors.push('Inner voice change must be an array with at least one selection');
  } else {
    const invalidVoiceChanges = data.inner_voice_change.filter(v => !VALID_INNER_VOICE_CHANGE_OPTIONS.includes(v as InnerVoiceChangeOption));
    if (invalidVoiceChanges.length > 0) {
      errors.push('Invalid inner voice change options selected');
    }
  }

  // Validate current self talk array
  if (!data.current_self_talk || !Array.isArray(data.current_self_talk) || data.current_self_talk.length < 1) {
    errors.push('Current self talk must be an array with at least one selection');
  } else {
    const invalidSelfTalks = data.current_self_talk.filter(s => !VALID_CURRENT_SELF_TALK_OPTIONS.includes(s as CurrentSelfTalkOption));
    if (invalidSelfTalks.length > 0) {
      errors.push('Invalid current self talk options selected');
    }
  }

  // Validate affirmation tone
  if (!data.affirmation_tone || !VALID_AFFIRMATION_TONES.includes(data.affirmation_tone as AffirmationTone)) {
    errors.push('Invalid affirmation tone');
  }

  // Validate wake sleep time
  if (!data.wake_sleep_time || typeof data.wake_sleep_time !== 'object') {
    errors.push('Wake sleep time is required');
  } else {
    const { wakeUp, bedtime } = data.wake_sleep_time;
    if (!wakeUp || !bedtime) {
      errors.push('Wake sleep time must have both wakeUp and bedtime');
    } else {
      if (typeof wakeUp.hour !== 'number' || wakeUp.hour < 0 || wakeUp.hour > 23) {
        errors.push('Wake up hour must be between 0 and 23');
      }
      if (typeof wakeUp.minute !== 'number' || wakeUp.minute < 0 || wakeUp.minute > 59) {
        errors.push('Wake up minute must be between 0 and 59');
      }
      if (typeof bedtime.hour !== 'number' || bedtime.hour < 0 || bedtime.hour > 23) {
        errors.push('Bedtime hour must be between 0 and 23');
      }
      if (typeof bedtime.minute !== 'number' || bedtime.minute < 0 || bedtime.minute > 59) {
        errors.push('Bedtime minute must be between 0 and 59');
      }
    }
  }

  // Validate limiting belief
  if (!data.limiting_belief || typeof data.limiting_belief !== 'string') {
    errors.push('Limiting belief is required and must be a string');
  } else if (data.limiting_belief.trim().length < 1 || data.limiting_belief.trim().length > 1000) {
    errors.push('Limiting belief must be between 1 and 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitization functions
export const sanitizeOnboardingResponse = (data: Partial<OnboardingResponse>): Partial<OnboardingResponse> => {
  const sanitized = { ...data };

  // Sanitize name
  if (sanitized.name && typeof sanitized.name === 'string') {
    sanitized.name = sanitized.name.trim().replace(/\s+/g, ' ');
  }

  // Sanitize limiting belief
  if (sanitized.limiting_belief && typeof sanitized.limiting_belief === 'string') {
    sanitized.limiting_belief = sanitized.limiting_belief.trim().replace(/\s+/g, ' ');
  }

  // Sanitize arrays (remove duplicates and empty values)
  if (sanitized.motivation && Array.isArray(sanitized.motivation)) {
    sanitized.motivation = [...new Set(sanitized.motivation.filter(m => m && m.trim()))];
  }

  if (sanitized.struggling_emotions && Array.isArray(sanitized.struggling_emotions)) {
    sanitized.struggling_emotions = [...new Set(sanitized.struggling_emotions.filter(e => e && e.trim()))];
  }

  if (sanitized.self_relationship && Array.isArray(sanitized.self_relationship)) {
    sanitized.self_relationship = [...new Set(sanitized.self_relationship.filter(r => r && r.trim()))];
  }

  if (sanitized.inner_voice_change && Array.isArray(sanitized.inner_voice_change)) {
    sanitized.inner_voice_change = [...new Set(sanitized.inner_voice_change.filter(v => v && v.trim()))];
  }

  if (sanitized.current_self_talk && Array.isArray(sanitized.current_self_talk)) {
    sanitized.current_self_talk = [...new Set(sanitized.current_self_talk.filter(s => s && s.trim()))];
  }

  return sanitized;
};

// Helper function to format time for display
export const formatTimeForDisplay = (time: { hour: number; minute: number }): string => {
  const period = time.hour >= 12 ? 'PM' : 'AM';
  const displayHour = time.hour === 0 ? 12 : time.hour > 12 ? time.hour - 12 : time.hour;
  return `${displayHour}:${time.minute.toString().padStart(2, '0')} ${period}`;
};

// Helper function to parse time from string
export const parseTimeFromString = (timeString: string): { hour: number; minute: number } | null => {
  const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return { hour, minute };
}; 