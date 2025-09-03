import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingIntroScreen from './OnboardingIntroScreen';
import OnboardingDetailedQuestionsScreen from './OnboardingDetailedQuestionsScreen';

interface OnboardingQuestionsFlowProps {
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
}

export default function OnboardingQuestionsFlow({ onComplete, onBack }: OnboardingQuestionsFlowProps) {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  // Persist questionnaire state
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleStartQuestionnaire = () => {
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireBack = () => {
    setShowQuestionnaire(false);
    // Don't reset state - keep progress
  };

  const handleQuestionnaireComplete = (answers: Record<string, any>) => {
    // Reset state on completion
    setQuestionnaireAnswers({});
    setCurrentQuestionIndex(0);
    onComplete(answers);
  };

  const handleQuestionnaireStateUpdate = (answers: Record<string, any>, currentIndex: number) => {
    setQuestionnaireAnswers(answers);
    setCurrentQuestionIndex(currentIndex);
  };

  return (
    <View style={styles.container}>
      {/* Intro Screen - Always visible as background */}
      <OnboardingIntroScreen onStartQuestionnaire={handleStartQuestionnaire} />
      
      {/* Questionnaire Modal - Overlay when showQuestionnaire is true */}
      {showQuestionnaire && (
        <OnboardingDetailedQuestionsScreen
          onComplete={handleQuestionnaireComplete}
          onBack={handleQuestionnaireBack}
          onStateUpdate={handleQuestionnaireStateUpdate}
          initialAnswers={questionnaireAnswers}
          initialQuestionIndex={currentQuestionIndex}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 