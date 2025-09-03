import React, { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingQuestionsFlow from './OnboardingQuestionsFlow';
import VoiceCloneIntroScreen from './VoiceCloneIntroScreen';
import VoiceCloneScreen from './VoiceCloneScreen';
import { ONBOARDING_ANSWERS_KEY, VOICE_CLONE_STATUS_KEY } from '../constants';

type OnboardingStep = 'questions' | 'voiceCloneIntro' | 'voiceCloning';

interface OnboardingFlowProps {
  onOnboardingComplete: () => void;
}

export default function OnboardingFlow({ onOnboardingComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);

  useEffect(() => {
    const determineInitialStep = async () => {
      try {
        // --- Migration from old storage keys ---
        const OLD_ANSWERS_KEY = '@onboarding_answers';
        const oldAnswersData = await AsyncStorage.getItem(OLD_ANSWERS_KEY);
        if (oldAnswersData) {
          await AsyncStorage.setItem(ONBOARDING_ANSWERS_KEY, 'true');
          await AsyncStorage.removeItem(OLD_ANSWERS_KEY);
        }
        // --- End Migration ---

        const answersDone = await AsyncStorage.getItem(ONBOARDING_ANSWERS_KEY);
        if (answersDone !== 'true') {
          setCurrentStep('questions');
          return;
        }

        const voiceDone = await AsyncStorage.getItem(VOICE_CLONE_STATUS_KEY);
        if (voiceDone !== 'completed') {
          setCurrentStep('voiceCloneIntro');
          return;
        }
        
        onOnboardingComplete();

      } catch (error) {
        console.error("Failed to determine onboarding step", error);
        setCurrentStep('questions');
      }
    };
    determineInitialStep();
  }, [onOnboardingComplete]);

  const handleQuestionsComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_ANSWERS_KEY, 'true');
    setCurrentStep('voiceCloneIntro');
  };

  const handleVoiceCloneIntroContinue = () => {
    setCurrentStep('voiceCloning');
  };

  const handleVoiceCloningComplete = async () => {
    await AsyncStorage.setItem(VOICE_CLONE_STATUS_KEY, 'completed');
    onOnboardingComplete();
  };

  switch (currentStep) {
    case 'questions':
      return (
        <OnboardingQuestionsFlow
          onComplete={handleQuestionsComplete}
          onBack={() => {}}
        />
      );
    case 'voiceCloneIntro':
      return (
        <VoiceCloneIntroScreen
          onContinue={handleVoiceCloneIntroContinue}
          onBack={() => setCurrentStep('questions')}
        />
      );
    case 'voiceCloning':
      return (
        <VoiceCloneScreen
          onComplete={handleVoiceCloningComplete}
          onBack={() => setCurrentStep('voiceCloneIntro')}
        />
      );
    default:
      return null;
  }
} 