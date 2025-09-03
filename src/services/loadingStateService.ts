import { uiCache } from './cacheService';

export interface LoadingState {
  isBlocking: boolean; // Should show blurred overlay
  isPartial: boolean;  // Should show skeleton loader
  message: string;
  progress?: number;
}

export interface LoadingContext {
  screen: string;
  action: string;
  dataType: string;
  isFirstTime: boolean;
  hasCachedData: boolean;
  isCritical: boolean;
}

class LoadingStateService {
  private loadingStates = new Map<string, LoadingState>();

  // Determine if loading should be blocking (show blur) or non-blocking
  shouldShowBlockingLoader(context: LoadingContext): boolean {
    const { screen, action, dataType, isFirstTime, hasCachedData, isCritical } = context;

    // Special cases where blocking loader is appropriate
    const blockingCases = [
      // First-time user experiences
      { condition: isFirstTime && !hasCachedData, reason: 'First-time data loading' },
      
      // Critical user actions
      { condition: action === 'generate_ai_content', reason: 'AI content generation' },
      { condition: action === 'generate_voice_clone', reason: 'Voice clone generation' },
      { condition: action === 'analyze_journal', reason: 'Journal analysis' },
      { condition: action === 'generate_audio', reason: 'Audio generation' },
      
      // Cache miss scenarios
      { condition: !hasCachedData && isCritical, reason: 'Critical data missing' },
      
      // App state transitions
      { condition: action === 'authentication_change', reason: 'Authentication state change' },
      { condition: action === 'subscription_change', reason: 'Subscription tier change' },
      
      // Error recovery
      { condition: action === 'error_recovery', reason: 'Error recovery mode' }
    ];

    return blockingCases.some(case_ => case_.condition);
  }

  // Determine if partial loading is appropriate
  shouldShowPartialLoader(context: LoadingContext): boolean {
    const { hasCachedData, isCritical } = context;
    
    // Show partial loader when we have some cached data but need to refresh
    return hasCachedData && !isCritical;
  }

  // Get appropriate loading state for context
  getLoadingState(context: LoadingContext): LoadingState {
    const shouldBlock = this.shouldShowBlockingLoader(context);
    const shouldPartial = this.shouldShowPartialLoader(context);

    if (shouldBlock) {
      return {
        isBlocking: true,
        isPartial: false,
        message: this.getBlockingMessage(context)
      };
    }

    if (shouldPartial) {
      return {
        isBlocking: false,
        isPartial: true,
        message: this.getPartialMessage(context)
      };
    }

    return {
      isBlocking: false,
      isPartial: false,
      message: ''
    };
  }

  private getBlockingMessage(context: LoadingContext): string {
    const { action, dataType } = context;
    
    const messages = {
      'generate_ai_content': 'Generating your personalized content...',
      'generate_voice_clone': 'Creating your voice clone...',
      'analyze_journal': 'Analyzing your reflections...',
      'generate_audio': 'Generating audio in your voice...',
      'authentication_change': 'Setting up your account...',
      'subscription_change': 'Updating your subscription...',
      'error_recovery': 'Recovering your data...',
      'first_time_setup': 'Setting up your personalized experience...'
    };

    return messages[action as keyof typeof messages] || 'Loading...';
  }

  private getPartialMessage(context: LoadingContext): string {
    const { dataType } = context;
    
    const messages = {
      'user_data': 'Updating your profile...',
      'session_data': 'Refreshing your progress...',
      'ai_content': 'Updating your content...',
      'audio_cache': 'Loading audio...'
    };

    return messages[dataType as keyof typeof messages] || 'Loading...';
  }

  // Check if data is critical for screen functionality
  isDataCritical(screen: string, dataType: string): boolean {
    const criticalDataMap = {
      'HomeScreen': ['user_name', 'ai_content', 'session_data'],
      'AffirmationScreen': ['affirmations', 'voice_id'],
      'BeliefScreen': ['beliefs', 'ai_content'],
      'DreamscapeScreen': ['stories'],
      'HabitTrackerScreen': ['habits', 'session_data']
    };

    const criticalData = criticalDataMap[screen as keyof typeof criticalDataMap] || [];
    return criticalData.includes(dataType);
  }

  // Check if user is first-time for specific data type
  async isFirstTimeForDataType(userId: string, dataType: string): Promise<boolean> {
    try {
      const cacheKey = `first_time_${dataType}_${userId}`;
      const hasBeenLoaded = await uiCache.get('ui_state', { key: cacheKey });
      return !hasBeenLoaded;
    } catch (error) {
      return true; // Assume first time if we can't determine
    }
  }

  // Mark data type as loaded for user
  async markDataTypeLoaded(userId: string, dataType: string): Promise<void> {
    try {
      const cacheKey = `first_time_${dataType}_${userId}`;
      await uiCache.set('ui_state', { key: cacheKey }, { loaded: true }, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      console.error('Error marking data type as loaded:', error);
    }
  }
}

export const loadingStateService = new LoadingStateService(); 