import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInUp,
  FadeInDown,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  withDelay,
  runOnJS,
  interpolate,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import RoulettePicker from '../components/RoulettePicker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Text } from '../components/base/Text';
import { theme, ScreenWrapper } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import SoundWaveSpinner from '../components/SoundWaveSpinner';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const minModalHeight = screenHeight * 0.5;
const maxModalHeight = screenHeight * 0.7;
const { foundations, components, utils } = theme;

// Pre-compute roulette items to prevent recreation on every render
const AGE_ITEMS = Array.from({ length: 83 }, (_, i) => i + 18); // 18 to 100
const LANGUAGE_ITEMS = [
  "English",
  "German",
  "Spanish",
  "French"
];

interface Question {
  id: string;
  type: 'text' | 'roulette' | 'choice' | 'multiple' | 'belief' | 'text_long';
  title: string;
  subtitle: string;
  options?: string[];
  placeholder?: string;
  hasOther?: boolean;
  rouletteItems?: (string | number)[];
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
    id: 'age',
    type: 'roulette',
    title: "How old are you?",
    subtitle: "This helps us tailor content appropriately",
    rouletteItems: AGE_ITEMS,
  },
  {
    id: 'gender',
    type: 'choice',
    title: "How do you identify?",
    subtitle: "We use this to personalize your affirmations",
    options: ["Woman", "Man", "Other"],
  },
  {
    id: 'language',
    type: 'choice',
    title: "What's your preferred language?",
    subtitle: "We'll deliver content in your language",
    options: LANGUAGE_ITEMS,
  },
  {
    id: 'motivation',
    type: 'multiple',
    title: "What motivated you to try this app?",
    subtitle: "Choose all that apply",
    options: [
      "I want to change negative self-beliefs",
      "I want to feel more confident", 
      "I'm going through a hard time",
      "I want to be more mindful daily",
      "I'm curious about affirmations and voice"
    ],
    hasOther: true,
  },
  {
    id: 'primary_goal',
    type: 'choice',
    title: "What is your primary goal?",
    subtitle: "Pick one",
    options: [
      "Reprogram my mindset",
      "Create better habits",
      "Process emotions and thoughts", 
      "Build self-worth",
      "Reduce stress or anxiety"
    ],
  },
  {
    id: 'self_talk_difficult',
    type: 'choice',
    title: "How do you usually speak to yourself in difficult moments?",
    subtitle: "Choose what feels most true to you",
    options: [
      "I judge myself",
      "I try to stay positive",
      "I shut down",
      "I don't really notice",
      "I'm not sure"
    ],
  },
  {
    id: 'current_self_talk',
    type: 'multiple',
    title: "How would you describe your current self-talk?",
    subtitle: "Choose all that apply",
    options: [
      "Critical",
      "Encouraging", 
      "Doubtful",
      "Confused",
      "Neutral",
      "Empowering"
    ],
  },
  {
    id: 'affirmation_time',
    type: 'choice',
    title: "When would you like to receive your daily affirmation?",
    subtitle: "We'll send you a gentle reminder",
    options: [
      "Morning",
      "Afternoon",
      "Evening", 
      "I'll decide manually"
    ],
  },
  {
    id: 'reflection_frequency',
    type: 'choice',
    title: "How often do you journal or self-reflect?",
    subtitle: "This helps us understand your current habits",
    options: [
      "Daily",
      "A few times a week",
      "Rarely",
      "Never"
    ],
  },
  {
    id: 'affirmation_tone',
    type: 'choice',
    title: "Which tone do you prefer for your affirmations?",
    subtitle: "We'll match your preferred style",
    options: [
      "Gentle & nurturing",
      "Bold & motivating",
      "Calm & neutral",
      "Depends on my mood"
    ],
  },
  {
    id: 'voice_connection',
    type: 'choice',
    title: "How would you describe your emotional connection to your voice?",
    subtitle: "Understanding this helps us personalize your experience",
    options: [
      "I like hearing myself",
      "I feel disconnected from it",
      "I'm self-conscious about it", 
      "I've never thought about it"
    ],
  },
  {
    id: 'first_belief',
    type: 'belief',
    title: "What's one limiting belief you'd like to work on?",
    subtitle: "This will be the first belief we help you transform. Be honest - this is just for you.",
    placeholder: "e.g., I'm not good enough, I can't succeed, I don't deserve happiness…",
  },
];

interface OnboardingDetailedQuestionsScreenProps {
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
  onStateUpdate?: (answers: Record<string, any>, currentIndex: number) => void;
  initialAnswers?: Record<string, any>;
  initialQuestionIndex?: number;
}

// Security and sanitization functions
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // Remove any potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 100); // Limit length
};

const sanitizeArray = (arr: string[]): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => sanitizeInput(String(item))).filter(Boolean);
};

// Enhanced validation functions
const validateName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return "Please enter your first name";
  }
  if (name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  if (name.trim().length > 50) {
    return "Name must be less than 50 characters";
  }
  if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes";
  }
  return null;
};

const validateAge = (age: number): string | null => {
  if (!age || age < 13) {
    return "You must be at least 13 years old to use this app";
  }
  if (age > 120) {
    return "Please enter a valid age";
  }
  return null;
};

const genericInputs = [
  'test', 'hello', 'asdf', 'qwerty', 'none', 'no', 'yes', 'ok', 'good', 'bad', 'fine', '123', 'abc', 'n/a', 'na', 'nothing', 'something', 'anything', 'everything', 'idk', 'i don\'t know', 'nope', 'yep', 'sure', 'maybe', 'whatever', 'blank', 'skip', 'pass', 'nil', 'null', 'empty', 'none', 'no belief', 'nope', 'no thanks', 'no thank you', 'no idea', 'no comment', 'no answer', 'no response', 'no input', 'no reply', 'no statement', 'no opinion', 'nope', 'no way', 'no reason', 'no clue', 'no thought', 'nope', 'no thanks', 'no thank you', 'no worries', 'no problem', 'no issue', 'no issues', 'no concerns', 'no concern', 'no worries', 'no stress', 'no pressure', 'no rush', 'no hurry', 'no need', 'no want', 'no desire', 'no wish', 'no hope', 'no dream', 'no goal', 'no plan', 'no purpose', 'no aim', 'no target', 'no objective', 'no intention', 'no ambition', 'no aspiration', 'no expectation', 'no anticipation', 'no prediction', 'no forecast', 'no guess', 'no estimate', 'no calculation', 'no computation', 'no evaluation', 'no assessment', 'no analysis', 'no review', 'no critique', 'no judgment', 'no verdict', 'no decision', 'no choice', 'no selection', 'no pick', 'no option', 'no alternative', 'no substitute', 'no replacement', 'no backup', 'no reserve', 'no spare', 'no extra', 'no addition', 'no supplement', 'no complement', 'no accessory', 'no adjunct', 'no appendage', 'no attachment', 'no add-on', 'no bonus', 'no perk', 'no benefit', 'no advantage', 'no gain', 'no profit', 'no reward', 'no return', 'no yield', 'no output', 'no result', 'no outcome', 'no consequence', 'no effect', 'no impact', 'no influence', 'no bearing', 'no relevance', 'no significance', 'no importance', 'no value', 'no worth', 'no merit', 'no credit', 'no recognition', 'no acknowledgment', 'no appreciation', 'no gratitude', 'no thanks', 'no thank you', 'no apology', 'no excuse', 'no explanation', 'no justification', 'no reason', 'no rationale', 'no logic', 'no sense', 'no meaning', 'no purpose', 'no use', 'no function', 'no role', 'no part', 'no share', 'no portion', 'no piece', 'no segment', 'no section', 'no division', 'no split', 'no break', 'no pause', 'no stop', 'no halt', 'no end', 'no finish', 'no completion', 'no conclusion', 'no closure', 'no resolution', 'no settlement', 'no agreement', 'no deal', 'no contract', 'no arrangement', 'no understanding', 'no consensus', 'no compromise', 'no negotiation', 'no discussion', 'no conversation', 'no talk', 'no chat', 'no dialogue', 'no communication', 'no contact', 'no connection', 'no link', 'no tie', 'no bond', 'no relationship', 'no association', 'no affiliation', 'no alliance', 'no partnership', 'no collaboration', 'no cooperation', 'no coordination', 'no teamwork', 'no support', 'no help', 'no assistance', 'no aid', 'no relief', 'no comfort', 'no consolation', 'no encouragement', 'no motivation', 'no inspiration', 'no stimulation', 'no excitement', 'no enthusiasm', 'no passion', 'no zeal', 'no fervor', 'no energy', 'no drive', 'no determination', 'no resolve', 'no persistence', 'no perseverance', 'no tenacity', 'no endurance', 'no patience', 'no tolerance', 'no acceptance', 'no approval', 'no consent', 'no permission', 'no authorization', 'no sanction', 'no license', 'no certification', 'no qualification', 'no eligibility', 'no suitability', 'no fitness', 'no competence', 'no ability', 'no capability', 'no capacity', 'no potential', 'no talent', 'no skill', 'no expertise', 'no proficiency', 'no mastery', 'no knowledge', 'no wisdom', 'no intelligence', 'no insight', 'no understanding', 'no comprehension', 'no awareness', 'no consciousness', 'no perception', 'no observation', 'no notice', 'no attention', 'no focus', 'no concentration', 'no interest', 'no curiosity', 'no wonder', 'no amazement', 'no surprise', 'no shock', 'no awe', 'no admiration', 'no respect', 'no regard', 'no esteem', 'no honor', 'no dignity', 'no pride', 'no self-esteem', 'no self-worth', 'no self-respect', 'no self-confidence', 'no self-assurance', 'no self-reliance', 'no self-sufficiency', 'no self-support', 'no self-help', 'no self-care', 'no self-love', 'no self-acceptance', 'no self-approval', 'no self-appreciation', 'no self-gratitude', 'no self-thanks', 'no self-apology', 'no self-excuse', 'no self-explanation', 'no self-justification', 'no self-reason', 'no self-rationale', 'no self-logic', 'no self-sense', 'no self-meaning', 'no self-purpose', 'no self-use', 'no self-function', 'no self-role', 'no self-part', 'no self-share', 'no self-portion', 'no self-piece', 'no self-segment', 'no self-section', 'no self-division', 'no self-split', 'no self-break', 'no self-pause', 'no self-stop', 'no self-halt', 'no self-end', 'no self-finish', 'no self-completion', 'no self-conclusion', 'no self-closure', 'no self-resolution', 'no self-settlement', 'no self-agreement', 'no self-deal', 'no self-contract', 'no self-arrangement', 'no self-understanding', 'no self-consensus', 'no self-compromise', 'no self-negotiation', 'no self-discussion', 'no self-conversation', 'no self-talk', 'no self-dialogue', 'no self-communication', 'no self-contact', 'no self-connection', 'no self-link', 'no self-tie', 'no self-bond', 'no self-relationship', 'no self-association', 'no self-affiliation', 'no self-alliance', 'no self-partnership', 'no self-collaboration', 'no self-cooperation', 'no self-coordination', 'no self-teamwork', 'no self-support', 'no self-help', 'no self-assistance', 'no self-aid', 'no self-relief', 'no self-comfort', 'no self-consolation', 'no self-encouragement', 'no self-motivation', 'no self-inspiration', 'no self-stimulation', 'no self-excitement', 'no self-enthusiasm', 'no self-passion', 'no self-zeal', 'no self-fervor', 'no self-energy', 'no self-drive', 'no self-determination', 'no self-resolve', 'no self-persistence', 'no self-perseverance', 'no self-tenacity', 'no self-endurance', 'no self-patience', 'no self-tolerance', 'no self-acceptance', 'no self-approval', 'no self-consent', 'no self-permission', 'no self-authorization', 'no self-sanction', 'no self-license', 'no self-certification', 'no self-qualification', 'no self-eligibility', 'no self-suitability', 'no self-fitness', 'no self-competence', 'no self-ability', 'no self-capability', 'no self-capacity', 'no self-potential', 'no self-talent', 'no self-skill', 'no self-expertise', 'no self-proficiency', 'no self-mastery', 'no self-knowledge', 'no self-wisdom', 'no self-intelligence', 'no self-insight', 'no self-understanding', 'no self-comprehension', 'no self-awareness', 'no self-consciousness', 'no self-perception', 'no self-observation', 'no self-notice', 'no self-attention', 'no self-focus', 'no self-concentration', 'no self-interest', 'no self-curiosity', 'no self-wonder', 'no self-amazement', 'no self-surprise', 'no self-shock', 'no self-awe', 'no self-admiration', 'no self-respect', 'no self-regard', 'no self-esteem', 'no self-honor', 'no self-dignity', 'no self-pride'];

const validateBelief = (belief: string): string | null => {
  if (!belief || belief.trim().length < 12) {
    return 'Please enter a limiting belief (at least 12 characters).';
  }
  const normalized = belief.trim().toLowerCase();
  if (genericInputs.includes(normalized)) {
    return 'Please describe a belief that sometimes holds you back, like \"I\'m not good enough\".';
  }
  return null;
};

const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `Please select an option for ${fieldName}`;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return `Please select at least one option for ${fieldName}`;
  }
  
  return null;
};

export default function OnboardingDetailedQuestionsScreen({ 
  onComplete, 
  onBack,
  onStateUpdate,
  initialAnswers = {},
  initialQuestionIndex = 0
}: OnboardingDetailedQuestionsScreenProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(initialQuestionIndex);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(true);
  
  // Scroll refs for reset functionality
  const mainScrollViewRef = React.useRef<ScrollView>(null);
  const choiceScrollViewRef = React.useRef<ScrollView>(null);
  const multipleScrollViewRef = React.useRef<ScrollView>(null);

  // Animation values
  const containerTranslateY = useSharedValue(minModalHeight);
  const contentOpacity = useSharedValue(1);
  const keyboardOffset = useSharedValue(0);
  const keyboardAnim = useSharedValue(0);

  // Track if popup is being dismissed
  const isDismissingRef = useRef(false);
  
  // Place these at the top level of the component, after state and before render functions
  const fadeOpacity = useSharedValue(0.6);
  const fadeAnimatedStyle = useAnimatedStyle(() => ({ opacity: fadeOpacity.value }));

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isLastStep = currentStep === questions.length - 1;

  // Place these after currentQuestion is defined
  const hasManyOptions = (currentQuestion.options?.length || 0) + (currentQuestion.hasOther ? 1 : 0) > 2;
  const [hasBounced, setHasBounced] = useState(false);

  // Add to the top of the component:
  const [choiceScroll, setChoiceScroll] = useState({ contentHeight: 1, visibleHeight: 1, scrollY: 0 });
  const [multipleScroll, setMultipleScroll] = useState({ contentHeight: 1, visibleHeight: 1, scrollY: 0 });

  // Add scroll state tracking at the top of the component:
  const [isChoiceScrolling, setIsChoiceScrolling] = useState(false);
  const [isMultipleScrolling, setIsMultipleScrolling] = useState(false);

  // Add question animation state at the top of the component:
  const [questionAnimating, setQuestionAnimating] = useState(false);

  // Add rate limiting for input changes
  const [lastInputTime, setLastInputTime] = useState(0);
  const INPUT_RATE_LIMIT = 50; // milliseconds

  // Add at the top of the component, after other useState hooks
  const [mainScroll, setMainScroll] = useState({ contentHeight: 1, visibleHeight: 1, scrollY: 0 });
  const [isMainScrolling, setIsMainScrolling] = useState(false);

  useEffect(() => {
    setHasBounced(false); // Reset bounce when question changes
  }, [currentStep]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (hasManyOptions && !hasBounced) {
      const ref = currentQuestion.type === 'multiple' ? multipleScrollViewRef : choiceScrollViewRef;
      if (ref.current) {
        ref.current.scrollTo({ y: 40, animated: true });
        timeoutId = setTimeout(() => {
          if (ref.current && typeof ref.current.scrollTo === 'function') {
            ref.current.scrollTo({ y: 0, animated: true });
            setHasBounced(true);
          }
        }, 350);
      }
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasManyOptions, hasBounced, currentStep]);

  useEffect(() => {
    const hasManyOptions = (currentQuestion.options?.length || 0) + (currentQuestion.hasOther ? 1 : 0) > 2;
    if (hasManyOptions) {
      fadeOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000 }),
          withTiming(0.6, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      fadeOpacity.value = 0.6;
    }
  }, [currentStep]);
  
  // Initialize animation on mount
  useEffect(() => {
    // Animate in
    containerTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
    
    // Fade in content after container animation
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setTimeout(() => {
          setKeyboardHeight(e.endCoordinates.height);
          setIsKeyboardVisible(true);
        }, 150);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setTimeout(() => {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        }, 150);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Update parent state whenever answers or step changes
  useEffect(() => {
    if (onStateUpdate) {
      onStateUpdate(answers, currentStep);
    }
  }, [answers, currentStep, onStateUpdate]);

  useEffect(() => {
    keyboardAnim.value = withTiming(isKeyboardVisible ? 1 : 0, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [isKeyboardVisible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { 
        translateY: containerTranslateY.value + keyboardOffset.value - (isKeyboardVisible ? keyboardHeight * 0.25 : 0)
      }
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const questionAnimatedStyle = useAnimatedStyle(() => {
    // If dismissing while keyboard is open, force scale to 1 for fade out
    const scale = (isDismissingRef.current && isKeyboardVisible) ? 1 : interpolate(keyboardAnim.value, [0, 1], [1, 0.92]);
    const translateY = interpolate(keyboardAnim.value, [0, 1], [0, -screenHeight * 0.06]);
    return {
      transform: [
        { scale },
        { translateY },
      ] as any,
    };
  });

  const validateCurrentAnswer = (): string | null => {
    const question = currentQuestion;
    const answer = currentAnswer;

    switch (question.type) {
      case 'text':
        return validateName(answer);
      case 'roulette':
        if (question.id === 'age') {
          return validateAge(answer);
        }
        return validateRequired(answer, question.title);
      case 'choice':
        if (answer === 'Other' && question.hasOther) {
          if (!otherText || otherText.trim().length === 0) {
            return "Please specify your other option";
          }
          if (otherText.trim().length < 2) {
            return "Please provide more detail";
          }
        }
        return validateRequired(answer, question.title);
      case 'multiple':
        if (!Array.isArray(answer) || answer.length === 0) {
          return `Please select at least one option for ${question.title}`;
        }
        if (answer.includes('Other') && question.hasOther) {
          if (!otherText || otherText.trim().length === 0) {
            return "Please specify your other option";
          }
        }
        return null;
      case 'belief':
        return validateBelief(answer);
      default:
        return validateRequired(answer, question.title);
    }
  };

  // Check if current answer is valid for mandatory questions
  const canProceed = (() => {
    const error = validateCurrentAnswer();
    return error === null;
  })();

  const saveOnboardingData = async (finalAnswers: Record<string, any>) => {
    // Retry logic to wait for authentication session
    const maxRetries = 5;
    const retryDelay = 1000;
    let currentUser = null;
    let lastError = null;
    
    for (let i = 0; i < maxRetries; i++) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!userError && user?.id) {
        currentUser = user;
        break;
      }
      
      lastError = userError;
      console.log(`[ONBOARDING] User check failed on attempt ${i + 1}:`, userError);
      
      if (i < maxRetries - 1) {
        console.log(`[ONBOARDING] Waiting ${retryDelay}ms before retry ${i + 2}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    if (!currentUser?.id) {
      console.error('No authenticated user found for saving onboarding data after retries:', lastError);
      // Don't throw error - continue with onboarding completion
      // The user might be authenticated but the context hasn't updated yet
      return;
    }

    try {
      const sanitizedAnswers = {
        name: sanitizeInput(finalAnswers.name || ''),
        age: parseInt(finalAnswers.age) || null,
        gender: sanitizeInput(finalAnswers.gender || ''),
        language: sanitizeInput(finalAnswers.language || ''),
        motivation: Array.isArray(finalAnswers.motivation) 
          ? sanitizeArray(finalAnswers.motivation)
          : [sanitizeInput(finalAnswers.motivation || '')],
        primary_goal: sanitizeInput(finalAnswers.primary_goal || ''),
        self_talk_difficult: sanitizeInput(finalAnswers.self_talk_difficult || ''),
        current_self_talk: Array.isArray(finalAnswers.current_self_talk)
          ? sanitizeArray(finalAnswers.current_self_talk)
          : [sanitizeInput(finalAnswers.current_self_talk || '')],
        affirmation_time: sanitizeInput(finalAnswers.affirmation_time || ''),
        reflection_frequency: sanitizeInput(finalAnswers.reflection_frequency || ''),
        affirmation_tone: sanitizeInput(finalAnswers.affirmation_tone || ''),
        voice_connection: sanitizeInput(finalAnswers.voice_connection || ''),
        first_limiting_belief: sanitizeInput(finalAnswers.first_belief || ''),
      };

      console.log('[ONBOARDING] Saving onboarding data for user:', currentUser.id);

      const { data, error } = await supabase
        .from('onboarding_responses')
        .upsert({
          user_id: currentUser.id,
          ...sanitizedAnswers,
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('[ONBOARDING] Error saving onboarding data:', error);
        throw error;
      }

      console.log('[ONBOARDING] Successfully saved onboarding data:', data);

      // Also update the user profile with basic info
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: sanitizedAnswers.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (profileError) {
        console.error('[ONBOARDING] Error updating user profile:', profileError);
        // Don't throw here as onboarding data was saved successfully
      } else {
        console.log('[ONBOARDING] Successfully updated user profile');
      }

    } catch (error) {
      console.error('[ONBOARDING] Failed to save onboarding data:', error);
      throw error;
    }
  };

  const handleNext = () => {
    setValidationError(null);
    
    const validationResult = validateCurrentAnswer();
    if (validationResult) {
      setValidationError(validationResult);
      return;
    }

    // Handle "Other" option for choice and multiple questions
    if (currentAnswer === 'Other' || (Array.isArray(currentAnswer) && currentAnswer.includes('Other'))) {
      if (currentQuestion.hasOther && otherText.trim()) {
        const updatedAnswers = { ...answers };
        if (Array.isArray(currentAnswer)) {
          // Replace "Other" with the actual other text in the array
          updatedAnswers[currentQuestion.id] = currentAnswer.map(item => 
            item === 'Other' ? otherText.trim() : item
          );
        } else {
          // Replace "Other" with the actual other text
          updatedAnswers[currentQuestion.id] = otherText.trim();
        }
        setAnswers(updatedAnswers);
      }
    }

    if (isLastStep) {
      handleComplete(answers);
    } else {
      // Animate question out before moving to next
      setQuestionAnimating(true);
      setQuestionVisible(false);
      
      setTimeout(() => {
      // Reset scroll positions before moving to next question
      resetScrollPositions();
      
      // Clear other text for next question
      setOtherText('');
      setShowOtherInput(false);
      
        // Move to next question
      setCurrentStep(currentStep + 1);
      contentOpacity.value = 0;
        
        // Animate content back in
        setTimeout(() => {
          contentOpacity.value = withTiming(1, { duration: 300 });
          setQuestionVisible(true);
          setQuestionAnimating(false);
        }, 100);
      }, 300);
    }
  };

  const handleComplete = async (finalAnswers: Record<string, any>) => {
    setIsLoading(true);
    try {
      await saveOnboardingData(finalAnswers);
      onComplete(finalAnswers);
    } catch (error) {
      Alert.alert('Error', 'Failed to save your responses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    isDismissingRef.current = true;
    setQuestionVisible(false); // Start question fade out immediately
    // Animate out and close modal
    containerTranslateY.value = withTiming(minModalHeight, { duration: 300 }, () => {
      runOnJS(onBack)();
      isDismissingRef.current = false;
    });
  };

  const handlePreviousQuestion = () => {
    if (currentStep > 0) {
      // Animate question out before moving to previous
      setQuestionAnimating(true);
      setQuestionVisible(false);
      
      setTimeout(() => {
      // Reset scroll positions before moving to previous question
      resetScrollPositions();
      setCurrentStep(currentStep - 1);
      setValidationError(null);
        
        // Animate content back in
        setTimeout(() => {
          contentOpacity.value = withTiming(1, { duration: 300 });
          setQuestionVisible(true);
          setQuestionAnimating(false);
        }, 100);
      }, 300);
    } else {
      handleBack();
    }
  };

  const handleMultipleChoice = (option: string) => {
    const currentAnswerArray = Array.isArray(currentAnswer) ? currentAnswer : [];
    let newAnswer: string[];
    
    if (currentAnswerArray.includes(option)) {
      newAnswer = currentAnswerArray.filter(item => item !== option);
    } else {
      newAnswer = [...currentAnswerArray, option];
    }
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswer
    }));

    // Handle "Other" option
    if (option === 'Other' && currentQuestion.hasOther) {
      setShowOtherInput(!currentAnswerArray.includes(option));
      if (currentAnswerArray.includes(option)) {
        setOtherText('');
      }
    }
    
    setValidationError(null);
  };

  const handleSingleChoice = (option: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));

    // Handle "Other" option
    if (option === 'Other' && currentQuestion.hasOther) {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
      setOtherText('');
    }
    
    setValidationError(null);
  };

  const handleRouletteChange = (value: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
    setValidationError(null);
  };

  const handleTextInputChange = (text: string) => {
    const now = Date.now();
    if (now - lastInputTime < INPUT_RATE_LIMIT) {
      return; // Rate limit input changes
    }
    setLastInputTime(now);
    
    // Sanitize input before setting state
    const sanitizedText = sanitizeInput(text);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: sanitizedText
    }));
    setValidationError(null);
  };

  const handleOtherTextChange = (text: string) => {
    const now = Date.now();
    if (now - lastInputTime < INPUT_RATE_LIMIT) {
      return; // Rate limit input changes
    }
    setLastInputTime(now);
    
    // Sanitize other text input
    const sanitizedText = sanitizeInput(text);
    setOtherText(sanitizedText);
    setValidationError(null);
  };

  // Reset scroll positions when navigating between questions
  const resetScrollPositions = () => {
    try {
      if (mainScrollViewRef?.current) {
        mainScrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      if (choiceScrollViewRef?.current) {
        choiceScrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      if (multipleScrollViewRef?.current) {
        multipleScrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    } catch (error) {
      console.log('Error resetting scroll positions:', error);
      // Silently fail - not critical for functionality
    }
  };

  // Add input validation
  const validateInput = (input: string, questionType: string): string | null => {
    if (!input || input.trim().length === 0) {
      return 'This field is required';
    }
    
    if (input.length < 2) {
      return 'Input must be at least 2 characters long';
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /data:text\/html/i,
      /vbscript:/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        return 'Invalid input detected';
      }
    }
    
    return null;
  };

  const renderRoulettePicker = () => (
    <View style={[styles.rouletteContainer, { width: '100%', alignItems: 'center' }]}>
      <RoulettePicker
        items={currentQuestion.rouletteItems || []}
        selectedValue={currentAnswer}
        onValueChange={handleRouletteChange}
        isLanguagePicker={currentQuestion.id === 'language'}
      />
    </View>
  );

  const renderChoiceOptions = () => (
    <View style={styles.optionsWrapper}>
      <View style={styles.scrollContainer}>
        <View style={[styles.optionsContainer, { width: '100%', alignItems: 'center' }]}> 
          {currentQuestion.options?.map((option, index) => (
            <Animated.View
              key={option}
              entering={FadeInUp.delay(index * 50).duration(300)}
              style={{ width: '100%' }}
            >
              <Pressable
                style={[
                  styles.optionButton,
                  currentAnswer === option && styles.optionButtonSelected
                ]}
                onPress={() => handleSingleChoice(option)}
              >
                <Text style={[
                  styles.optionText,
                  currentAnswer === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                {currentAnswer === option && (
                  <Feather name="check" size={20} color={foundations.colors.primary} />
                )}
              </Pressable>
            </Animated.View>
          ))}
          {currentQuestion.hasOther && (
            <Animated.View
              entering={FadeInUp.delay((currentQuestion.options?.length || 0) * 50).duration(300)}
              style={{ width: '100%' }}
            >
              <Pressable
                style={[
                  styles.optionButton,
                  currentAnswer === 'Other' && styles.optionButtonSelected
                ]}
                onPress={() => handleSingleChoice('Other')}
              >
                <Text style={[
                  styles.optionText,
                  currentAnswer === 'Other' && styles.optionTextSelected
                ]}>
                  Other
                </Text>
                {currentAnswer === 'Other' && (
                  <Feather name="check" size={20} color={foundations.colors.primary} />
                )}
              </Pressable>
            </Animated.View>
          )}
          {showOtherInput && (
            <Animated.View entering={FadeInUp.delay(200)} style={styles.otherInputContainer}>
              <TextInput
                style={[styles.otherInput, validationError && styles.inputError]}
                placeholder="Please specify..."
                placeholderTextColor={foundations.colors.textPlaceholder}
                value={otherText}
                onChangeText={handleOtherTextChange}
                maxLength={100}
                autoCapitalize="sentences"
                autoCorrect={true}
                spellCheck={true}
                returnKeyType="done"
                blurOnSubmit={true}
                textContentType="none"
                autoComplete="off"
                importantForAccessibility="no"
              />
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );

  const renderMultipleChoice = () => {
    return (
      <View style={styles.optionsWrapper}>
        <View style={styles.scrollContainer}>
          <View style={[styles.optionsContainer, { width: '100%', alignItems: 'center' }]}> 
            {currentQuestion.options?.map((option, index) => {
              const currentAnswerArray = Array.isArray(currentAnswer) ? currentAnswer : [];
              const isSelected = currentAnswerArray.includes(option);
              return (
                <Animated.View
                  key={option}
                  entering={FadeInUp.delay(index * 50).duration(300)}
                  style={{ width: '100%' }}
                >
                  <Pressable
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected
                    ]}
                    onPress={() => handleMultipleChoice(option)}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={20} color={foundations.colors.primary} />
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
            {currentQuestion.hasOther && (
              <Animated.View
                entering={FadeInUp.delay((currentQuestion.options?.length || 0) * 50).duration(300)}
                style={{ width: '100%' }}
              >
                <Pressable
                  style={[
                    styles.optionButton,
                    Array.isArray(currentAnswer) && currentAnswer.includes('Other') && styles.optionButtonSelected
                  ]}
                  onPress={() => handleMultipleChoice('Other')}
                >
                  <Text style={[
                    styles.optionText,
                    Array.isArray(currentAnswer) && currentAnswer.includes('Other') && styles.optionTextSelected
                  ]}>
                    Other
                  </Text>
                  {Array.isArray(currentAnswer) && currentAnswer.includes('Other') && (
                    <Feather name="check" size={20} color={foundations.colors.primary} />
                  )}
                </Pressable>
              </Animated.View>
            )}
            {showOtherInput && (
              <Animated.View entering={FadeInUp.delay(200)} style={styles.otherInputContainer}>
                <TextInput
                  style={[styles.otherInput, validationError && styles.inputError]}
                  placeholder="Please specify..."
                  placeholderTextColor={foundations.colors.textPlaceholder}
                  value={otherText}
                  onChangeText={handleOtherTextChange}
                  maxLength={100}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  spellCheck={true}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  textContentType="none"
                  autoComplete="off"
                  importantForAccessibility="no"
                />
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTextInput = () => (
    <View style={[styles.inputContainer, { width: '100%', alignItems: 'center' }]}>
      <TextInput
        style={[styles.textInput, validationError && styles.inputError]}
        placeholder={currentQuestion.placeholder}
        placeholderTextColor={foundations.colors.textPlaceholder}
        value={currentAnswer as string || ''}
        onChangeText={handleTextInputChange}
        multiline={currentQuestion.type === 'text_long' || currentQuestion.type === 'belief'}
        numberOfLines={currentQuestion.type === 'text_long' || currentQuestion.type === 'belief' ? 4 : 1}
        maxLength={currentQuestion.type === 'text_long' || currentQuestion.type === 'belief' ? 500 : 100}
        autoCapitalize="sentences"
        autoCorrect={true}
        spellCheck={true}
        secureTextEntry={false}
        returnKeyType={currentQuestion.type === 'text_long' || currentQuestion.type === 'belief' ? 'default' : 'done'}
        blurOnSubmit={currentQuestion.type !== 'text_long' && currentQuestion.type !== 'belief'}
        textContentType="none"
        autoComplete="off"
        importantForAccessibility="no"
      />
    </View>
  );

  // Reset questionVisible when question changes
  useEffect(() => {
    setQuestionVisible(true);
  }, [currentStep]);

  return (
    <View style={styles.fullScreenOverlay}>
      {/* Blur background */}
      <BlurView intensity={50} style={styles.blurBackground} />

      {/* Question above modal with enhanced animations */}
      {questionVisible && (
        <Animated.View 
          entering={FadeInUp.duration(400).delay(100)} 
          exiting={FadeOutDown.duration(300)} 
          style={[styles.questionAboveModalCenteredAnimated, questionAnimatedStyle]}
        >
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            style={{ alignItems: 'center' }}
          >
            <Text variant="bold" style={styles.questionTitleLarge}>{currentQuestion.title}</Text>
            {currentQuestion.type === 'multiple' && (
              <Text style={styles.helperText}>You can select more than one option</Text>
            )}
          </Animated.View>
        </Animated.View>
      )}

      {/* Animated container for the modal (now rendered after the question for correct animation order) */}
      <Animated.View style={[styles.animatedContentContainer, containerAnimatedStyle]}>
        {/* Touch area to close modal */}
        <Pressable
          style={styles.touchLayer}
          onPress={handleBack}
        />

        <View style={styles.modalContainer}>
          {/* Header with progress and back arrow */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable 
                style={styles.backButton}
                onPress={handlePreviousQuestion}
              >
                <Feather name="arrow-left" size={24} color={foundations.colors.textPrimary} />
              </Pressable>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
              <View style={styles.backButton} />
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <ScrollView
              ref={mainScrollViewRef}
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
              onContentSizeChange={(_, contentHeight) => setMainScroll(s => ({ ...s, contentHeight }))}
              onLayout={e => {
                const height = e.nativeEvent.layout.height;
                setMainScroll(s => ({ ...s, visibleHeight: height }));
              }}
              onScroll={e => {
                const y = e.nativeEvent.contentOffset.y;
                setMainScroll(s => ({ ...s, scrollY: y }));
                setIsMainScrolling(true);
                setTimeout(() => setIsMainScrolling(false), 1000);
              }}
              scrollEventThrottle={16}
            >
              <Animated.View style={[styles.questionSection, contentAnimatedStyle]} key={currentQuestion.id}>
                {/* Answer Section */}
                <View
                  style={[
                    styles.answerSection,
                    {
                      width: '100%',
                      alignItems: 'center',
                      justifyContent: currentQuestion.type === 'roulette' ? 'center' : 'flex-start',
                    },
                  ]}
                >
                  {currentQuestion.type === 'roulette' && renderRoulettePicker()}
                  {currentQuestion.type === 'choice' && renderChoiceOptions()}
                  {currentQuestion.type === 'multiple' && renderMultipleChoice()}
                  {(currentQuestion.type === 'text' || currentQuestion.type === 'belief') && renderTextInput()}
                </View>
                {/* Validation Error */}
                {validationError && (
                  <Animated.View entering={FadeInUp.delay(100)} style={[styles.errorContainer, { alignSelf: 'center' }]}> 
                    <Feather name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{validationError}</Text>
                  </Animated.View>
                )}
              </Animated.View>
            </ScrollView>
            {/* Custom scroll bar for main content */}
            {mainScroll.contentHeight > mainScroll.visibleHeight && mainScroll.visibleHeight > 0 && (
              <View style={[styles.customScrollBar, { height: mainScroll.visibleHeight }]}> 
                <View
                  style={[
                    styles.scrollBarThumb,
                    (() => {
                      const scrollBarHeight = mainScroll.visibleHeight;
                      const thumbHeight = Math.max((mainScroll.visibleHeight / mainScroll.contentHeight) * scrollBarHeight, 20);
                      const thumbTop = mainScroll.contentHeight > mainScroll.visibleHeight
                        ? ((mainScroll.scrollY / (mainScroll.contentHeight - mainScroll.visibleHeight)) * (scrollBarHeight - thumbHeight) || 0)
                        : 0;
                      return {
                        height: thumbHeight,
                        top: thumbTop,
                        opacity: isMainScrolling ? 1 : 0.7,
                      };
                    })(),
                  ]}
                />
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                utils.createButtonStyle('primary', 'lg'),
                { paddingVertical: 10, paddingHorizontal: 18 },
                pressed && components.button.states.pressed,
                !canProceed && components.button.states.disabled,
                isLoading && components.button.states.loading,
              ]}
              onPress={handleNext}
              disabled={!canProceed || isLoading}
            >
              <LinearGradient
                colors={[...foundations.gradients.primaryButton.colors]}
                start={foundations.gradients.primaryButton.start}
                end={foundations.gradients.primaryButton.end}
                style={StyleSheet.absoluteFill}
              />
              {isLoading
                ? <SoundWaveSpinner size="medium" color={foundations.colors.textLight} style={{ alignSelf: 'center', zIndex: 2 }} />
                : <Text style={[
                    components.button.typography.lg,
                    { color: foundations.colors.textLight }
                  ]}>
                    {isLastStep ? 'Complete questionnaire' : 'Continue'}
                  </Text>
              }
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  animatedContentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: minModalHeight,
    maxHeight: maxModalHeight,
    zIndex: 5,
  },
  touchLayer: {
    position: 'absolute',
    bottom: minModalHeight,
    top: -screenHeight,
    left: 0,
    right: 0,
    zIndex: 3,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    backgroundColor: foundations.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
    minHeight: minModalHeight,
    maxHeight: maxModalHeight,
    zIndex: 4,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: foundations.colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionSection: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  questionContainer: {
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 32,
    color: foundations.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 18,
    color: foundations.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  answerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 0,
   
  },
  rouletteContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  optionsWrapper: {
    position: 'relative',
    width: '100%',
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  optionsScrollView: {
    maxHeight: 300,
    minHeight: 200,
    backgroundColor: 'transparent', // Remove white background
  },
  optionsContainer: {
    gap: 12,
    width: '100%',
  },
  fadeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  scrollHint: {
    position: 'absolute',
    right: 16,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    width: '100%',
  },
  optionButtonSelected: {
    borderColor: foundations.colors.primary,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    shadowColor: foundations.colors.primary,
    shadowOpacity: 0.1,
  },
  optionText: {
    fontSize: 18,
    color: foundations.colors.textPrimary,
    lineHeight: 26,
    flex: 1,
  },
  optionTextSelected: {
    color: foundations.colors.textPrimary,
  },
  inputContainer: {
    marginTop: 8,
    width: '100%',
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: foundations.colors.textPrimary,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    fontFamily: 'Poppins-Regular',
    minHeight: 48,
    textAlignVertical: 'top',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    width: '100%',
  },
  otherInputContainer: {
    marginTop: 12,
  },
  otherInput: {
    borderWidth: 1,
    borderColor: foundations.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: foundations.colors.textPrimary,
    backgroundColor: foundations.colors.background,
    fontFamily: 'Poppins-Regular',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  questionAboveModalCenteredAnimated: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%', // up to the top of the popup (min height)
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    paddingHorizontal: 24,
  },
  questionTitleLarge: {
    fontSize: 46,
    color: foundations.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 54,
    letterSpacing: -0.5,
    fontWeight: 'bold',
    textShadowColor: 'rgba(167,139,250,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  customScrollBar: {
    width: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.1)', // Light purple background
    borderRadius: 3,
    marginLeft: 8,
    marginTop: 10,
    position: 'relative',
  },
  scrollBarThumb: {
    width: 6,
    backgroundColor: '#a78bfa', // App purple color
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  helperText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
}); 