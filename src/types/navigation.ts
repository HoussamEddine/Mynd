// src/types/navigation.ts
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the possible mood values explicitly
export type Mood = 'Happy' | 'Sad' | 'Neutral';

// Define the parameters expected by each screen in the Root Stack
export type RootStackParamList = {
  // Main app screens
  MainApp: { selectedAffirmation?: string; beliefId?: string } | undefined;
  
  // Welcome and onboarding flow
  Welcome: undefined;
  OnboardingSteps: undefined;
  OnboardingIntro: undefined;
  OnboardingQuestionnaire: undefined;
  CoreBeliefInput: undefined;
  
  // Authentication screens
  SignIn: undefined;
  Signup: undefined;
  EmailSignup: undefined;
  EmailConfirmation: { email: string; source: 'signup' | 'signin' };
  
  // Core app screens
  BeliefInput: undefined;
  Beliefs: undefined;
  SessionPlayer: undefined;
  
  // Voice cloning
  VoiceCloneIntro: undefined;
  VoiceClone: undefined;
  VoicePreview: {
    recordingUri?: string;
    passageText: string;
  };
  
  // Other screens
  AILoadingScreen: undefined;
  BreathingOnboardingScreen: undefined;
  BreathingScreen: undefined;
  SubscriptionScreen: undefined;
  Stats: undefined;
  CelebrationScreen: undefined;
  
  // Legacy screens (keeping for compatibility)
  MoodLog: undefined;
  RelaxScreen: undefined;
  AffirmationSelection: { beliefId: string };
  AddStory: undefined;
  HomeTab: undefined;
  ProfileTab: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Splash: undefined;
  HomeActual: undefined;
  Discover: undefined;
  Settings: undefined;
  MoodDetailScreen?: { mood: Mood };
  AffirmationScreen: { selectedAffirmation: string; beliefId: string };
  MeditationPlayer: { affirmationText?: string };
};

// Define the parameters expected by each screen in the Bottom Tab Navigator
export type BottomTabParamList = {
  HomeTab: undefined;
  AiJournalTab: undefined; // Renamed from ExploreTab
  AddTab: undefined;
  CalendarTab: undefined;
  ProfileTab: undefined;
  // Remove or comment out the names from BottomNavigation.tsx if it's unused
  // HomeActual: undefined;
  // Stats: undefined;
  // Discover: undefined;
  // Settings: undefined;
};

// Optional Helper Type: Defines the specific navigation prop structure for the Home screen
// This provides type safety when using useNavigation<HomeScreenNavigationProp>() in HomeScreen
// Removed commented/unused HomeScreenNavigationProp

// Optional Helper Type: Defines the specific navigation prop structure for the MoodDetail screen
// Removed commented/unused MoodDetailScreenNavigationProp

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>; 