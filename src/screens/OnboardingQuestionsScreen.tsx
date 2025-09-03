import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  FadeInUp,
  FadeInDown,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Question {
  id: string;
  type: 'choice' | 'text' | 'scale';
  title: string;
  subtitle: string;
  options?: string[];
  placeholder?: string;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
}

const questions: Question[] = [
  {
    id: 'name',
    type: 'text',
    title: "What's your first name?",
    subtitle: "We'll use this to personalize your experience",
    placeholder: "First name",
  },
  {
    id: 'wellness_goal',
    type: 'choice',
    title: "What's your main wellness goal?",
    subtitle: "Choose what you'd like to focus on most",
    options: [
      "Build confidence",
      "Reduce stress & anxiety", 
      "Improve focus & clarity",
      "Build mental resilience",
      "Create positive habits",
      "Find inner peace"
    ]
  },
  {
    id: 'current_mood',
    type: 'scale',
    title: "How would you rate your current well-being?",
    subtitle: "This helps us understand where you're starting from",
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: ["Need support", "Feeling great"],
  }
];

interface OnboardingQuestionsScreenProps {
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
}

export default function OnboardingQuestionsScreen({ onComplete, onBack }: OnboardingQuestionsScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentAnswer, setCurrentAnswer] = useState<any>('');

  const contentOpacity = useSharedValue(1);
  const contentTranslateY = useSharedValue(0);

  useEffect(() => {
    // Reset current answer when step changes
    const prevQuestion = questions[currentStep - 1];
    if (prevQuestion && answers[prevQuestion.id]) {
      setCurrentAnswer(answers[prevQuestion.id]);
    } else {
      setCurrentAnswer('');
    }
  }, [currentStep]);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = currentAnswer !== '' && currentAnswer !== null;
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    // Animate out
    contentOpacity.value = withTiming(0, { duration: 300 });
    contentTranslateY.value = withTiming(-20, { duration: 300 });

    // Save current answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: currentAnswer
    }));

    setTimeout(() => {
      if (isLastStep) {
        // Complete onboarding
        const finalAnswers = {
          ...answers,
          [currentQuestion.id]: currentAnswer
        };
        onComplete(finalAnswers);
      } else {
        // Move to next question
        setCurrentStep(prev => prev + 1);
        setCurrentAnswer('');
        
        // Animate in
        contentOpacity.value = withTiming(1, { duration: 400 });
        contentTranslateY.value = withTiming(0, { duration: 400 });
      }
    }, 350);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      contentOpacity.value = withTiming(0, { duration: 300 });
      contentTranslateY.value = withTiming(20, { duration: 300 });
      
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        const prevQuestion = questions[currentStep - 1];
        setCurrentAnswer(answers[prevQuestion.id] || '');
        
        // Animate in
        contentOpacity.value = withTiming(1, { duration: 400 });
        contentTranslateY.value = withTiming(0, { duration: 400 });
      }, 350);
    } else {
      onBack();
    }
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const renderChoiceOptions = () => (
    <View style={styles.optionsContainer}>
      {currentQuestion.options?.map((option, index) => (
        <Pressable
          key={option}
          style={[
            styles.optionButton,
            currentAnswer === option && styles.optionButtonSelected
          ]}
          onPress={() => setCurrentAnswer(option)}
        >
          <Text style={[
            styles.optionText,
            currentAnswer === option && styles.optionTextSelected
          ]}>
            {option}
          </Text>
          {currentAnswer === option && (
                            <Feather name="check" size={20} color="#a78bfa" />
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderTextInput = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        placeholder={currentQuestion.placeholder}
        placeholderTextColor="#B0B0B0"
        value={currentAnswer}
        onChangeText={setCurrentAnswer}
        autoFocus
      />
    </View>
  );

  const renderScale = () => (
    <View style={styles.scaleContainer}>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>{currentQuestion.scaleLabels?.[0]}</Text>
        <Text style={styles.scaleLabel}>{currentQuestion.scaleLabels?.[1]}</Text>
      </View>
      <View style={styles.scaleGrid}>
        {Array.from({ length: currentQuestion.scaleMax! }, (_, i) => i + 1).map((value) => (
          <Pressable
            key={value}
            style={[
              styles.scaleButton,
              currentAnswer === value && styles.scaleButtonSelected
            ]}
            onPress={() => setCurrentAnswer(value)}
          >
            <Text style={[
              styles.scaleButtonText,
              currentAnswer === value && styles.scaleButtonTextSelected
            ]}>
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Feather name="arrow-left" size={24} color="#222222" />
        </Pressable>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
          <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
        </View>

        <View style={styles.answerSection}>
          {currentQuestion.type === 'choice' && renderChoiceOptions()}
          {currentQuestion.type === 'text' && renderTextInput()}
          {currentQuestion.type === 'scale' && renderScale()}
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        {canProceed && (
          <Pressable style={styles.continueButton} onPress={handleNext}>
            <Text style={styles.continueButtonText}>
              {isLastStep ? "Get started" : "Continue"}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#a78bfa',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  questionContainer: {
    marginBottom: 48,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#222222',
    lineHeight: 36,
    marginBottom: 12,
  },
  questionSubtitle: {
    fontSize: 16,
    color: '#717171',
    lineHeight: 22,
    fontWeight: '400',
  },
  answerSection: {
    flex: 1,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#a78bfa',
    backgroundColor: '#f6f3ff',
  },
  optionText: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '400',
    flex: 1,
  },
  optionTextSelected: {
    color: '#a78bfa',
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#222222',
    backgroundColor: '#FFFFFF',
  },
  scaleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  scaleLabel: {
    fontSize: 14,
    color: '#717171',
    fontWeight: '500',
  },
  scaleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    maxWidth: 300,
  },
  scaleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scaleButtonSelected: {
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  scaleButtonTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: '#a78bfa',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 