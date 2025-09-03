import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, Platform, UIManager, LayoutAnimation, Dimensions, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, useAnimatedScrollHandler, interpolate, Extrapolate, useDerivedValue } from 'react-native-reanimated';
import { Animated as RNAnimated } from 'react-native';
import DynamicStatusBar from '../components/DynamicStatusBar';
import { BlurView } from 'expo-blur';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';


import CalendarWeekDisplay from '../components/CalendarWeekDisplay';

import BeliefCard from '../components/BeliefCard';
import BeliefStrengthCard from '../components/BeliefStrengthCard';
import DailyBoostCard from '../components/DailyBoostCard';
import CustomTracksGrid from '../components/CustomTracksGrid';

import NextGoalCard from '../components/NextGoalCard';
import HiddenBeliefCard from '../components/HiddenBeliefCard';
import { Skeleton } from '../components/ui/InfoContainer';

import { theme } from '../constants';
const { colors, spacing, radii } = theme.foundations;
const { button, layout } = theme.components;
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { addMinutes, differenceInMinutes, isToday, parse, getDay } from 'date-fns';

import { RootStackParamList } from '../types/navigation';
import { navigationRef } from '../../App';
import SoundWaveSpinner from '../components/SoundWaveSpinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { appStateService } from '../services/appStateService';
import { errorHandlerService } from '../services/errorHandlerService';

// Import new caching services
import { userDataService } from '../services/userDataService';
import { aiContentService } from '../services/aiContentService';
import { sessionDataService } from '../services/sessionDataService';
import { loadingStateService } from '../services/loadingStateService';
import { appStartupService } from '../services/appStartupService';
import { beliefProgressService } from '../services/beliefProgressService';
import { goalProgressService, GoalProgressData } from '../services/goalProgressService';
import { dailyCompletionService, DailyCompletionStats } from '../services/dailyCompletionService';
import { sessionCompletionService } from '../services/sessionCompletionService';
import { DailyRitualsService } from '../services/dailyRitualsService';
import { statsService } from '../services/statsService';


import WaveSpinnerOverlay from '../components/WaveSpinnerOverlay';
import PartialLoader from '../components/PartialLoader';



// Helper function to get greeting based on time
function getGreeting(): string {
  const currentHour = new Date().getHours();
  if (currentHour < 12) {
    return 'Good morning';
  } else if (currentHour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}



if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const screenWidth = Dimensions.get('window').width;
const TEXT_CONTAINER_HEIGHT = 46; 
const ANIMATION_DURATION = 300; 

// Parallax constants
const HEADER_MAX_HEIGHT = 290; // Original header height
const HEADER_MIN_HEIGHT = 170; // Minimum header height when scrolled
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const parentNavigation = navigation.getParent();
  const { signOut, isAuthenticated, user } = useAuth();

  
  // State for cached data
  const [userName, setUserName] = useState<string | null>(null);
  const [currentFocusArea, setCurrentFocusArea] = useState<string | null>(null);
  const [currentBelief, setCurrentBelief] = useState<{ id?: string; title: string; description: string | null; positiveBelief?: string } | null>(null);
  const [dailyAffirmation, setDailyAffirmation] = useState<string>('');
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isPartialLoading, setIsPartialLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');



  // Session data state
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [dailyRepetitions, setDailyRepetitions] = useState<Array<{ date: string; completed: number; total: number }>>([]);
  
  // Daily completion state
  const [dailyCompletionStats, setDailyCompletionStats] = useState<DailyCompletionStats>({
    completedDates: [],
    currentStreak: 0,
    totalCompletedDays: 0,
    weeklyCompletionRate: 0
  });
  const [dailyCompletionData, setDailyCompletionData] = useState<Array<{ date: string; isComplete: boolean }>>([]);
  
  // Calculated stats for components
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [beliefStats, setBeliefStats] = useState({
    sessionTime: 0,
    streak: 0,
    consistency: 0
  });

  // Belief strength state
  const [beliefStrengthRating, setBeliefStrengthRating] = useState<number>(0);
  
  // Goal progress state
  const [goalProgressData, setGoalProgressData] = useState<GoalProgressData | null>(null);
  const [beliefStrengthConfirmed, setBeliefStrengthConfirmed] = useState(false);
  const [beliefProgressPercentage, setBeliefProgressPercentage] = useState(0);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [hasRatings, setHasRatings] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [beliefProgressData, setBeliefProgressData] = useState<any>(null);

  // Dynamic messages state
  const [dynamicMessages, setDynamicMessages] = useState<string[]>([]); 
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [currentSubText, setCurrentSubText] = useState<string>(''); 
  
  // Simple countdown state
  const [countdownText, setCountdownText] = useState<string>('');
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); 
  const isInitialRenderRef = useRef<boolean>(true); 

  // Shared value for ScrollView scroll position for parallax (Reanimated)
  const scrollY = useSharedValue(0);
  
  // Shared value for exit animation
  const exitProgress = useSharedValue(0);

  const [animationKey, setAnimationKey] = useState(0);



  // Simple function to get countdown text for next goal
  const getCountdownText = async (): Promise<string> => {
    try {
      const now = new Date();
      const currentDay = getDay(now);
      const weekStartDate = DailyRitualsService.getWeekStartDate(now);
      
      // Get today's rituals
      const rituals = await DailyRitualsService.getRitualsForWeek(weekStartDate);
      const todaysRituals = rituals.filter(ritual => ritual.day_of_week === currentDay && !ritual.completed);
      
      let closestTask: { name: string; minutesUntil: number; secondsUntil: number } | null = null;
      
      todaysRituals.forEach(ritual => {
        // Parse the time
        let taskTime: Date;
        try {
          taskTime = parse(ritual.time, 'h:mma', now);
          if (isNaN(taskTime.getTime())) {
            taskTime = parse(ritual.time, 'HH:mm', now);
          }
        } catch {
          return;
        }
        
        // Set the task time to today
        taskTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
        
        const totalSecondsUntil = Math.floor((taskTime.getTime() - now.getTime()) / 1000);
        
        // Check if task is within next 60 minutes and not in the past
        if (totalSecondsUntil >= 0 && totalSecondsUntil <= 3600) {
          const minutesUntil = Math.floor(totalSecondsUntil / 60);
          const secondsUntil = totalSecondsUntil % 60;
          
          if (!closestTask || totalSecondsUntil < (closestTask.minutesUntil * 60 + closestTask.secondsUntil)) {
            closestTask = {
              name: ritual.name,
              minutesUntil,
              secondsUntil
            };
          }
        }
      });
      
      if (!closestTask) {
        return '';
      }
      
      // Format countdown text
      const { name, minutesUntil, secondsUntil } = closestTask;
      
      if (minutesUntil === 0 && secondsUntil === 0) {
        return `Your next step to '${name}' is due now`;
      } else if (minutesUntil === 0) {
        return `Your next step to '${name}' is due in **${secondsUntil}** seconds`;
      } else if (minutesUntil === 1 && secondsUntil === 0) {
        return `Your next step to '${name}' is due in **1** minute`;
      } else {
        return `Your next step to '${name}' is due in **${minutesUntil}:${String(secondsUntil).padStart(2, '0')}**`;
      }
    } catch (error) {
      errorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'HOME_SCREEN');
      return '';
    }
  };


    // Load all cached data on mount with intelligent loading states
  useEffect(() => {
    const loadCachedData = async () => {
      if (!user?.id) return;
      
      // Check cache FIRST before any loading state
      const cachedUserName = await userDataService.getUserName(user.id);
      const cachedAiContent = await aiContentService.getAIContent(user.id);
      const cachedSessionData = await sessionDataService.getSessionData(user.id);
      
      // Determine loading context
      const hasCachedData = !!(cachedUserName && cachedAiContent && cachedSessionData);
      const isFirstTime = !hasCachedData;
      
      // Check if data is critical for screen functionality
      const isCritical = loadingStateService.isDataCritical('HomeScreen', 'user_data') ||
                        loadingStateService.isDataCritical('HomeScreen', 'ai_content') ||
                        loadingStateService.isDataCritical('HomeScreen', 'session_data');
      
      // Get appropriate loading state
      const loadingContext = {
        screen: 'HomeScreen',
        action: isFirstTime ? 'first_time_setup' : 'load_cached_data',
        dataType: 'user_data',
        isFirstTime,
        hasCachedData,
        isCritical
      };
      
      const loadingState = loadingStateService.getLoadingState(loadingContext);
      
      // Set loading states based on context
      setIsDataLoading(loadingState.isBlocking);
      setIsPartialLoading(loadingState.isPartial);
      setLoadingMessage(loadingState.message);
      
      // If we have cached data, set it immediately
      if (hasCachedData) {
        setUserName(cachedUserName);
        
        // Set AI content
        if (cachedAiContent.affirmations && cachedAiContent.affirmations.length > 0) {
          const today = new Date();
          const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
          const affirmationIndex = dayOfYear % cachedAiContent.affirmations.length;
          setDailyAffirmation(cachedAiContent.affirmations[affirmationIndex] || '');
        }

        // Get the active belief data first for cached data
        const { data: cachedBeliefs } = await supabase
          .from('beliefs')
          .select('id, title, description, positive_belief')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1);
        
        const cachedBelief = cachedBeliefs?.[0];
        
        if (cachedBelief) {
          setCurrentBelief({
            id: cachedBelief.id,
            title: cachedBelief.title, // Use the actual limiting belief title
            description: cachedBelief.description || 'AI-generated transformation from your limiting belief',
            positiveBelief: cachedBelief.positive_belief || cachedAiContent.positive_belief || '',
          });
        }
        
        // Set session data
        setCompletedDates(cachedSessionData.completedDates);
        setCurrentStreak(cachedSessionData.currentStreak);
        setDailyRepetitions(cachedSessionData.dailyRepetitions);
        
        // Calculate stats for components
        calculateComponentStats(cachedSessionData);
        
        // Get the active belief ID first

        const { data: beliefs } = await supabase
          .from('beliefs')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1);
        
        const beliefId = beliefs?.[0]?.id;
        
        // Update current belief with ID if available
        if (beliefId) {
          setCurrentBelief(prev => prev ? { ...prev, id: beliefId } : null);
        }
        
        // Load belief progress data from cache with belief ID
        const progressData = await beliefProgressService.getBeliefProgress(user.id, beliefId);
        setBeliefProgressData(progressData);
        setBeliefStrengthRating(progressData.currentRating);
        setBeliefProgressPercentage(progressData.progressPercentage);
        setHasSubmittedToday(progressData.hasSubmittedToday);
        setHasRatings(progressData.hasRatings);
        
        // Load goal progress data
        if (beliefId) {
          const goalProgress = await goalProgressService.getGoalProgress(user.id, beliefId);
          setGoalProgressData(goalProgress);
        }
        
        // Mark data as loaded for future reference
        await loadingStateService.markDataTypeLoaded(user.id, 'user_data');
        await loadingStateService.markDataTypeLoaded(user.id, 'ai_content');
        await loadingStateService.markDataTypeLoaded(user.id, 'session_data');
        
        // Clear loading states
        setIsDataLoading(false);
        setIsPartialLoading(false);
        return;
      }
      
      // Load data from services (this will only happen if no cached data)
      try {
        // Load all data in parallel using cached services
        const [
          userNameResult,
          focusAreaResult,
          sessionDataResult,
          aiContentResult
        ] = await Promise.allSettled([
          userDataService.getUserName(user.id),
          userDataService.getOnboardingData(user.id).then(data => data.primary_goal),
          sessionDataService.getSessionData(user.id),
          aiContentService.getAIContent(user.id)
        ]);

        // Set user name
        if (userNameResult.status === 'fulfilled') {
          setUserName(userNameResult.value);
        }

        // Set focus area
        if (focusAreaResult.status === 'fulfilled') {
          setCurrentFocusArea(focusAreaResult.value);
        }

        // Set session data
        if (sessionDataResult.status === 'fulfilled') {
          const sessionData = sessionDataResult.value;
          setCompletedDates(sessionData.completedDates);
          setCurrentStreak(sessionData.currentStreak);
          setDailyRepetitions(sessionData.dailyRepetitions);
          
          // Calculate stats for components
          calculateComponentStats(sessionData);
        }

        // Set AI content
        if (aiContentResult.status === 'fulfilled' && aiContentResult.value) {
          const aiContent = aiContentResult.value;
          
          // Set daily affirmation
          if (aiContent.affirmations && aiContent.affirmations.length > 0) {
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
            const affirmationIndex = dayOfYear % aiContent.affirmations.length;
            setDailyAffirmation(aiContent.affirmations[affirmationIndex] || '');
          }

          // Set current belief
          if (aiContent.positive_belief) {
            setCurrentBelief({
              title: 'Your Core Belief Transformation',
              description: 'AI-generated transformation from your limiting belief',
              positiveBelief: aiContent.positive_belief,
            });
          }
        }

        // Get the active belief data first

        const { data: beliefs } = await supabase
          .from('beliefs')
          .select('id, title, description, positive_belief')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1);
        
        const belief = beliefs?.[0];
        const beliefId = belief?.id;
        
        // Update current belief with actual data from database
        if (belief) {
          setCurrentBelief({
            id: belief.id,
            title: belief.title, // Use the actual limiting belief title
            description: belief.description || 'AI-generated transformation from your limiting belief',
            positiveBelief: belief.positive_belief || '',
          });
        }
        
        // Load belief progress data from cache with belief ID
        const progressData = await beliefProgressService.getBeliefProgress(user.id, beliefId);
        setBeliefProgressData(progressData);
        setBeliefStrengthRating(progressData.currentRating);
        setBeliefProgressPercentage(progressData.progressPercentage);
        setHasSubmittedToday(progressData.hasSubmittedToday);
        setHasRatings(progressData.hasRatings);
        
        // Load goal progress data
        if (beliefId) {
          const goalProgress = await goalProgressService.getGoalProgress(user.id, beliefId);
          setGoalProgressData(goalProgress);
        }

        // Load daily completion data
        const completionStats = await dailyCompletionService.getCompletionStats(user.id);
        setDailyCompletionStats(completionStats);
        
        // Get daily completion data for the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const today = new Date();
        const completionData = await dailyCompletionService.getDailyCompletionData(user.id, thirtyDaysAgo, today);
        setDailyCompletionData(completionData.map(day => ({
          date: day.date,
          isComplete: day.isComplete
        })));

        // Mark data as loaded
        await loadingStateService.markDataTypeLoaded(user.id, 'user_data');
        await loadingStateService.markDataTypeLoaded(user.id, 'ai_content');
        await loadingStateService.markDataTypeLoaded(user.id, 'session_data');



    } catch (error) {
        errorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'HOME_SCREEN');
      } finally {
        setIsDataLoading(false);
        setIsPartialLoading(false);
      }
    };

    loadCachedData();
  }, [user?.id]);



  const loadUserData = async () => {
    try {

      
      // Load user name
      const userNameResult = await userDataService.getUserName(user!.id);
      setUserName(userNameResult);

      // Load focus area
      const focusAreaResult = await userDataService.getOnboardingData(user!.id).then(data => data.primary_goal);
      setCurrentFocusArea(focusAreaResult);

      // Load session data
      const sessionDataResult = await sessionDataService.getSessionData(user!.id);
      setCompletedDates(sessionDataResult.completedDates);
      setCurrentStreak(sessionDataResult.currentStreak);
      setDailyRepetitions(sessionDataResult.dailyRepetitions);
      
      // Calculate stats for components
      calculateComponentStats(sessionDataResult);

      // Load AI content
      const aiContentResult = await aiContentService.getAIContent(user!.id);
      if (aiContentResult) {
        // Set daily affirmation
        if (aiContentResult.affirmations && aiContentResult.affirmations.length > 0) {
          const today = new Date();
          const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
          const affirmationIndex = dayOfYear % aiContentResult.affirmations.length;
          setDailyAffirmation(aiContentResult.affirmations[affirmationIndex] || '');
        }

        // Set current belief
        if (aiContentResult.positive_belief) {
          setCurrentBelief({
            title: 'Your Core Belief Transformation',
            description: 'AI-generated transformation from your limiting belief',
            positiveBelief: aiContentResult.positive_belief,
          });
        }
      }

      // Get the active belief data first

      const { data: beliefs } = await supabase
        .from('beliefs')
        .select('id, title, description, positive_belief')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      const belief = beliefs?.[0];
      const beliefId = belief?.id;
      
      // Update current belief with actual data from database
      if (belief) {
        setCurrentBelief({
          id: belief.id,
          title: belief.title, // Use the actual limiting belief title
          description: belief.description || 'AI-generated transformation from your limiting belief',
          positiveBelief: belief.positive_belief || '',
        });
      }
      
      // Load belief progress data from cache with belief ID
      const progressData = await beliefProgressService.getBeliefProgress(user!.id, beliefId);
      setBeliefProgressData(progressData);
      setBeliefStrengthRating(progressData.currentRating);
      setBeliefProgressPercentage(progressData.progressPercentage);
      setHasSubmittedToday(progressData.hasSubmittedToday);
      setHasRatings(progressData.hasRatings);
      
      // Load goal progress data
      if (beliefId) {
        const goalProgress = await goalProgressService.getGoalProgress(user!.id, beliefId);
        setGoalProgressData(goalProgress);
      }

      // Load daily completion data
      const completionStats = await dailyCompletionService.getCompletionStats(user!.id);
      setDailyCompletionStats(completionStats);
      
      // Get daily completion data for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const today = new Date();
      const completionData = await dailyCompletionService.getDailyCompletionData(user!.id, thirtyDaysAgo, today);
      setDailyCompletionData(completionData.map(day => ({
        date: day.date,
        isComplete: day.isComplete
      })));

      // Mark data as loaded
      await loadingStateService.markDataTypeLoaded(user!.id, 'user_data');
      await loadingStateService.markDataTypeLoaded(user!.id, 'ai_content');
      await loadingStateService.markDataTypeLoaded(user!.id, 'session_data');

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Calculate stats for components
  const calculateComponentStats = (sessionData: any) => {
    // Calculate daily session count
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessionData.dailyRepetitions.find(
      (session: any) => session.date === today
    );
    const todayCount = todaySessions ? todaySessions.completed : 0;
    setDailySessionCount(todayCount);
    
    // Calculate belief stats
    const sessionTime = todayCount * 2; // 2 minutes per repetition
    
    // Calculate consistency (percentage of days with sessions in last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    const daysWithSessions = last7Days.filter(date => 
      sessionData.dailyRepetitions.some((session: any) => session.date === date)
    ).length;
    const consistency = Math.round((daysWithSessions / 7) * 100);
    
    setBeliefStats({
      sessionTime,
      streak: sessionData.currentStreak,
      consistency
    });
  };



  // Check session completion status
  const checkSessionCompletion = useCallback(async () => {
    if (!user?.id || !currentBelief?.id) return;
    
    const hasCompleted = await sessionCompletionService.hasCompletedSessionToday(
      user.id, 
      currentBelief.id, 
      'practice'
    );
    setIsSessionCompleted(hasCompleted);
  }, [user?.id, currentBelief?.id]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        // Refresh session data (most frequently changing)
        sessionDataService.getSessionData(user.id).then(sessionData => {
          setCompletedDates(sessionData.completedDates);
          setCurrentStreak(sessionData.currentStreak);
          setDailyRepetitions(sessionData.dailyRepetitions);
          
          // Recalculate stats for components
          calculateComponentStats(sessionData);
        });

        // Check session completion status
        checkSessionCompletion();
      }
    }, [isAuthenticated, user?.id, checkSessionCompletion])
  );

  const handleMessageGenerated = useCallback((messages: string[]) => {
    setDynamicMessages((prevMessages: string[]) => {
        if (JSON.stringify(prevMessages) !== JSON.stringify(messages)) {
            return messages;
        } 
        return prevMessages; 
    });
  }, []);

  const updateDisplayedText = useCallback((text: string) => {
    setCurrentSubText(text);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentMessageIndex(0);
    isInitialRenderRef.current = true; 

    if (dynamicMessages.length > 0) {
      const firstMessage = dynamicMessages[0];
      updateDisplayedText(firstMessage); 

      if (dynamicMessages.length > 1) {
        intervalRef.current = setInterval(() => {
           setCurrentMessageIndex((prevIndex: number) => (prevIndex + 1) % dynamicMessages.length);
        }, 5000); 
      }
      } else {
        updateDisplayedText('');
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dynamicMessages, updateDisplayedText]); 

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }
    if (dynamicMessages.length <= 1) {
      return;
    }
    const newText = dynamicMessages[currentMessageIndex] ?? '';
    updateDisplayedText(newText);
  }, [currentMessageIndex, dynamicMessages, updateDisplayedText]);

  // Simple countdown update effect
  useEffect(() => {
    const updateCountdown = async () => {
      const text = await getCountdownText();
      setCountdownText(text);
    };
    
    // Update immediately
    updateCountdown();
    
    // Update every 30 seconds
    const interval = setInterval(updateCountdown, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Animated scroll handler (Reanimated) - Simple direct approach
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // Always track scroll position, but only apply parallax when countdown text is showing
      scrollY.value = event.contentOffset.y;
    },
  });

  // Simple animated styles - no complex logic
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: 'relative',
      zIndex: 1,
      top: 0,
      left: 0,
      right: 0,
    };
  });

  const greetingAnimatedStyle = useAnimatedStyle(() => {
    return {};
  });

  const calendarAnimatedStyle = useAnimatedStyle(() => {
    return {};
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: '100%',
    };
  });

  // Navigation handlers
  const handleContinuePress = useCallback(async () => {
    try {
      if (!user?.id) {
          (navigation as any).navigate('SessionPlayer', { 
            affirmationText: "I am capable, resilient, and embrace every opportunity for growth."
          });
        return;
      }

      // Get transformation data from cached AI content
      const aiContent = await aiContentService.getAIContent(user.id);
      let transformationText = null;
      let affirmationText = null;
      let transformationId = null;

      if (aiContent) {
        transformationText = aiContent.transformation_text;
        affirmationText = aiContent.affirmations?.[0] || "I am capable, resilient, and embrace every opportunity for growth.";
        
        // Get transformation ID from beliefs table
        const { data: beliefs } = await supabase
          .from('beliefs')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1);
        
        transformationId = beliefs?.[0]?.id;
      }

      // Check if breathing is enabled
      const breathingEnabled = await AsyncStorage.getItem('breathing_enabled');
      const isBreathingEnabled = breathingEnabled === null ? true : JSON.parse(breathingEnabled);

      if (!isBreathingEnabled) {
          (navigation as any).navigate('SessionPlayer', { 
          transformationText: transformationText,
          affirmationText: affirmationText || "I am capable, resilient, and embrace every opportunity for growth.",
          transformationId: transformationId
          });
        return;
      }

      // Check if user has seen breathing onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('has_seen_breathing_onboarding');
      
      if (hasSeenOnboarding === 'true') {
          (navigation as any).navigate('BreathingScreen', { 
          transformationText: transformationText,
          affirmationText: affirmationText || "I am capable, resilient, and embrace every opportunity for growth.",
          transformationId: transformationId
          });
        } else {
        (navigation as any).navigate('BreathingOnboardingScreen', {
          transformationText: transformationText,
          affirmationText: affirmationText || "I am capable, resilient, and embrace every opportunity for growth.",
          transformationId: transformationId
        });
      }
    } catch (error) {
      console.error('Error in handleContinuePress:', error);
      (navigation as any).navigate('SessionPlayer', { 
        affirmationText: "I am capable, resilient, and embrace every opportunity for growth."
      });
    }
  }, [user?.id]);

  const handleBeliefStrengthChange = useCallback((rating: number) => {
    setBeliefStrengthRating(rating);
  }, []);

  const handleBeliefStrengthConfirm = useCallback(async (rating: number) => {
    try {
      if (!user?.id || !currentBelief?.id) return;

      // Update belief progress data with new rating (without marking as completed session)
      const updatedProgressData = await beliefProgressService.updateBeliefProgress(
        user.id, 
        currentBelief.id, 
        rating
      );
      
      // Update state with new data
      setBeliefProgressData(updatedProgressData);
      setBeliefStrengthRating(updatedProgressData.currentRating);
      setBeliefProgressPercentage(updatedProgressData.progressPercentage);
      setHasSubmittedToday(updatedProgressData.hasSubmittedToday);
      setHasRatings(updatedProgressData.hasRatings);
      setBeliefStrengthConfirmed(true);
      
      // Update current belief with ID if available
      if (updatedProgressData.beliefId) {
        setCurrentBelief(prev => prev ? { ...prev, id: updatedProgressData.beliefId } : null);
      }
      
      // Update goal progress data
      if (currentBelief?.id) {
        // Update goal progress with the new rating
        const updatedGoalProgress = await goalProgressService.updateGoalProgressWithRating(user.id, currentBelief.id, rating);
        setGoalProgressData(updatedGoalProgress);
      }
    } catch (error) {
      console.error('Error storing belief strength rating:', error);
    }
  }, [currentBelief, user?.id]);

  const handleManagePress = useCallback(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Beliefs', { openPopup: true });
    }
  }, [navigation]);

  const handleStartJournaling = useCallback(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('MainApp', { screen: 'AiJournalTab' });
    }
  }, [navigation]);

  const handleViewMore = useCallback(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('MainApp', { screen: 'AiJournalTab' });
    }
  }, [navigation]);

  const handleNewInsight = useCallback(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('MainApp', { screen: 'AiJournalTab' });
    }
  }, [navigation]);

  const handleGoalPress = useCallback(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('MainApp', { screen: 'GoalsTab' });
    }
  }, [navigation]);

  // Hidden belief handlers
  const handleAddHiddenBeliefToBeliefs = useCallback(async () => {
    // Implementation for hidden belief functionality
  }, []);

  const handleDismissHiddenBelief = useCallback(() => {
    // Implementation for dismissing hidden belief
  }, []);

  // Reset app function
  const handleResetApp = useCallback(async () => {
    Alert.alert(
      'Reset App',
      'This will clear all your data and take you back to the welcome screen. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage
              await AsyncStorage.clear();
              
              // Sign out from Supabase
              await signOut();
              
              // Navigate to welcome screen
              if (navigationRef?.isReady?.()) {
                navigationRef.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' as never }],
                });
              }
            } catch (error) {
              console.error('Error resetting app:', error);
              Alert.alert('Error', 'Failed to reset app. Please try again.');
            }
          },
        },
      ]
    );
  }, [signOut]);

  const greeting = useMemo(() => getGreeting(), []);



  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" style="dark" />
      
              {/* Status bar blur overlay */}
        <BlurView intensity={20} style={[styles.statusBarBlur, { height: insets.top * 0.6 }]} />

      {/* Wave spinner overlay for blocking operations */}
      <WaveSpinnerOverlay 
        isVisible={isDataLoading}
      />
      
      {/* Partial loader for non-blocking operations */}
      {isPartialLoading && (
        <View style={styles.partialLoaderContainer}>
          <PartialLoader isVisible={true} type="card" />
          <PartialLoader isVisible={true} type="card" />
          <PartialLoader isVisible={true} type="card" />
        </View>
      )}

             

      <Animated.ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContentContainer}
        showsVerticalScrollIndicator={false} 
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
                                                                <View style={styles.contentWrapper}>
             {/* Normal header content */}
             <View style={[styles.normalHeaderContent, { paddingTop: insets.top + spacing.xs }]}>
               <View style={styles.greetingWrapper}>
                 <View style={styles.greetingContainer}>
                   <View style={styles.greetingTextContainer}>
                     <Text style={styles.greetingText}>{greeting}, </Text>
                     <Text style={[styles.greetingText, styles.greetingName]} numberOfLines={1}>{userName}!</Text>
                   </View>
                   
                   {/* Reset Button */}
                   <Pressable
                     style={styles.resetButton}
                     onPress={handleResetApp}
                   >
                     <Feather name="refresh-cw" size={16} color={colors.textSecondary} />
                   </Pressable>
                 </View>

                 <View style={styles.subTextOuterContainer}>
                   <View style={styles.subTextInnerContainer}>
                     {countdownText ? (
                       <Pressable onPress={() => navigation.navigate('HabitTrackerScreen' as any)}>
                         <Text style={styles.countdownText}>
                           {countdownText.split('**').map((part, index) => 
                             index % 2 === 1 ? (
                               <Text key={index} style={styles.boldNumbers}>
                                 {part}
                               </Text>
                             ) : (
                               part
                             )
                           )}
                         </Text>
                       </Pressable>
                     ) : (
                       <Text style={styles.subText}>
                         {currentSubText || 'Loading your personalized insights...'}
                       </Text>
                     )}
                   </View>
                 </View>
               </View>

               <View style={styles.calendarWrapper}>
                 <CalendarWeekDisplay 
                   key="calendar-display"
                   streakDays={dailyCompletionStats.currentStreak || 0} 
                   completedDates={dailyCompletionStats.completedDates || []} 
                   startDate={new Date(Date.now() - 86400000 * 30)} 
                   dailyCompletionData={dailyCompletionData || []}
                   dailyRepetitions={dailyRepetitions || []}
                   onMessageGenerated={handleMessageGenerated} 
                 />
               </View>
             </View>
            
             {/* Add padding bottom */}
             <View style={{ paddingBottom: spacing.xs }} />
          
          <Animated.View style={contentAnimatedStyle}>
            <View style={styles.cardsContainer}>
              <BeliefCard 
                key={`belief-${currentBelief?.title}-${currentBelief?.positiveBelief || 'no-positive'}`}
                beliefTitle={currentBelief?.title || 'No active belief found'}
                positiveBelief={currentBelief?.positiveBelief}
                onContinuePress={handleContinuePress}
                onManageBeliefs={handleManagePress}
                beliefProgressPercentage={beliefProgressPercentage}
                showBeliefProgress={hasSubmittedToday}
                beliefId={currentBelief?.id}
                dailySessionCount={dailySessionCount}
              />

              <BeliefStrengthCard
                currentRating={beliefStrengthRating}
                onRatingChange={handleBeliefStrengthChange}
                coreBelief={currentBelief?.positiveBelief}
                onConfirmRating={handleBeliefStrengthConfirm}
                isConfirmed={beliefStrengthConfirmed}
                progressPercentage={beliefProgressPercentage}
                hasSubmittedToday={hasSubmittedToday}
                beliefProgressPercentage={beliefProgressPercentage}
                hasRatings={hasRatings}
                beliefId={currentBelief?.id}
                isSessionCompleted={isSessionCompleted}
                onViewStats={() => {
                  if (navigationRef?.isReady?.()) {
                    navigationRef.navigate('Stats' as never);
                    return;
                  }
                  const parentNavigation = navigation.getParent?.();
                  if (parentNavigation) {
                    (parentNavigation as any).navigate('Stats');
                    return;
                  }
                  (navigation as any).navigate('Stats');
                }}
                goalProgress={goalProgressData}
              />

              <DailyBoostCard
                affirmationText={dailyAffirmation}
              />

              <CustomTracksGrid
                onTrackPress={(trackId) => {
                  // TODO: Handle custom track navigation or generation
                }}
              />

              <NextGoalCard
                goals={[]}
                onGoalPress={handleGoalPress}
                onGoalsUpdate={() => {}}
              />
            </View>
          </Animated.View>
        </View>
      </Animated.ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  statusBarBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  contentWrapper: {
    width: '100%',
  },
  cardsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.background,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    overflow: 'visible',
    height: HEADER_MAX_HEIGHT,
  },
  fixedHeaderContent: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    height: '100%',
  },
  normalHeaderContent: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.lg,
    marginBottom: 0,
    backgroundColor: colors.background,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  topSectionContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    paddingBottom: spacing.sm,

    marginBottom: spacing.xs,
    marginTop: 0, // No longer need negative margin since we're using translucent status bar
  },

  scrollView: {
    flex: 1, 
    width: '100%',
    backgroundColor: 'transparent', 
    zIndex: 1,
  },
  scrollViewContentContainer: {
    paddingBottom: 0,
  },

  greetingWrapper: {
    paddingHorizontal: spacing.lg,
    width: '100%',
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    justifyContent: 'space-between',
  },
  greetingTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: theme.foundations.fonts.sizes['2xl'],
    fontFamily: theme.foundations.fonts.families.regular,
    color: colors.textPrimary,
  },
  greetingName: {
    fontFamily: theme.foundations.fonts.families.bold,
  },
  resetButton: {
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTextOuterContainer: {
    minHeight: TEXT_CONTAINER_HEIGHT * 1.2,
    justifyContent: 'center',
    marginBottom: 0,
    paddingVertical: spacing.xs,
  },
  subTextInnerContainer: {
    width: '100%',
  },
  subText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  countdownText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  boldNumbers: {
    fontFamily: theme.foundations.fonts.families.bold,
    fontWeight: '900',
  },

  calendarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xs,
    minHeight: 80, // Add minimum height for calendar
  },

  empowerTextContainer: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
    width: '100%',
    alignItems: 'flex-start',
  },
  empowerText: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  paginationDot: { 
    height: 8,
    borderRadius: radii.full,
    marginHorizontal: spacing.xs,
  },
  paginationDotInactive: { 
    width: 8, 
    backgroundColor: colors.border || '#D1D5DB',
  },
  paginationDotActive: { 
    width: 20, 
    backgroundColor: colors.primary || '#8b5cf6',
  },
  stackedCardsWrapper: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  affirmationProgressWrapper: { 
    marginBottom: spacing.xl,
    width: '100%', 
  },
  mindAtGlanceSection: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  mindAtGlanceTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.textPrimary,
    textAlign: 'left',
    marginBottom: spacing.md,
  },
  beliefInProgressTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.textPrimary,
    textAlign: 'left',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.lg,
  },

  mindfulTaskCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    position: 'relative', 
  },
  topRightIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1, 
  },
  mindfulTaskTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: colors.textLight,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  mindfulTaskDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  taskListContainer: {
    marginBottom: 20,
    flexGrow: 1, 
  },
  taskItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxBase: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: colors.textLight,
  },
  taskTextCompleted: {
  },
  addTaskInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: colors.textLight,
    marginTop: 'auto', 
  },
  separatorLine: { 
    height: 1,
    backgroundColor: colors.textSecondary,
    marginVertical: 20,
  },
  moodTrackerContent: {
    flex: 1,
    width: '100%',
    padding: 15,
    justifyContent: 'flex-start',
    position: 'relative',
  },
  moodTrackerTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 5,
    textAlign: 'left',
  },
  moodTrackerQuestion: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  moodGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  moodItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 5,
  },
  moodLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  moodTrackingHint: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 'auto',
    paddingVertical: 10,
  },
  dailyReflectionCard: {
    flex: 1,
    padding: 20,
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: 16, 
    paddingBottom: 40,
  },
  dailyReflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dailyReflectionIcon: {
    marginRight: 8,
  },
  dailyReflectionTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  dailyReflectionQuestion: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  dailyReflectionInput: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.textSecondary,
    borderWidth: 1.5,
    borderRadius: 12, 
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    minHeight: 100, 
    textAlignVertical: 'top',
    marginBottom: 20,
    color: colors.textPrimary,
  },
  singleButtonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    marginTop: 10, 
  },
  dailyReflectionButton: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  reflectTodayButton: { 
    backgroundColor: colors.primary,
  },
  dailyReflectionButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
  },
  reflectTodayButtonText: { 
    color: colors.textLight,
  },
  psText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  tabInactiveButton: {
    backgroundColor: colors.surfaceSubtle,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  tabInactiveText: {
    color: colors.textSecondary,
  },
  partialLoaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 500,
    padding: spacing.lg,
  },
});

export default HomeScreen;
