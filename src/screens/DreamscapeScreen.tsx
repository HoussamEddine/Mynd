import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions, Animated, PanResponder, Platform, TouchableWithoutFeedback, Pressable, Keyboard, ScrollView, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants';
import StaggeredEntryContainer from '../components/StaggeredEntryContainer';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedButton from '../components/AnimatedButton';
import { sanitizeInput, validateTextContent } from '../services/securityService';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { supabase } from '../lib/supabase';
// Define journal entry types since they don't exist in database.ts yet
interface JournalEntry {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  analysis?: any;
  ai_sentiment_score?: number;
  ai_insights?: any;
  ai_suggestions?: any;
  word_count?: number;
  reading_time_minutes?: number;
  tags?: string[];
  is_private?: boolean;
  created_at: string;
  updated_at: string;
}

interface JournalEntryInsert {
  user_id: string;
  content: string;
  analysis?: any;
  word_count?: number;
  reading_time_minutes?: number;
  is_private?: boolean;
}
import { journalAnalysisService, type JournalAnalysisResponse } from '../services/journalAnalysisService';
import { DaydreamAnalysisService, type DaydreamAnalysis } from '../services/daydreamAnalysisService';
import SoundWaveSpinner from '../components/SoundWaveSpinner';
import InfoContainer from '../components/ui/InfoContainer';

import DynamicStatusBar from '../components/DynamicStatusBar';
const { colors, spacing, radii, fonts } = theme.foundations;
const { foundations, components, utils } = theme;

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export default function DreamscapeScreen() {
  const popupAnim = useRef(new Animated.Value(0)).current; // 0 = full, 1 = half
  const popupLayoutAnim = useRef(new Animated.Value(0)).current; // For layout properties only
  const dateColorAnim = useRef(new Animated.Value(0)).current; // 0 = white, 1 = black
  const dateOpacity = useRef(new Animated.Value(1)).current; // Always visible
  const [inputText, setInputText] = React.useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);
  const [characterCount, setCharacterCount] = React.useState(200);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false); // Default to false, will be set based on onboarding status
  const [animationReady, setAnimationReady] = useState(false);
  const [isPopupCollapsed, setIsPopupCollapsed] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showEntryDetail, setShowEntryDetail] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [beliefAdded, setBeliefAdded] = useState(false);
  const [beliefDismissed, setBeliefDismissed] = useState(false);
  const [inputValidation, setInputValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: false });
  
  // Add animated values at the top of the component
  const entriesOpacity = useRef(new Animated.Value(1)).current;
  const entriesTranslateY = useRef(new Animated.Value(0)).current;
  
  // Add animated values for each entry
  const [entryAnimVals, setEntryAnimVals] = useState<Animated.Value[]>([]);
  const [shouldAnimateEntries, setShouldAnimateEntries] = useState(false);
  
  // Simple animation values for smooth transitions
  const entryDetailOpacity = useRef(new Animated.Value(0)).current;
  const listContainerOpacity = useRef(new Animated.Value(1)).current;
  
  // Text animation values
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const textScale = useRef(new Animated.Value(0.95)).current;
  
  // Add hectic animation values
  const slideHecticAnim = useRef(new Animated.Value(0)).current;
  const popupHecticAnim = useRef(new Animated.Value(0)).current;
  
  // Auth context
  const { user, isAuthenticated } = useAuth();
  
  // Stories state
  const [stories, setStories] = useState<JournalEntry[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Analysis state
  const [currentAnalysis, setCurrentAnalysis] = useState<JournalAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  
  // Initialize animation values for stories
  useEffect(() => {
    const animVals = stories.map(() => new Animated.Value(1));
    setEntryAnimVals(animVals);
  }, [stories.length]);

  // Carousel data
  const slides = [
    {
      title: "What if your daydreams aren't just daydreams?",
      subtitle: "Our imagination is a secret window into the stories we're telling ourselves.",
      factBox: {
        text: "The average person spends nearly half their waking hours daydreaming—and these moments reveal our deepest thoughts."
      }
    },
    {
      title: "Your Daydreams Hold the Keys to Your Beliefs.",
      subtitle: "The scenarios, fears, and hopes you play out in your mind are clues to your hidden beliefs.",
      factBox: {
        text: "Much of your subconscious is revealed in these inner narratives—not in conscious decisions."
      }
    },
    {
      title: "Explore Your Inner World. Rewire Your Outer One.",
      subtitle: "Log your daydreams to uncover the hidden beliefs they contain, then use our tools to rewrite the beliefs that no longer serve you.",
      factBox: {
        text: "Guided reflection on inner narratives is a powerful way to create lasting shifts in mindset."
      }
    }
  ];

  const scrollViewRef = useRef<FlatList>(null);

  // Navigation functions
  const goToNextSlide = useCallback(() => {
    const nextSlide = (currentSlide + 1) % slides.length;
    scrollViewRef.current?.scrollToIndex({
      index: nextSlide,
      animated: true
    });
    // Update state after animation starts
    setTimeout(() => {
      setCurrentSlide(nextSlide);
    }, 100);
  }, [currentSlide, slides.length]);

  const goToPrevSlide = useCallback(() => {
    const prevSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
    scrollViewRef.current?.scrollToIndex({
      index: prevSlide,
      animated: true
    });
    // Update state after animation starts
    setTimeout(() => {
      setCurrentSlide(prevSlide);
    }, 100);
  }, [currentSlide, slides.length]);

  const handleScrollEnd = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(contentOffset / SCREEN_WIDTH);
    // Add a small delay to let animations complete before updating state
    setTimeout(() => {
      setCurrentSlide(slideIndex);
    }, 50);
  }, []);


  

  
  // Get current date
  const currentDate = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear().toString().slice(-2);
  const currentDay = dayNames[currentDate.getDay()];
  


  // Format date for journal entries
  const formatJournalDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to limit text to 20 words
  const limitToWords = (text: string, wordLimit: number = 20) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Helper function to format relative date
  const formatRelativeDate = (dateString: string) => {
    const entryDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Helper function to get hidden core belief from entry
  const getHiddenCoreBelief = (entry: any) => {
    // Use AI analysis if available, otherwise fall back to mock data
    if (entry.ai_insights?.hiddenCoreBelief) {
      return entry.ai_insights.hiddenCoreBelief;
    }
    
    // Fallback mock implementation
    const beliefs = [
      "I'm not enough",
      "I need to be perfect",
      "I'm falling behind",
      "I don't deserve success",
      "I'm not worthy of love",
      "I need to control everything",
      "I'm not smart enough",
      "I'm a failure"
    ];
    
    const index = parseInt(entry.id) % beliefs.length;
    return beliefs[index];
  };

  // Helper function to get an insight from an entry
  const getInsight = (entry: any) => {
    // Use AI analysis if available, otherwise fall back to mock data
    if (entry.ai_insights?.emotionalInsight) {
      return entry.ai_insights.emotionalInsight;
    }
    
    // Fallback mock implementation
    const insights = [
      "You may be feeling overlooked or not fully seen by the people around you.",
      "It seems like you're searching for a deeper sense of purpose and fulfillment in your daily activities.",
      "This might indicate a struggle with imposter syndrome, despite your capabilities.",
      "There's a strong desire for progress and a fear of stagnation that's driving you.",
      "You find true tranquility and clarity when you connect with the natural world.",
      "Learning to protect your energy by setting boundaries is a significant theme for you right now.",
      "You're in a phase of deep introspection about your connections with others.",
      "You are adapting to new circumstances with a resilient and hopeful mindset."
    ];
    
    if (!entry || !entry.id) return null;
    
    const index = parseInt(entry.id) % insights.length;
    return insights[index];
  };

  useEffect(() => {
    // Check if user has seen onboarding
    const checkOnboardingStatus = async () => {
      try {
        const onboardingSeen = await AsyncStorage.getItem('mindJournalOnboardingSeen');

        const hasSeen = onboardingSeen === 'true';
        setHasSeenOnboarding(hasSeen);
        
        if (hasSeen) {
          // If returning user, show journal listing in collapsed state

          popupAnim.setValue(1);
          popupLayoutAnim.setValue(1);
          setIsPopupCollapsed(true);
          setShowOnboarding(false);
          dateOpacity.setValue(1);
          setIsLoading(false);
        } else {
          // If new user, mark as seen immediately and show onboarding
          await AsyncStorage.setItem('mindJournalOnboardingSeen', 'true');
          setHasSeenOnboarding(true);
          popupAnim.setValue(0);
          popupLayoutAnim.setValue(0);
          setIsPopupCollapsed(false);
          setShowOnboarding(true);
          dateOpacity.setValue(1);
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Handle popup collapse state changes
  useEffect(() => {
    if (isPopupCollapsed && showOnboarding) {
      // When collapsing during onboarding, switch to journal content
      setShowOnboarding(false);
    }
  }, [isPopupCollapsed, showOnboarding]);

  // Set animation ready when loading is complete
  useEffect(() => {
    if (!isLoading) {
      setAnimationReady(true);
    }
  }, [isLoading]);

  // Simple effect to set animation values to final state
  useFocusEffect(
    useCallback(() => {
      // Set animation key to final state immediately
      setAnimationKey(prev => prev + 1);
    }, [])
  );

  // Hint animations to show interactivity
  useEffect(() => {
    if (showOnboarding) {
      // Start hint animations after onboarding elements are loaded
      const timer = setTimeout(() => {
        startHintAnimations();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  // Hectic animations for different slides
  useEffect(() => {
    if (showOnboarding && currentSlide === 0) {
      // First slide: Show slide hint animation after 1.5 seconds
      const timer = setTimeout(() => {
        startSlideHecticAnimation();
      }, 1500);
      return () => clearTimeout(timer);
    } else if (showOnboarding && currentSlide === 2) {
      // Last slide: Show popup drag hint animation after 1.5 seconds
      const timer = setTimeout(() => {
        startPopupHecticAnimation();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, currentSlide]);

  const startHintAnimations = () => {
    // Removed slide bounce animation for better performance
  };

  const startSlideHecticAnimation = () => {
    // Single obvious left-right animation to hint at swiping
    Animated.sequence([
      Animated.timing(slideHecticAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideHecticAnim, {
        toValue: -1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideHecticAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startPopupHecticAnimation = () => {
    // Single obvious drag down animation to show it's draggable, then auto-collapse after 20 seconds
    Animated.sequence([
      Animated.timing(popupHecticAnim, {
        toValue: 0.4, // Much larger downward movement
        duration: 350,
        useNativeDriver: false,
      }),
      Animated.spring(popupHecticAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 120,
        friction: 7,
      }),
    ]).start(() => {
      // Wait 20 seconds then auto-collapse
      setTimeout(() => {
        if (showOnboarding && currentSlide === 2) {
          // Collapse the popup
          Animated.parallel([
            Animated.spring(popupAnim, {
              toValue: 1,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(popupLayoutAnim, {
              toValue: 1,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
            })
          ]).start();
          setIsPopupCollapsed(true);
        }
      }, 20000);
    });
  };

  // PanResponder for drag
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Slightly easier requirements - still strict but more responsive
        const { dx, dy, vx, vy } = gestureState;
        const verticalMovement = Math.abs(dy);
        const horizontalMovement = Math.abs(dx);
        const verticalVelocity = Math.abs(vy);
        const horizontalVelocity = Math.abs(vx);
        
        // Require: large vertical movement, minimal horizontal, and deliberate velocity
        return verticalMovement > 60 && 
               verticalMovement > horizontalMovement * 8 && 
               verticalVelocity > horizontalVelocity * 4 &&
               verticalVelocity > 1.5 &&
               horizontalMovement < 12; // Slightly more horizontal movement allowed
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Slightly easier capture - still very deliberate but more responsive
        const { dx, dy, vx, vy } = gestureState;
        const verticalMovement = Math.abs(dy);
        const horizontalMovement = Math.abs(dx);
        const verticalVelocity = Math.abs(vy);
        const horizontalVelocity = Math.abs(vx);
        
        return verticalMovement > 80 && 
               verticalMovement > horizontalMovement * 12 && 
               verticalVelocity > horizontalVelocity * 6 &&
               verticalVelocity > 2.0 &&
               horizontalMovement < 10; // Slightly more horizontal movement allowed
      },
      onPanResponderGrant: () => {
        // Make drag feel more responsive
        popupAnim.setOffset((popupAnim as any)._value);
        popupAnim.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Make dragging lighter and more responsive
        const newValue = gestureState.dy / (SCREEN_HEIGHT * 0.8); // Reduced divisor for easier dragging
        popupAnim.setValue(newValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        popupAnim.flattenOffset();
        
        const velocity = gestureState.vy;
        const currentValue = (popupAnim as any)._value;
        
        // Make it easier to trigger state changes with lower thresholds
        let targetValue = currentValue > 0.2 ? 1 : 0; // Reduced from 0.3 to 0.2
        if (velocity > 0.3) targetValue = 1; // Reduced from 0.5 to 0.3
        if (velocity < -0.3) targetValue = 0; // Reduced from -0.5 to -0.3
        
        // Smoother and faster animation
        Animated.parallel([
          Animated.spring(popupAnim, {
            toValue: targetValue,
            useNativeDriver: false,
            tension: 100, // Higher tension for snappier feel
            friction: 8,  // Lower friction for smoother movement
          }),
          Animated.spring(popupLayoutAnim, {
            toValue: targetValue,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          })
        ]).start();
        const willBeCollapsed = targetValue >= 0.5;
        setIsPopupCollapsed(willBeCollapsed);
      },
    })
  ).current;

  // Interpolate popup position and height - only 100% or 45%
  const popupTop = Animated.add(
    popupLayoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.45], // 0 = top (100%), 1 = 45% (where purple area ends)
    }),
    popupHecticAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 120], // Much more obvious hectic movement
    })
  );

  const popupHeight = popupLayoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, SCREEN_HEIGHT * 0.55], // 0 = full height (100%), 1 = 55% height (matching BeliefsScreen)
  });

  const popupRadius = popupLayoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [radii.xl || 24, radii['3xl'] || 36],
  });

  // Interpolate drag handle marginTop: more when open, less when collapsed
  const dragHandleMarginTop = popupLayoutAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [STATUSBAR_HEIGHT + spacing.lg, spacing.md],
  });

  // Get text colors based on popup position
  const getTextColor = (popupValue: number) => {
    return popupValue <= 0.5 ? '#000000' : '#FFFFFF';
  };

  // Manual reset function for testing
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('mindJournalOnboardingSeen');
      
      // Optionally reload the screen
      setHasSeenOnboarding(false);
      setShowOnboarding(true);
      setIsPopupCollapsed(false);
      popupAnim.setValue(0);
      popupLayoutAnim.setValue(0);
    } catch (error) {
      // Error handling
    }
  };

  const handleAddToBeliefs = () => {
    setBeliefAdded(true);
    // Here you would typically save to your beliefs database/storage
  };

  const handleDismissBelief = () => {
    setBeliefDismissed(true);
  };



  // Create new story with AI analysis
  const createStory = async (content: string) => {
    if (!user?.id) {
      return;
    }
    
          try {
        setIsSubmitting(true);
        
        // Sanitize content only when submitting
      const sanitizedContent = sanitizeInput(content);
      
      // Validate journal text
      const validation = journalAnalysisService.validateJournalText(sanitizedContent);
      
      if (!validation.isValid) {
        return;
      }
      
      // Analyze the daydream using GPT
      setIsAnalyzing(true);
      const analysisResult = await DaydreamAnalysisService.analyzeDaydreamWithValidation(sanitizedContent);
      
      if (!analysisResult.isValid) {
        setIsAnalyzing(false);
        return;
      }
      
      const analysis = analysisResult.analysis!;
      
      // Create story with AI analysis
      const wordCount = content.trim().split(/\s+/).length;
      const timestamp = new Date().toISOString();
      
      // Prepare story data for database
      const storyData = {
        user_id: user.id,
        title: 'Daydream Analysis',
        content: content.trim(),
        word_count: wordCount,
        reading_time_minutes: Math.ceil(wordCount / 200),
        is_private: false,
        ai_sentiment_score: 0.5,
        ai_insights: {
          coreRevelation: analysis.core_revelation,
          hiddenCoreBelief: analysis.hidden_core_belief,
          emotionalTruth: analysis.emotional_truth,
          counteractingAffirmation: analysis.counteracting_affirmation,
          yourNewStory: analysis.your_new_story,
          messageForYou: analysis.message_for_you,
          tags: analysis.tags
        },
        ai_suggestions: [analysis.counteracting_affirmation],
        tags: [...analysis.tags.theme, ...analysis.tags.emotion]
      };
      
      // Save to database
      const { data: savedStory, error: dbError } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();
      
      if (dbError) {
        console.error('Database error:', dbError);
        return;
      }
      
      // Add to local state
      setStories(prev => [savedStory, ...prev]);
      
      // Clear input
      setInputText('');
      setCharacterCount(200);
      setInputValidation({ isValid: false });
      
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  // Fetch stories from database
  const fetchStories = async () => {
    if (!user?.id) return;
    
    try {
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching stories:', error);
        setStories([]);
        return;
      }
      
      setStories(stories || []);
      
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
    }
  };

  // Load stories when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchStories();
    }
  }, [isAuthenticated, user?.id]);

  const handleViewLastInsight = () => {
    
    // Set the last story as selected (first story in the array is most recent)
    const lastStory = stories[0];
    setSelectedEntry(lastStory);
    
    // First, expand the popup if it's collapsed
    if (isPopupCollapsed) {
      // Animate the popup to expand
      Animated.parallel([
        Animated.spring(popupAnim, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(popupLayoutAnim, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        })
      ]).start();
      
      setIsPopupCollapsed(false);
      
      // Immediately set entry detail to show, bypassing journal listing completely
      setShowEntryDetail(true);
      
      // Set animation values to show entry detail directly (no journal listing)
      listContainerOpacity.setValue(0);
      entryDetailOpacity.setValue(1);
      
      // Wait for popup expansion, then trigger text entrance animation
      setTimeout(() => {
        // Trigger text entrance animation
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(textScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      }, 300); // Wait for popup expansion animation
    } else {
      // Popup is already expanded, directly show the last entry detail
      setShowEntryDetail(true);
      
      // Set animation values to show entry detail directly (no journal listing)
      listContainerOpacity.setValue(0);
      entryDetailOpacity.setValue(1);
      
      // Trigger text entrance animation immediately
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  useEffect(() => {
          setEntryAnimVals(stories.map(() => new Animated.Value(0)));
      // eslint-disable-next-line
    }, [stories.length]);

  // Reset entry detail states when popup is collapsed
  useEffect(() => {
    if (isPopupCollapsed) {
      setShowEntryDetail(false);
      setSelectedEntry(null);
      setShouldAnimateEntries(false); // Ensure entries are visible
      // Reset animation values
      entryAnimVals.forEach((val) => {
        val.setValue(1); // Set to 1 to ensure visibility
      });
      // Reset container animations
      listContainerOpacity.setValue(1);
      entryDetailOpacity.setValue(0);
    } else if (!isPopupCollapsed && !showEntryDetail) {
      // When popup is expanded and not showing entry detail, ensure journal listing is visible
      setShouldAnimateEntries(false);
      listContainerOpacity.setValue(1);
      entriesTranslateY.setValue(0);
      entryAnimVals.forEach((val) => {
        val.setValue(1);
      });
    }
  }, [isPopupCollapsed, showEntryDetail, entryAnimVals]);


  return (
    <View
      style={[styles.screenContainer, { backgroundColor: '#000000' }]}
    >
      <View
        style={{ 
          height: SCREEN_HEIGHT * 0.45, 
          padding: 0, 
          margin: 0,
          backgroundColor: colors.primary,
          borderBottomLeftRadius: radii.lg,
          borderBottomRightRadius: radii.lg,
        }}
      >
        {/* Date and Number Display */}
        <View 
          style={[styles.dateContainer, { opacity: 1 }]}
          pointerEvents="none"
        >
          <View style={styles.numberContainer}>
            <Text style={[styles.numberText, { 
              color: isPopupCollapsed ? '#FFFFFF' : '#000000',
              opacity: isPopupCollapsed ? 1 : 0,
            }]}>{characterCount}</Text>
            <Text style={[styles.numberTextSmall, { 
              color: isPopupCollapsed ? '#FFFFFF' : '#000000',
              opacity: isPopupCollapsed ? 1 : 0,
            }]}>/200</Text>
          </View>
          <View style={styles.dateTextContainer}>
            <Text style={[styles.monthText, { 
              color: isPopupCollapsed ? '#FFFFFF' : '#000000',
            }]}>{currentMonth} {currentDate.getDate()}</Text>
            <Text style={[styles.dayText, { 
              color: isPopupCollapsed ? '#FFFFFF' : '#000000',
            }]}>{currentDay}</Text>
          </View>
        </View>

      {/* Input Field */}
      <View 
        style={[styles.inputContainer, { 
          opacity: 1
        }]}
        pointerEvents="auto"
      >
        <TextInput
          style={[styles.input, { 
            color: colors.textLight,
            fontSize: 24
          }]}
          placeholder="What were you just imagining? Describe a scenario playing out in your mind..."
          placeholderTextColor={colors.textLight}
          value={inputText}
          onChangeText={(text) => {
            // Don't sanitize during typing to allow spaces
            setInputText(text);
            setCharacterCount(200 - text.length);
            
            // Simple validation without sanitization
            if (text.length === 0) {
              setInputValidation({ isValid: false });
            } else if (text.length < 60) {
              setInputValidation({ isValid: false, error: 'Please provide more detail (at least 60 characters)' });
            } else if (text.length > 200) {
              setInputValidation({ isValid: false, error: 'Please keep it under 200 characters' });
            } else {
              setInputValidation({ isValid: true });
            }
          }}
          multiline
          textAlignVertical="top"
          maxLength={200}
          onFocus={() => {
            setIsKeyboardOpen(true);
          }}
          onBlur={() => {
            setIsKeyboardOpen(false);
          }}
          autoFocus={false}
          editable={true}
          selectTextOnFocus={false}
        />
        
        <Pressable
          style={({ pressed }) => [
            styles.exploreButton,
            !inputValidation.isValid && { opacity: 0.5 },
            pressed && { opacity: 0.8 }
          ]}
          onPress={() => {
            console.log('Button pressed!');
            console.log('Input validation:', inputValidation);
            console.log('Is submitting:', isSubmitting);
            console.log('Is analyzing:', isAnalyzing);
            console.log('Input text length:', inputText.length);
            
            if (inputValidation.isValid && !isSubmitting && !isAnalyzing) {
              console.log('Creating story...');
              createStory(inputText);
            } else {
              console.log('Button press blocked:', {
                isValid: inputValidation.isValid,
                isSubmitting,
                isAnalyzing,
                error: inputValidation.error
              });
            }
          }}
          disabled={!inputValidation.isValid || isSubmitting || isAnalyzing}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {(isAnalyzing || isSubmitting) && (
              <SoundWaveSpinner 
                size="small" 
                color="#FFFFFF" 
                style={{ marginRight: 8 }}
                isActive={true}
              />
            )}
                          <Text style={styles.exploreButtonText}>
                {isAnalyzing ? 'Discovering Insights...' : isSubmitting ? 'Saving...' : 'Explore My Story'}
              </Text>
          </View>
        </Pressable>
        

      </View>

      {/* Keyboard dismiss area - only active when keyboard is open */}
      {isKeyboardOpen && (
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setIsKeyboardOpen(false);
        }}>
          <View style={[styles.keyboardDismissArea, {
            top: STATUSBAR_HEIGHT + spacing.xl + spacing.lg + 200, // Start below input area
            height: '100%',
            width: '100%',
            position: 'absolute',
            zIndex: 200,
          }]} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View 
        style={[
          styles.popup,
          {
            top: popupTop,
            height: popupHeight,
            borderTopLeftRadius: radii.lg,
            borderTopRightRadius: radii.lg,
            marginTop: spacing.xs,
          },
        ]} 
        {...panResponder.panHandlers}
      >
      <Animated.View 
        style={[
            styles.dragHandle, 
            { 
              marginTop: dragHandleMarginTop
            }
          ]} 
        />
        
        {/* Keyboard dismiss area inside popup */}
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setIsKeyboardOpen(false);
        }}>
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            pointerEvents: isKeyboardOpen ? 'auto' : 'none',
          }} />
        </TouchableWithoutFeedback>
        
        {/* Header */}
        <View 
          style={styles.headerContainer}
        >

      {!isPopupCollapsed && (
        <View 
          style={{
            position: 'absolute',
            left: spacing.xl,
            top: -spacing.md,
            zIndex: 10,
          }}
        >
          <Pressable
            onPress={() => {
              if (showEntryDetail) {
                                // Smooth reverse animation with staggered entries
                Animated.sequence([
                  // First: Fade out the entry detail
                  Animated.timing(entryDetailOpacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                  // Then: Fade in the list container
                  Animated.parallel([
                    Animated.timing(listContainerOpacity, {
                      toValue: 1,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                    Animated.timing(entriesTranslateY, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    })
                  ])
                ]).start(() => {
                  setShowEntryDetail(false);
                  setSelectedEntry(null);
                  setCurrentInsightIndex(0);
                  
                  // Reset text animations
                  textOpacity.setValue(0);
                  textTranslateY.setValue(30);
                  textScale.setValue(0.95);
                  
                  // Trigger staggered entry animations
                  setShouldAnimateEntries(true);
                  entryAnimVals.forEach((val, index) => {
                    val.setValue(0);
                    Animated.timing(val, {
                      toValue: 1,
                      duration: 300,
                      delay: index * 80, // Stagger each entry by 80ms
                      useNativeDriver: true,
                    }).start();
                  });
                  
                  // Ensure list container is visible
                  listContainerOpacity.setValue(1);
                  entriesTranslateY.setValue(0);
                });
              } else {
                setShowOnboarding((prev) => !prev);
              }
            }}
            onLongPress={resetOnboarding}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.stylishArrowButton}
          >
            {showEntryDetail ? (
              <Text style={[styles.stylishArrow, { color: colors.primary }]}>
                ←
              </Text>
            ) : (
              <Feather 
                name="info" 
                size={28} 
                color={showOnboarding ? colors.primary : colors.textSecondary} 
              />
            )}
          </Pressable>
        </View>
      )}
          <Text style={styles.headerTitle}>{isPopupCollapsed ? 'My Stories' : (showEntryDetail ? 'Insight Journal' : 'Dreamscape')}</Text>
        </View>
        
        {showOnboarding && !isPopupCollapsed && animationReady ? (
          <View style={styles.onboardingContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              style={styles.popupScrollView}
              data={slides}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item: slide, index }) => (
                <Animated.View 
                  style={[
                    styles.slideContainer,
                    index === 0 && {
                      transform: [
                        {
                          translateX: slideHecticAnim.interpolate({
                            inputRange: [-1, 0, 1],
                            outputRange: [-35, 0, 35], // Much more obvious left-right movement hint
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <View style={styles.welcomeContent}>
                    <StaggeredEntryContainer
                      key={`onboarding-title-${animationKey}`}
                      startDelay={200}
                      delayIncrement={0}
                      animationTypes={['fade-slide-bottom']}
                    >
                      <Text style={styles.welcomeTitle}>
                        {slide.title}
                      </Text>
                    </StaggeredEntryContainer>
                    <StaggeredEntryContainer
                      key={`onboarding-subtitle-${animationKey}`}
                      startDelay={300}
                      delayIncrement={0}
                      animationTypes={['fade-slide-bottom']}
                    >
                      <Text style={styles.welcomeSubtitle}>
                        {slide.subtitle}
                      </Text>
                    </StaggeredEntryContainer>
                  </View>
                </Animated.View>
              )}
              onMomentumScrollEnd={handleScrollEnd}
              ref={scrollViewRef}
              scrollEnabled={true}
              directionalLockEnabled={true}
              decelerationRate="fast"
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              removeClippedSubviews={false}
              maxToRenderPerBatch={3}
              windowSize={3}
            />
            
            {/* Pagination and Navigation Row */}
            <StaggeredEntryContainer
              key={`onboarding-pagination-${animationKey}`}
              startDelay={400}
              delayIncrement={0}
              animationTypes={['fade-slide-left']}
            >
              <View style={styles.paginationRow}>
                <Pressable onPress={goToPrevSlide} style={styles.navButton}>
                  <Feather name="chevron-left" size={28} color={colors.primary} />
                </Pressable>
                
                <View style={styles.paginationDots}>
                  {slides.map((_, index) => (
                    <View
                      key={`dot-${index}-${currentSlide}`}
                      style={[
                        styles.paginationDot,
                        index === currentSlide && styles.paginationDotActive
                      ]}
                    />
                  ))}
                </View>
                
                <Pressable onPress={goToNextSlide} style={styles.navButton}>
                  <Feather name="chevron-right" size={28} color={colors.primary} />
                </Pressable>
              </View>
            </StaggeredEntryContainer>
          
            {/* Fact Box */}
            <StaggeredEntryContainer
              key={`onboarding-factbox-${animationKey}`}
              startDelay={600}
              delayIncrement={0}
              animationTypes={['fade-slide-right']}
            >
              <View style={styles.factBoxContainer}>
                <Text style={styles.factBoxText} key={`fact-${currentSlide}`}>
                  {slides[currentSlide].factBox.text}
                </Text>
              </View>
            </StaggeredEntryContainer>
          </View>
        ) : isPopupCollapsed && animationReady && !isAnimatingOut ? (
          stories.length > 0 ? (
            <View style={styles.collapsedPreviewContainer}>
              <View style={styles.collapsedPreview}>
                <View style={styles.collapsedPreviewHeader}>
                  <Text style={styles.collapsedPreviewTitle}></Text>
                </View>
                
                <View style={styles.collapsedPreviewContent}>
                  <Text style={styles.collapsedPreviewText}>
                    "{limitToWords(stories[0].content, 35)}"
                  </Text>
                </View>
                
                <View style={styles.collapsedPreviewFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      {
                        backgroundColor: 'transparent',
                        borderRadius: 16,
                        paddingVertical: 16,
                        paddingHorizontal: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.primary,
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                        marginBottom: spacing.xs,
                      },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={handleViewLastInsight}
                  >
                    <Text style={[styles.collapsedPreviewInsightsTitle, {
                      color: colors.primary,
                      fontSize: 16,
                      fontFamily: 'Poppins-SemiBold',
                      fontWeight: '600',
                      letterSpacing: 0.3,
                    }]}>
                      View Last Insight
                    </Text>
                  </Pressable>
                    </View>
              </View>
            </View>
          ) : (
            <View style={styles.collapsedEmptyState}>
              <Text style={styles.collapsedEmptyTitle}>Your Inner World is waiting.</Text>
              <Text style={styles.collapsedEmptySubtitle}>
                Log your first daydream to begin your journey of discovery.
                  </Text>
            </View>
          )
        ) : !isPopupCollapsed && showEntryDetail && selectedEntry ? (
          <Animated.View 
            style={[
              {
                flex: 1,
                backgroundColor: 'transparent',
                borderRadius: 0,
                margin: 0,
                shadowColor: 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
                overflow: 'hidden',
                opacity: entryDetailOpacity
              }
            ]}
          >

            {showEntryDetail && selectedEntry && (
              <ScrollView 
                style={{
                  flex: 1,
                  margin: 0,
                  padding: 0,
                  backgroundColor: '#000000'
                }}
                contentContainerStyle={{ 
                  paddingBottom: spacing['2xl'],
                  paddingHorizontal: 0,
                  marginHorizontal: 0,
                  width: '100%',
                  marginLeft: 0,
                  marginRight: 0,
                  left: 0,
                  right: 0
                }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                scrollEventThrottle={16}
              >
                <View style={{ 
                  backgroundColor: '#000000',
                  width: '100%',
                  marginHorizontal: 0,
                  paddingHorizontal: 0,
                  marginLeft: 0,
                  marginRight: 0,
                  flex: 1,
                  justifyContent: 'flex-start',
                  alignSelf: 'stretch',
                  paddingBottom: spacing['2xl']
                }}>
                  <View style={{ 
                    width: '100%',
                    marginHorizontal: 0,
                    paddingHorizontal: 0,
                    backgroundColor: '#000000',
                    borderRadius: 0,
                    padding: 0,
                    borderWidth: 0,
                    shadowColor: 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0,
                    shadowRadius: 0,
                    elevation: 0
                  }}>
                    {/* What you wrote - InfoContainer Card */}
                                         <View style={[styles.insightsCardContainer, { backgroundColor: colors.background, marginTop: spacing.xs, alignSelf: 'center' }]}>
                       <View style={styles.insightsContentContainer}>
                         <View style={styles.insightsTextContainer}>
                           <Text style={[styles.insightsTitle, { color: colors.textPrimary }]}>Your Inner Story</Text>
                           <Text style={[styles.insightsText, { color: colors.textPrimary }]}>
                             {isTextExpanded ? (
                               <>
                                 {selectedEntry.content}
                                 {selectedEntry.content.split(' ').length > 35 && (
                                   <Text 
                                     style={{ color: colors.primary, fontWeight: 'bold' }}
                                     onPress={() => setIsTextExpanded(!isTextExpanded)}
                                     suppressHighlighting={true}
                                   > Show less</Text>
                                 )}
                               </>
                             ) : (
                               <>
                                 {limitToWords(selectedEntry.content, 35)}
                                 {selectedEntry.content.split(' ').length > 35 && (
                                   <Text 
                                     style={{ color: colors.primary, fontWeight: 'bold' }}
                                     onPress={() => setIsTextExpanded(!isTextExpanded)}
                                     suppressHighlighting={true}
                                   > Read more</Text>
                                 )}
                               </>
                             )}
                           </Text>
                           
                           <Text style={[styles.insightsText, { color: colors.primary, fontWeight: 'bold', marginTop: spacing.sm }]}>
                             Uncovered Insights
                           </Text>
                           
                           <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs }}>
                             {selectedEntry.ai_insights?.tags?.theme?.map((tag: string, index: number) => (
                               <View key={`theme-${index}`} style={[styles.insightsTag, { backgroundColor: colors.primary, marginRight: spacing.xs, marginBottom: spacing.xs }]}>
                                 <Text style={[styles.insightsTagText, { color: colors.textLight }]}>{tag}</Text>
                               </View>
                             ))}
                             {selectedEntry.ai_insights?.tags?.emotion?.map((tag: string, index: number) => (
                               <View key={`emotion-${index}`} style={[styles.insightsTag, { backgroundColor: colors.primary, marginRight: spacing.xs, marginBottom: spacing.xs }]}>
                                 <Text style={[styles.insightsTagText, { color: colors.textLight }]}>{tag}</Text>
                               </View>
                             ))}
                             {selectedEntry.ai_insights?.tags?.symbols?.map((tag: string, index: number) => (
                               <View key={`symbol-${index}`} style={[styles.insightsTag, { backgroundColor: colors.primary, marginRight: spacing.xs, marginBottom: spacing.xs }]}>
                                 <Text style={[styles.insightsTagText, { color: colors.textLight }]}>{tag}</Text>
                               </View>
                             ))}
                           </View>
                         </View>
                       </View>
                       

                     </View>
                      
                                              {/* Hidden Core Belief - Custom Card */}
                      {getHiddenCoreBelief(selectedEntry) && !beliefDismissed ? (
                        <View style={styles.hiddenBeliefCard}>
                          <View style={styles.hiddenBeliefContent}>
                            <Text style={styles.hiddenBeliefTitle}>Hidden Core Belief</Text>
                            <View style={styles.hiddenBeliefContainer}>
                              <Text style={styles.hiddenBeliefText}>
                                {getHiddenCoreBelief(selectedEntry)}
                              </Text>
                            </View>
                            <View style={styles.hiddenBeliefButtonContainer}>
                              <Pressable style={styles.hiddenBeliefButton} onPress={handleAddToBeliefs}>
                                <Text style={styles.hiddenBeliefButtonText}>Add to Beliefs</Text>
                              </Pressable>
                              <Pressable style={styles.hiddenBeliefSecondaryButton} onPress={handleDismissBelief}>
                                <Text style={styles.hiddenBeliefSecondaryButtonText}>Dismiss</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.hiddenBeliefCard}>
                          <View style={styles.hiddenBeliefContent}>
                            <Text style={styles.hiddenBeliefTitle}>Hidden Core Belief</Text>
                            <View style={styles.hiddenBeliefContainer}>
                              <Text style={styles.hiddenBeliefText}>
                                We couldn't detect a belief this time — but that's okay. Keep writing, and more will unfold.
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                        
                        {/* What Your Daydream Reveals - InfoContainer Card */}
                                                 {selectedEntry.ai_insights?.hiddenDesireFear ? (
                           <InfoContainer
                             title="What Your Daydream Reveals"
                             text={selectedEntry.ai_insights.hiddenDesireFear}
                             backgroundColor={colors.background}
                             textColor={colors.textPrimary}
                             style={{ alignSelf: 'center' }}
                           />
                        ) : (
                                                     <InfoContainer
                             title="What Your Daydream Reveals"
                             text="No specific insight this time — but expressing your thoughts is still powerful."
                             backgroundColor={colors.background}
                             textColor={colors.textPrimary}
                             style={{ 
                               marginBottom: spacing.xs,
                               borderRadius: radii.lg,
                               alignSelf: 'center',
                               width: '100%'
                             }}
                           />
                        )}
                        
                        {/* Core Revelation */}
                        <InfoContainer
                          title="Core Revelation"
                          text={selectedEntry.ai_insights?.coreRevelation || selectedEntry.ai_insights?.hiddenBelief || "Your daydream reveals deep insights about your inner world."}
                          backgroundColor={colors.background}
                          textColor={colors.textPrimary}
                          style={{ 
                            marginBottom: spacing.xs,
                            borderRadius: radii.lg,
                            alignSelf: 'center',
                            width: '100%'
                          }}
                        />

                        {/* Emotional Truth */}
                        <InfoContainer
                          title="Emotional Truth"
                          text={selectedEntry.ai_insights?.emotionalTruth || selectedEntry.ai_insights?.emotionalInsight || "Your emotions are revealing important truths about your current state."}
                          backgroundColor={colors.background}
                          textColor={colors.textPrimary}
                          style={{ 
                            marginBottom: spacing.xs,
                            borderRadius: radii.lg,
                            alignSelf: 'center',
                            width: '100%'
                          }}
                        />

                        {/* Your New Story */}
                        <InfoContainer
                          title="Your New Story"
                          text={selectedEntry.ai_insights?.yourNewStory || selectedEntry.ai_insights?.alternativeNarrative || "A new narrative is emerging for you to embrace."}
                          backgroundColor={colors.background}
                          textColor={colors.textPrimary}
                          style={{ 
                            marginBottom: spacing.lg,
                            borderRadius: radii.lg,
                            alignSelf: 'center',
                            width: '100%'
                          }}
                        />


                      </View>
                  </View>
                </ScrollView>
              )}
          </Animated.View>
        ) : !isPopupCollapsed && animationReady && !isAnimatingOut && !showEntryDetail ? (
          stories.length > 0 ? (
            <Animated.View
              style={{
                opacity: listContainerOpacity,
                transform: [
                  { translateY: entriesTranslateY }
                ],
                flex: 1,
                height: '100%'
              }}
            >
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.journalScrollContent, { paddingBottom: 0, flexGrow: 1 }]}
                bounces={false}
                scrollEventThrottle={16}
                directionalLockEnabled={true}
                style={{ 
                  flex: 1,
                  backgroundColor: colors.background
                }}
              >
                                {stories.map((entry, index) => (
                  <Animated.View
                    key={`journal-entry-${animationKey}-${entry.id}`}
                    style={{
                      opacity: shouldAnimateEntries && entryAnimVals[index] 
                        ? entryAnimVals[index] 
                        : 1,
                      transform: [
                        {
                          translateY: shouldAnimateEntries && entryAnimVals[index]
                            ? entryAnimVals[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                              })
                            : 0,
                        },
                        {
                          scale: shouldAnimateEntries && entryAnimVals[index]
                            ? entryAnimVals[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.95, 1],
                              })
                            : 1,
                        }
                      ],
                    }}
                  >
                    <InfoContainer
                      title={formatDate(entry.created_at)}
                      text={limitToWords(entry.content)}
                      backgroundColor={colors.background}
                      textColor={colors.textPrimary}
                      showButton={true}
                      buttonText="Read"
                      buttonStyle="purple"
                      style={{ alignSelf: 'center' }}
                      onButtonPress={() => {
                        setSelectedEntry(entry);
                        setIsTextExpanded(false); // Reset text expansion for new entry
                        
                        // Fast, smooth transition with text animation
                        Animated.parallel([
                          // Fade out the list quickly
                          Animated.timing(listContainerOpacity, {
                            toValue: 0,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                          // Slide list up slightly
                          Animated.timing(entriesTranslateY, {
                            toValue: -15,
                            duration: 150,
                            useNativeDriver: true,
                          }),
                          // Fade in entry detail with minimal delay
                          Animated.timing(entryDetailOpacity, {
                            toValue: 1,
                            duration: 200,
                            delay: 50,
                            useNativeDriver: true,
                          })
                        ]).start(() => {
                          setShowEntryDetail(true);
                          setShouldAnimateEntries(false); // Reset animation flag
                          
                          // Trigger text entrance animation
                          Animated.parallel([
                            Animated.timing(textOpacity, {
                              toValue: 1,
                              duration: 300,
                              useNativeDriver: true,
                            }),
                            Animated.timing(textTranslateY, {
                              toValue: 0,
                              duration: 300,
                              useNativeDriver: true,
                            }),
                            Animated.timing(textScale, {
                              toValue: 1,
                              duration: 300,
                              useNativeDriver: true,
                            })
                          ]).start();
                        });
                      }}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          ) : (
            <View style={styles.journalEmptyState}>
              <Text style={styles.journalEmptyTitle}>Your Inner World is waiting.</Text>
              <Text style={styles.journalEmptySubtitle}>
                Log your first daydream to begin your journey of discovery.
              </Text>
            </View>
          )
        ) : null}
      </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#000000',
  },
  popup: {
    width: '100%',
    position: 'absolute',
    left: 0,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 24,
    overflow: 'hidden',
    zIndex: 100, // Lower than date container
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 0,
  },
  dragHandle: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.md,
    opacity: 0.8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: STATUSBAR_HEIGHT + spacing.sm,
    paddingBottom: spacing.lg,
    zIndex: 1000, // Much higher than popup to always be visible
    backgroundColor: 'transparent',
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.lg,
    backgroundColor: 'transparent',
  },
  numberText: {
    fontSize: 32,
    fontFamily: fonts.families.bold,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  numberTextSmall: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginLeft: spacing.sm,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dateTextContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  monthText: {
    fontSize: 18,
    fontFamily: fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  dayText: {
    fontSize: 16,
    fontFamily: fonts.families.medium,
    fontWeight: '500',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  inputContainer: {
    height: SCREEN_HEIGHT * 0.45 - (STATUSBAR_HEIGHT + spacing.xl + spacing.lg + 60),
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.md,
    zIndex: 50, // Lower than popup
    justifyContent: 'space-between',
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.families.regular,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    textAlignVertical: 'top',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: colors.textLight,
    minHeight: 120,
    maxHeight: SCREEN_HEIGHT * 0.3,
  },
  keyboardDismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 150, // Higher than input but lower than date container
  },
  characterCount: {
    color: '#CCCCCC',
    fontSize: 12,
    fontFamily: fonts.families.medium,
    textAlign: 'right',
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    ...components.typography.subtitle,
    textAlign: 'center',
    marginBottom: spacing['4xl'],
  },
  factBoxContainer: {
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.xl,
  },

  factBoxText: {
    ...components.typography.caption.medium,
    textAlign: 'center',
  },
  featureScrollView: {
    marginBottom: spacing['2xl'],
    width: '100%',
  },
  featureScrollContent: {
    alignItems: 'center',
  },
  featureSlide: {
    width: Dimensions.get('window').width - (spacing.xl * 4),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 22,
    fontFamily: fonts.families.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  featureDescription: {
    ...components.typography.caption.medium,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 20,
    fontFamily: fonts.families.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  ctaSubtext: {
    fontSize: 16,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  popupScrollView: {
    flex: 1,
  },
  popupScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  onboardingContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingBottom: 120,
  },
  carouselNavigation: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
    transform: [{ scale: 1.1 }],
  },

  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 80,
    paddingVertical: spacing.lg,
  },
  headerContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
  },
  headerIcon: {
    position: 'absolute',
    left: spacing.xl,
    top: '50%',
    transform: [{ translateY: -12 }], // Half of icon height (24/2)
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  journalContent: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: spacing.xl,
    paddingHorizontal: 0,
  },
  journalTitle: {
    fontSize: 28,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  journalList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noJournalsText: {
    fontSize: 18,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
  journalScrollContent: {
    paddingBottom: 0,
    paddingTop: spacing.xl  , // Add padding to account for date and input area
  },
  journalEntry: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  entryContent: {
    marginBottom: 16,
    position: 'relative',
  },
  entryTitle: {
    fontSize: 18,
    fontFamily: fonts.families.bold,
    color: '#1A1A2E',
    marginBottom: 12,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  entryPreview: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: '#4A5568',
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeButtonText: {
    fontSize: 14,
    fontFamily: fonts.families.bold,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  wordCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  wordCount: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
    opacity: 0.7,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.families.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: fonts.families.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  analyzeButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  entryDetailContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 20,
    margin: spacing.md,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  entryDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  entryDetailTitle: {
    fontSize: 18,
    fontFamily: fonts.families.semiBold,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  entryDetailScroll: {
    flex: 1,
  },
  entryDetailContent: {
    padding: spacing.xl,
  },
  entryDetailDate: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  entryDetailMainTitle: {
    fontSize: 24,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: 32,
  },
  entryDetailText: {
    fontSize: 16,
    fontFamily: fonts.families.regular,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  collapsedPreviewContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-start',
  },
  collapsedPreview: {
    backgroundColor: colors.background,
    borderRadius: 0,
    padding: spacing.xs,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.08)',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: '100%',
  },
  collapsedPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  collapsedPreviewTitle: {
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    color: '#2D3748',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  collapsedPreviewTag: {
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0,
  },
  collapsedPreviewTagText: {
    fontSize: 12,
    fontFamily: fonts.families.semiBold,
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  collapsedPreviewContent: {
    marginBottom: spacing.md,
  },
  collapsedPreviewText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: '#4A5568',
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  collapsedPreviewFooter: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  collapsedPreviewInsightsTitle: {
    fontSize: 14,
    fontFamily: fonts.families.semiBold,
    color: '#2D3748',
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  collapsedPreviewRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  collapsedPreviewBeliefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  collapsedPreviewBeliefLabel: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  collapsedPreviewTimestamp: {
    fontSize: 14,
    fontFamily: fonts.families.semiBold,
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  collapsedPreviewBelief: {
    fontSize: 15,
    fontFamily: fonts.families.semiBold,
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // New styles for redesigned entry detail screen
  stylishArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylishArrow: {
    fontSize: 20,
    fontWeight: '600',
    transform: [{ rotate: '0deg' }],
  },
  entryDetailScrollContent: {
    paddingBottom: spacing['4xl'],
  },
  journalEntrySection: {
    marginBottom: spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  journalCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 0,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    borderWidth: 0,
    marginBottom: spacing.lg,
  },
  journalText: {
    fontSize: 16,
    fontFamily: fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  insightsSection: {
    paddingHorizontal: spacing.xl,
  },
  insightBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 0,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  insightLabel: {
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  insightContent: {
    fontSize: 15,
    fontFamily: fonts.families.regular,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  addBeliefButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 0,
  },
  addBeliefIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    color: colors.primary,
  },
  addBeliefText: {
    fontSize: 14,
    fontFamily: fonts.families.semiBold,
    color: colors.primary,
    fontWeight: '600',
  },
  microCopy: {
    fontSize: 12,
    fontFamily: fonts.families.regular,
    color: colors.textTertiary,
    lineHeight: 16,
    opacity: 0.7,
  },
  affirmationBubble: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  affirmationText: {
    fontSize: 16,
    fontFamily: fonts.families.medium,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 0,
  },
  regenerateIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    color: colors.primary,
  },
  regenerateText: {
    fontSize: 14,
    fontFamily: fonts.families.semiBold,
    color: colors.primary,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emotionalTag: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 0,
  },
  tagText: {
    fontSize: 13,
    fontFamily: fonts.families.medium,
    color: colors.primary,
    fontWeight: '500',
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    marginTop: spacing['2xl'],
  },
  backArrow: {
    fontSize: 20,
    color: colors.textPrimary,
    marginRight: spacing.md,
    fontWeight: '600',
  },
  backToListText: {
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  
  // New flat design styles
  purpleDivider: {
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: spacing.xl,
    marginHorizontal: spacing.xl,
  },
  sliderNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  navDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  activeDot: {
    backgroundColor: colors.primary,
  },
  sliderContent: {
    minHeight: 200,
    paddingHorizontal: spacing.xl,
  },
  affirmationContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 0,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  
  // New slider styles
  sliderScrollView: {
    flex: 1,
  },
  sliderScrollContent: {
    alignItems: 'stretch',
  },
  sliderSlide: {
    width: Dimensions.get('window').width - (spacing.xl * 2),
    paddingHorizontal: spacing.xl,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    minHeight: 200,
    justifyContent: 'center',
  },
  beliefQuote: {
    backgroundColor: '#F8F9FA',
    padding: spacing.lg,
    marginVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  beliefText: {
    fontSize: 16,
    fontFamily: fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    paddingTop: spacing.xs,
    paddingBottom: spacing['5xl'],
  },
  

  // Entry detail meta styles
  entryDetailMetaContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  entryDetailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  entryDetailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  entryDetailMetaText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Simple text container styles
  simpleTextContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
  },
  simpleText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: fonts.families.regular,
    lineHeight: 32,
    textAlign: 'left',
  },

  arrowContainer: {
    position: 'absolute',
    bottom: spacing['8xl'],
    right: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  readMoreButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  // Hidden Belief Section Styles
  hiddenBeliefSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.3)',
  },
  hiddenBeliefHeader: {
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    color: '#2D3748',
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: spacing.md,
  },
  beliefContent: {
    gap: 0, // Remove gap since we're using explicit margins
  },
  beliefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  addBeliefButtonText: {
    fontSize: 12,
    fontFamily: fonts.families.semiBold,
    color: colors.primary,
    fontWeight: '600',
  },
  beliefMicrocopy: {
    fontSize: 12,
    fontFamily: fonts.families.regular,
    color: colors.textTertiary,
    lineHeight: 16,
    opacity: 0.7,
  },
  beliefEmptyState: {
    paddingVertical: spacing.md,
  },
  beliefEmptyText: {
    fontSize: 14,
    fontFamily: fonts.families.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // What This Reveals Section Styles
  revealSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.3)',
  },
  revealHeader: {
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    color: '#2D3748',
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: spacing.md,
  },
  revealContent: {
    gap: 0, // Remove gap since we're using explicit margins
  },
  revealText: {
    fontSize: 15,
    fontFamily: fonts.families.regular,
    color: '#2D3748',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  revealMicrocopy: {
    fontSize: 12,
    fontFamily: fonts.families.regular,
    color: colors.textTertiary,
    lineHeight: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  revealEmptyState: {
    paddingVertical: spacing.md,
  },
  revealEmptyText: {
    fontSize: 14,
    fontFamily: fonts.families.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // Affirmation Section Styles
  sectionContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.3)',
  },

  affirmationContent: {
    gap: 0,
  },
  affirmationCard: {
    // Styles applied inline
  },

  regenerateButtonText: {
    // Styles applied inline
  },
  affirmationMicrocopy: {
    // Styles applied inline
  },
  emptyAffirmationCard: {
    // Styles applied inline
  },
  emptyAffirmationText: {
    // Styles applied inline
  },
  emptyAffirmationQuote: {
    // Styles applied inline
  },
  
  // Button Container and Button Styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButton: {
    // Styles applied inline
  },
  primaryButtonText: {
    // Styles applied inline
  },
  secondaryButton: {
    // Styles applied inline
  },
  secondaryButtonText: {
    // Styles applied inline
  },
  validationText: {
    // Styles applied inline
  },
  collapsedEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  collapsedEmptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  collapsedEmptyTitle: {
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.2,
    width: '100%',
    alignSelf: 'center',
  },
  collapsedEmptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.families.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
    letterSpacing: 0.1,
    width: '100%',
    alignSelf: 'center',
  },
  journalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 0,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  journalEmptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  journalEmptyTitle: {
    fontSize: 20,
    fontFamily: fonts.families.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.2,
    width: '100%',
    alignSelf: 'center',
  },
  journalEmptySubtitle: {
    fontSize: 16,
    fontFamily: fonts.families.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    letterSpacing: 0.1,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  collapsedLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  
  // Custom card styles for insights
  insightsCardContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.primary,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    marginHorizontal: spacing.xs,
  },
  insightsContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightsTextContainer: {
    flex: 1,
    marginRight: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  insightsTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  insightsText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: '#4A5568',
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  insightsTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  insightsTagText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
  },
                  insightsTransparentButton: {
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  borderRadius: radii.lg,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.xl,
                  width: 250,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                  insightsTransparentButtonText: {
                  fontSize: theme.foundations.fonts.sizes.base,
                  fontFamily: theme.foundations.fonts.families.semiBold,
                  color: colors.primary,
                },
  collapsedLoadingText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  analysisProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 20,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  analysisProgressText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.primary,
    marginLeft: spacing.sm,
    textAlign: 'center',
  },
  
  // Hidden Core Belief Card Styles (matching BeliefCard.tsx)
  hiddenBeliefCard: {
    width: '100%',
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  hiddenBeliefContent: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'visible',
  },
  hiddenBeliefTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  hiddenBeliefContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 0,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  hiddenBeliefText: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.regular,
    color: colors.textLight,
    textAlign: 'center',
  },
  hiddenBeliefButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  hiddenBeliefButton: {
    borderWidth: 1,
    borderColor: colors.textLight,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    marginBottom: spacing.sm,
  },
  hiddenBeliefButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  hiddenBeliefSecondaryButton: {
    borderWidth: 1,
    borderColor: colors.textLight,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  hiddenBeliefSecondaryButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

}); 