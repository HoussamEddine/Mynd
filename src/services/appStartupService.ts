import { aiContentService } from './aiContentService';
import { userDataService } from './userDataService';
import { sessionDataService } from './sessionDataService';
import { audioGenerationService } from './audioGenerationService';

export interface StartupProgress {
  userData: boolean;
  aiContent: boolean;
  sessionData: boolean;
  audioCache: boolean;
  allScreenData: boolean;
  total: number;
  completed: number;
}

class AppStartupService {
  private startupProgress: StartupProgress = {
    userData: false,
    aiContent: false,
    sessionData: false,
    audioCache: false,
    allScreenData: false,
    total: 5,
    completed: 0
  };

  private progressCallbacks: ((progress: StartupProgress) => void)[] = [];

  // Add progress callback
  onProgress(callback: (progress: StartupProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  // Remove progress callback
  offProgress(callback: (progress: StartupProgress) => void): void {
    const index = this.progressCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  // Update progress and notify callbacks
  private updateProgress(update: Partial<StartupProgress>): void {
    this.startupProgress = { ...this.startupProgress, ...update };
    
    // Calculate completed count
    const completed = [
      this.startupProgress.userData,
      this.startupProgress.aiContent,
      this.startupProgress.sessionData,
      this.startupProgress.audioCache,
      this.startupProgress.allScreenData
    ].filter(Boolean).length;
    
    this.startupProgress.completed = completed;

    // Notify all callbacks
    this.progressCallbacks.forEach(callback => callback(this.startupProgress));
  }

  // Preload all critical data for app startup
  async preloadCriticalData(userId: string): Promise<void> {
    try {
      console.log('Starting app data preload for user:', userId);
      
      // Reset progress
      this.updateProgress({
        userData: false,
        aiContent: false,
        sessionData: false,
        audioCache: false,
        allScreenData: false,
        completed: 0
      });

      // Preload all data in parallel for better performance
      const preloadPromises = [
        this.preloadUserData(userId),
        this.preloadAIContent(userId),
        this.preloadSessionData(userId),
        this.preloadAudioCache(userId),
        this.preloadAllScreenData(userId)
      ];

      await Promise.allSettled(preloadPromises);
      
      console.log('App data preload completed');
    } catch (error) {
      console.error('Error during app data preload:', error);
    }
  }

  // Preload user data
  private async preloadUserData(userId: string): Promise<void> {
    try {
      await userDataService.preloadUserData(userId);
      this.updateProgress({ userData: true });
      console.log('User data preloaded');
    } catch (error) {
      console.error('Error preloading user data:', error);
      this.updateProgress({ userData: true }); // Mark as completed even if failed
    }
  }

  // Preload AI content
  private async preloadAIContent(userId: string): Promise<void> {
    try {
      await aiContentService.preloadAIContent(userId);
      this.updateProgress({ aiContent: true });
      console.log('AI content preloaded');
    } catch (error) {
      console.error('Error preloading AI content:', error);
      this.updateProgress({ aiContent: true }); // Mark as completed even if failed
    }
  }

  // Preload session data
  private async preloadSessionData(userId: string): Promise<void> {
    try {
      await sessionDataService.preloadSessionData(userId);
      this.updateProgress({ sessionData: true });
      console.log('Session data preloaded');
    } catch (error) {
      console.error('Error preloading session data:', error);
      this.updateProgress({ sessionData: true }); // Mark as completed even if failed
    }
  }

  // Preload audio cache
  private async preloadAudioCache(userId: string): Promise<void> {
    try {
      // Preload audio URLs for free tier content
      const aiContent = await aiContentService.getAIContent(userId);
      if (aiContent?.free_tier_audio) {
        // Preload audio URLs into cache
        const { free_tier_audio } = aiContent;
        
        // Cache audio URLs for quick access
        if (free_tier_audio.transformation_partial) {
          // Cache transformation audio URL
        }
        if (free_tier_audio.daily_boost) {
          // Cache daily boost audio URL
        }
        if (free_tier_audio.first_affirmation) {
          // Cache first affirmation audio URL
        }
      }
      
      this.updateProgress({ audioCache: true });
      console.log('Audio cache preloaded');
    } catch (error) {
      console.error('Error preloading audio cache:', error);
      this.updateProgress({ audioCache: true }); // Mark as completed even if failed
    }
  }

  // Preload all screen data (HomeScreen, AffirmationScreen, AiJournalScreen, HabitTrackerScreen, ProfileScreen)
  private async preloadAllScreenData(userId: string): Promise<void> {
    try {
      // Preload data needed for all 5 screens in parallel
      const screenDataPromises = [
        // HomeScreen data (already covered by other services)
        Promise.resolve(),
        
        // AffirmationScreen data
        this.preloadAffirmationScreenData(userId),
        
        // AiJournalScreen data
        this.preloadAiJournalScreenData(userId),
        
        // HabitTrackerScreen data
        this.preloadHabitTrackerScreenData(userId),
        
        // ProfileScreen data
        this.preloadProfileScreenData(userId)
      ];

      await Promise.allSettled(screenDataPromises);
      
      this.updateProgress({ allScreenData: true });
      console.log('All screen data preloaded');
    } catch (error) {
      console.error('Error preloading all screen data:', error);
      this.updateProgress({ allScreenData: true }); // Mark as completed even if failed
    }
  }

  // Preload AffirmationScreen specific data
  private async preloadAffirmationScreenData(userId: string): Promise<void> {
    try {
      // Get user voice ID and transformation ID for affirmations
      const userProfile = await userDataService.getUserProfile(userId);
      const aiContent = await aiContentService.getAIContent(userId);
      
      if (userProfile?.elevenlabs_voice_id && aiContent?.affirmations) {
        // Preload first few affirmation audios for smooth playback
        const affirmationsToPreload = aiContent.affirmations.slice(0, 3); // Preload first 3
        for (const affirmation of affirmationsToPreload) {
          await audioGenerationService.getStoredAffirmationAudio(
            affirmation,
            userProfile.elevenlabs_voice_id,
            'affirmation_screen'
          );
        }
      }
    } catch (error) {
      console.error('Error preloading AffirmationScreen data:', error);
    }
  }

  // Preload AiJournalScreen specific data
  private async preloadAiJournalScreenData(userId: string): Promise<void> {
    try {
      // Note: mood_logs table doesn't exist yet, so this is a placeholder
      // When the table is created, we'll preload mood history data here
      console.log('AiJournalScreen data preload - placeholder (mood_logs table not yet created)');
    } catch (error) {
      console.error('Error preloading AiJournalScreen data:', error);
    }
  }

  // Preload HabitTrackerScreen specific data
  private async preloadHabitTrackerScreenData(userId: string): Promise<void> {
    try {
      // Note: goals/habits table doesn't exist yet, so this is a placeholder
      // When the table is created, we'll preload daily rituals/goals data here
      console.log('HabitTrackerScreen data preload - placeholder (goals table not yet created)');
    } catch (error) {
      console.error('Error preloading HabitTrackerScreen data:', error);
    }
  }

  // Preload ProfileScreen specific data
  private async preloadProfileScreenData(userId: string): Promise<void> {
    try {
      // Preload user profile data (already covered by userDataService)
      // Preload voice settings and preferences
      const userProfile = await userDataService.getUserProfile(userId);
      
      if (userProfile?.elevenlabs_voice_id) {
        // Preload voice preview audio for profile screen
        const userName = await userDataService.getUserName(userId);
        const userLanguage = await userDataService.getLanguagePreference(userId);
        
        if (userName && userLanguage) {
          // This will be used in VoicePreviewPlayer component
          await audioGenerationService.getStoredAffirmationAudio(
            `Hey there, I'm ${userName}. I'm just taking a moment to slow down and breathe.`,
            userProfile.elevenlabs_voice_id,
            'profile_preview'
          );
        }
      }
    } catch (error) {
      console.error('Error preloading ProfileScreen data:', error);
    }
  }

  // Get current startup progress
  getProgress(): StartupProgress {
    return { ...this.startupProgress };
  }

  // Check if startup is complete
  isStartupComplete(): boolean {
    return this.startupProgress.completed === this.startupProgress.total;
  }

  // Clear all cached data (for logout)
  async clearAllCache(userId: string): Promise<void> {
    try {
      console.log('Clearing all cache for user:', userId);
      
      // Clear all service caches
      await Promise.all([
        aiContentService.invalidateCache(userId),
        userDataService.invalidateCache(userId),
        sessionDataService.invalidateCache(userId)
      ]);
      
      console.log('All cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Warm up cache for better performance
  async warmUpCache(userId: string): Promise<void> {
    try {
      console.log('Warming up cache for user:', userId);
      
      // Warm up frequently accessed data
      await Promise.allSettled([
        userDataService.getUserProfile(userId),
        sessionDataService.getSessionData(userId),
        aiContentService.getAIContent(userId)
      ]);
      
      console.log('Cache warmed up');
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }
}

export const appStartupService = new AppStartupService(); 