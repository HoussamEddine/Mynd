export type AppState = 'welcome' | 'onboarding' | 'core_belief_input' | 'voice_clone' | 'authenticated';
export type OnboardingStep = 'intro' | 'questionnaire' | 'core_belief' | 'voice_clone' | 'complete';

class AppStateService {
  async determineInitialState(): Promise<AppState> {
    // Simple logic for now
    return 'welcome';
  }

  async getOnboardingStep(): Promise<OnboardingStep> {
    return 'intro';
  }

  async markStepCompleted(step: OnboardingStep): Promise<void> {
    // Placeholder
  }

  async markWelcomeCompleted(): Promise<void> {
    // Placeholder
  }

  async markAuthCompleted(): Promise<void> {
    // Placeholder
  }

  async markSignupCompleted(): Promise<void> {
    // Placeholder
  }
}

export const appStateService = new AppStateService(); // App state service instance
