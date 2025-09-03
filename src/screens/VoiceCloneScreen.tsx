import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Animated as RNAnimated } from 'react-native';
import { theme, ScreenWrapper } from '../constants';
import { guidedVoiceCloneService, type GuidedPassage, type VoiceCloneResult } from '../services/guidedVoiceCloneService';
import { VOICE_CLONE_PROGRESS_KEY } from '../constants';
import { secureElevenLabsService } from '../services/secureElevenLabsService';
import { supabase } from '../lib/supabase';
import VoicePreviewPlayer from '../components/VoicePreviewPlayer';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, withDelay, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNotification } from '../contexts/NotificationContext';
import { requestMicrophonePermission } from '../utils/audioPermissions';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';

const { width, height } = Dimensions.get('window');
const { foundations, components, utils } = theme;

const Colors = {
  primary: foundations.colors.primary,
  gradientStart: foundations.colors.gradientStart,
}

// Default passage - will be replaced by API data
const DEFAULT_PASSAGE = {
  text: "Hey there, I'm {{name}}.\n\nI'm just taking a moment to slow down and breathe.\nLife can get pretty crazy sometimes, but today I'm choosing to stay calm,\ntrust myself, and focus on what really matters.\n\nI know good things are coming.\nI don't have to figure it all out at once — I can take my time,\nenjoy the small wins, and keep moving forward.\n\nFeels pretty good, honestly.\nOne step at a time — I've got this.",
  totalWords: 67,
  estimatedDuration: 45
};

type VoiceCloneScreenProps = {
  navigation?: NativeStackNavigationProp<RootStackParamList>;
  onComplete?: () => void;
  onBack?: () => void;
  userData?: any;
};

type ScreenStep = 'instructions' | 'recording' | 'completed';

interface RecordingState {
  currentStep: 'instructions' | 'recording' | 'completed';
  currentWordIndex: number;
  progress: number;
  isProcessing: boolean;
  isCompleted: boolean;
  isRecording: boolean;
  recordingUri?: string;
}

const initialRecordingState: RecordingState = {
  currentStep: 'instructions',
  currentWordIndex: -1,
  progress: 0,
  isProcessing: false,
  isCompleted: false,
  isRecording: false
};

interface VoiceCloneRequest {
  name: string;
  description?: string;
  audioFile: { uri: string };
}

// Move the formatted words logic outside the component to avoid recalculating on every render
const formatPassageText = (text: string) => {
  const textWithBreaks = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return textWithBreaks.reduce((acc, line) => {
    // Split by spaces but preserve special characters
    const lineWords = line.split(' ').map(word => ({
      text: word,
      isLineBreak: false,
      isSpecialChar: /^[.,!?—\-]+$/.test(word)
    }));
    return [...acc, ...lineWords, { text: '\n', isLineBreak: true, isSpecialChar: false }];
  }, [] as Array<{ text: string; isLineBreak: boolean; isSpecialChar: boolean }>);
};

// Animation for main content and button (instructions step only)
const useEntryAnimation = () => {
  const mainOpacity = useSharedValue(0);
  const mainTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  React.useEffect(() => {
    mainOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    mainTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
    buttonOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    buttonTranslateY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, []);

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mainOpacity.value,
    transform: [{ translateY: mainTranslateY.value }],
  }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));
  return { mainAnimatedStyle, buttonAnimatedStyle };
};

const VoiceCloneScreen = ({ navigation, onComplete, onBack, userData }: VoiceCloneScreenProps) => {
  // Animation values for instructions step
  const { mainAnimatedStyle, buttonAnimatedStyle } = useEntryAnimation();

  // Hooks
  const { showNotification } = useNotification();

  // State hooks at the top level - all hooks must be called unconditionally
  const [passages, setPassages] = useState<GuidedPassage[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>(initialRecordingState);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [voiceCloneResult, setVoiceCloneResult] = useState<VoiceCloneResult | null>(null);
  const [previewAudio, setPreviewAudio] = useState<{ url: string; duration: number } | null>(null);
  const [userName, setUserName] = useState<string>('');

  
  // Refs - these are stable between renders
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Memoized values - these are derived from state/props and won't cause re-renders if inputs don't change
  const currentPassage = useMemo(() => {
    const passage = passages[currentPassageIndex] || DEFAULT_PASSAGE;
    
    // Replace {{name}} placeholder with actual user name
    if (passage.text && userName) {
      const personalizedText = passage.text.replace(/\{\{name\}\}/g, userName);
      return {
        ...passage,
        text: personalizedText
      };
    }
    
    return passage;
  }, [passages, currentPassageIndex, userName]);
  
  const formattedWords = useMemo(() => formatPassageText(currentPassage.text), [currentPassage.text]);
  
  // Animation values - created once and reused
  const waveformHeights = useMemo(() => 
    Array(5).fill(0).map(() => new RNAnimated.Value(15)),
    []
  );





  const [isRecognitionActive, setIsRecognitionActive] = useState(false);

  // Create refs to access current state values in the Voice handlers
  const formattedWordsRef = useRef(formattedWords);
  const recordingStateRef = useRef(recordingState);
  const setRecordingStateRef = useRef(setRecordingState);
  const setIsRecognitionActiveRef = useRef(setIsRecognitionActive);
  const showNotificationRef = useRef(showNotification);

  // Update refs when values change
  useEffect(() => {
    formattedWordsRef.current = formattedWords;
  }, [formattedWords]);

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  useEffect(() => {
    setRecordingStateRef.current = setRecordingState;
  }, []);

  useEffect(() => {
    setIsRecognitionActiveRef.current = setIsRecognitionActive;
  }, []);

  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, []);

  // Move processRecognitionResults outside useEffect
  const processRecognitionResults = (spokenText: string, isPartial: boolean) => {
    // Helper function to normalize contractions
    const normalizeWord = (word: string) => {
      const contractionMap: { [key: string]: string[] } = {
        "i'm": ["i", "am"],
        "i'll": ["i", "will"],
        "i've": ["i", "have"],
        "i'd": ["i", "would", "i", "had"],
        "don't": ["do", "not"],
        "isn't": ["is", "not"],
        "it's": ["it", "is"],
        "that's": ["that", "is"],
        "there's": ["there", "is"],
        "what's": ["what", "is"],
        "where's": ["where", "is"],
        "who's": ["who", "is"],
        "won't": ["will", "not"],
        "can't": ["can", "not"],
        "cannot": ["can", "not"],
        "let's": ["let", "us"]
      };
      word = word.toLowerCase().replace(/[.,!?—]/g, '');
      return contractionMap[word] || [word];
    };
    // Split and normalize the spoken text
    const spokenWords = spokenText.toLowerCase()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => normalizeWord(word))
      .flat();
    // Get the current position in the text
    const currentIndex = recordingStateRef.current.currentWordIndex;
    const currentFormattedWords = formattedWordsRef.current;
    // Find the next matching word
    let nextMatchIndex = -1;
    let searchStartIndex = currentIndex + 1;
    let searchEndIndex = Math.min(searchStartIndex + 2, currentFormattedWords.length);
    // Try to find the next word that matches
    for (let i = 0; i < spokenWords.length; i++) {
      const spokenWord = spokenWords[i];
      // Look ahead up to 2 words from the current position
      for (let j = searchStartIndex; j < searchEndIndex; j++) {
        if (currentFormattedWords[j].isLineBreak) continue;
        const targetWord = currentFormattedWords[j].text;
        const normalizedTarget = normalizeWord(targetWord)[0];
        if (spokenWord === normalizedTarget) {
          nextMatchIndex = j;
          // Update search range for next iteration
          searchStartIndex = j + 1;
          searchEndIndex = Math.min(searchStartIndex + 2, currentFormattedWords.length);
          break;
        }
      }
    }
    // Update state if we found a match
    if (nextMatchIndex > currentIndex) {
      setRecordingStateRef.current(prev => {
        scrollToCurrentWord(nextMatchIndex);
        return {
          ...prev,
          currentWordIndex: nextMatchIndex,
          progress: (nextMatchIndex / currentFormattedWords.filter(w => !w.isLineBreak).length) * 100
        };
      });
    }
  };

  // Setup Voice event handlers function
  const setupVoiceHandlers = useCallback(() => {
    Voice.onSpeechStart = () => {
      setIsRecognitionActiveRef.current(true);
    };
    Voice.onSpeechEnd = () => {
      setIsRecognitionActiveRef.current(false);
    };
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (!e.value?.[0]) return;
      processRecognitionResults(e.value[0], true);
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (!e.value?.[0]) return;
      processRecognitionResults(e.value[0], false);
    };
    Voice.onSpeechError = (e: any) => {
      setIsRecognitionActiveRef.current(false);
      stopRecording();
    };
    Voice.onSpeechVolumeChanged = () => {
      // Silent handler to prevent warnings
    };
  }, []);

  // Register Voice event handlers only once on mount
  useEffect(() => {
    setupVoiceHandlers();
    return () => {
      Voice.destroy().then(() => {
        // cleanup
      });
      Voice.removeAllListeners();
    };
  }, [setupVoiceHandlers]); // Add setupVoiceHandlers as dependency

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      
      if (!hasPermission) {
        Alert.alert('Permission Error', 'Microphone permission is required to record your voice.');
        showNotification('Microphone permission is required to record your voice.', 'error');
        return;
      }

      await Voice.destroy();
      
      // Re-register handlers after destroying Voice
      setupVoiceHandlers();
      
      await Voice.start('en-US', {
        continuous: true,
        partialResults: true
      });
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        currentStep: 'recording',
        currentWordIndex: -1, // Start at -1 so first word gets highlighted
        progress: 0
      }));
    } catch (error) {
      console.error('[VoiceCloneScreen] startRecording: Failed to start recording:', error);
      Alert.alert('Error', `Failed to start recording: ${String(error)}`);
      // If Voice API fails, provide a fallback for development/testing
      if (__DEV__) {
        console.log('[VoiceCloneScreen] startRecording: Development fallback: Simulating recording start...');
        setRecordingState(prev => ({
          ...prev,
          isRecording: true,
          currentStep: 'recording',
          currentWordIndex: -1,
          progress: 0
        }));
        showNotification('Development mode: Voice API not available, using simulation.', 'info');
      } else {
        showNotification('Failed to start recording. Please try again.', 'error');
      }
    }
  };

  const handleStartRecording = async () => {
    console.log('[VoiceCloneScreen] handleStartRecording: Starting function');
    
    try {
      // Save progress when starting recording
      await AsyncStorage.setItem(VOICE_CLONE_PROGRESS_KEY, 'recording');
      console.log('[VoiceCloneScreen] handleStartRecording: About to call startRecording');
      await startRecording();
      console.log('[VoiceCloneScreen] handleStartRecording: startRecording completed');
    } catch (error) {
      console.error('[VoiceCloneScreen] handleStartRecording: Error:', error);
      // Clear progress on error
      await AsyncStorage.removeItem(VOICE_CLONE_PROGRESS_KEY);
      Alert.alert('Error', `Failed to start voice recording: ${String(error)}`);
      showNotification('Failed to start voice recording.', 'error');
    }
  };

  const stopRecording = async (): Promise<string | undefined> => {
    try {
      await Voice.stop();
      setIsRecognitionActive(false);
    } catch (error) {
      // handle error
    }
    return undefined;
  };



  const scrollToCurrentWord = (wordIndex: number) => {
    if (!scrollViewRef.current) return;

    // Calculate the line height and positions
    const lineHeight = 40;
    const screenHeight = Dimensions.get('window').height;
    const textAreaHeight = screenHeight * 0.5; // 50% of screen height
    const viewportMiddle = textAreaHeight / 2;
    const bufferZone = viewportMiddle * 0.95;

    // Calculate current word's position
    const wordElement = formattedWords.slice(0, wordIndex + 1);
    const lineBreaks = wordElement.filter(w => w.isLineBreak).length;
    const currentPosition = (wordIndex + lineBreaks) * lineHeight;

    // Check if we've reached the end of the text
    const nonBreakWords = formattedWords.filter(w => !w.isLineBreak);
    if (wordIndex >= nonBreakWords.length - 1) {
      handleRecordingComplete();
      return;
    }

    // Only scroll if the word is beyond the buffer zone
    if (currentPosition > bufferZone) {
      // Calculate how much we need to scroll to keep the current word at 70% of the viewport
      const targetPosition = viewportMiddle * 0.7;
      const desiredScrollPosition = currentPosition - targetPosition;
      
      // Simple scroll to position without tracking current scroll position
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, desiredScrollPosition),
          animated: true
        });
      });
    }
  };

  useEffect(() => {
    let animations: RNAnimated.CompositeAnimation[] = [];

    if (recordingState.isProcessing) {
      // Animate each bar in sequence
      animations = waveformHeights.map((height, index) => {
        return RNAnimated.sequence([
          RNAnimated.delay(index * 100),
          RNAnimated.loop(
            RNAnimated.sequence([
              RNAnimated.timing(height, {
                toValue: 30,
                duration: 500,
                useNativeDriver: false
              }),
              RNAnimated.timing(height, {
                toValue: 15,
                duration: 500,
                useNativeDriver: false
              })
            ])
          )
        ]);
      });

      RNAnimated.parallel(animations).start();
    }

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [recordingState.isProcessing, waveformHeights]);

  const handleSkip = async () => {
    try {
      // Check if this is an offline demo user
      const isOfflineDemo = await AsyncStorage.getItem('@is_offline_demo');
      
      if (isOfflineDemo === 'true') {
        // Set demo audio for offline users and show completion screen
        setPreviewAudio({
          url: 'demo-audio-url',
          duration: 30
        });
        
        setRecordingState(prevState => ({
          ...prevState,
          currentStep: 'completed',
          isProcessing: false,
          isCompleted: true
        }));
        
        return;
      }
      
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Try to get stored test user credentials
        const testEmail = await AsyncStorage.getItem('@test_user_email');
        const testPassword = await AsyncStorage.getItem('@test_user_password');
        
        if (testEmail && testPassword) {
          // Try to get stored test user credentials
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
          });
          
          if (signInError) {
            // Proceed with demo flow for test users even without session
            setPreviewAudio({
              url: 'demo-audio-url',
              duration: 30
            });
            
            setRecordingState(prevState => ({
              ...prevState,
              currentStep: 'completed',
              isProcessing: false,
              isCompleted: true
            }));
            
            return;
          }
          
          if (signInData.session) {
            // Test user session established
          }
        } else {
          // No test user credentials found
        }
      }
      
      // At this point, either we have a session or we're proceeding with demo
      setPreviewAudio({
        url: 'demo-audio-url',
        duration: 30
      });
      
      setRecordingState(prevState => ({
        ...prevState,
        currentStep: 'completed',
        isProcessing: false,
        isCompleted: true
      }));
      
    } catch (error) {
      showNotification('Something went wrong. Please try again.', 'error');
    }
  };

  const handleRecordingComplete = async () => {
    setRecordingState(prevState => ({ ...prevState, isProcessing: true }));
    // Save processing progress
    await AsyncStorage.setItem(VOICE_CLONE_PROGRESS_KEY, 'processing');
    try {
      const uri = await stopRecording();
      if (!uri) throw new Error('No recording available');

      // Convert audio file to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]); // Remove data URL prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Process the guided voice clone
      const result = await guidedVoiceCloneService.processGuidedVoiceClone([{
        passageId: currentPassage.id,
        audioUri: uri,
        duration: recordingState.progress,
        completionRate: 100
      }], {
        totalDuration: recordingState.progress,
        averageQuality: 85,
        environmentNoise: 'low',
        deviceType: Platform.OS
      });

      if (!result.success) {
        throw new Error(result.message || 'Voice cloning failed');
      }

      // Clone the voice using ElevenLabs
      const cloneResponse = await secureElevenLabsService.cloneVoice({
        name: `${user.id}_guided_clone`,
        description: 'Voice cloned through guided experience',
        audioFiles: [base64Audio],
        labels: {
          type: 'guided_clone',
          passage_id: currentPassage.id.toString(),
          user_id: user.id
        }
      });

      // Store the voice ID in Supabase
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          elevenlabs_voice_id: cloneResponse.voice_id,
          voice_clone_status: cloneResponse.status,
          voice_created_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Set preview audio for the completed screen
      setPreviewAudio({
        url: cloneResponse.preview_url || uri,
        duration: 30
      });

      setRecordingState(prevState => ({ 
        ...prevState, 
        currentStep: 'completed',
        isProcessing: false,
        isCompleted: true,
        recordingUri: uri
      }));
      
      // Clear progress when completed successfully
      await AsyncStorage.removeItem(VOICE_CLONE_PROGRESS_KEY);

    } catch (error) {
      showNotification('Voice Cloning Failed: There was an error processing your voice. Please try again.', 'error');
      setRecordingState(prevState => ({
        ...prevState,
        isProcessing: false,
        isCompleted: false
      }));
      // Clear progress on error
      await AsyncStorage.removeItem(VOICE_CLONE_PROGRESS_KEY);
    }
  };

  const handleContinue = () => {
    if (onComplete) {
      // If we're in the onboarding flow, complete it
      onComplete();
    } else if (navigation) {
      // If we're in normal app flow, navigate to preview screen
      navigation.navigate('VoicePreview', {
        recordingUri: previewAudio?.url,
        passageText: currentPassage.text
      });
    }
  };

  // Add function to fetch user's name from database
  const fetchUserName = async () => {
    try {
      // First, try to use the passed userData
      if (userData?.name) {
        setUserName(userData.name);
        return;
      }

      // Fallback to database if userData is not available
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        // Try to get name from onboarding_responses first
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_responses')
          .select('name')
          .eq('user_id', user.id)
          .single();

        if (onboardingData?.name) {
          setUserName(onboardingData.name);
          return;
        }

        // Fallback to users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (userData?.full_name) {
          setUserName(userData.full_name);
          return;
        }
      }
    } catch (error) {
      console.error('[VoiceClone] Error fetching user name:', error);
    }
  };

  // Add effect to fetch user name on component mount or when userData changes
  useEffect(() => {
    fetchUserName();
  }, [userData]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      Voice.destroy().then(() => {
        // cleanup
      });
      Voice.removeAllListeners();
    };
  }, []);

  const insets = useSafeAreaInsets();

  const renderInstructionsScreen = (mainAnimatedStyle: any, buttonAnimatedStyle: any) => {
    return (
      <View style={styles.fullScreenStep}>
        <Animated.View style={mainAnimatedStyle}>
          <Text style={styles.stepTitle}>
            Create Your Voice Clone
          </Text>
          {/* Checklist Section */}
          <View style={styles.checklistContainer}>
            <View style={styles.checklistItem}>
              <View style={styles.checkIcon}>
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.checklistText}>Find a quiet space</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={styles.checkIcon}>
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.checklistText}>Speak naturally and clearly</Text>
            </View>
            <View style={styles.checklistItem}>
              <View style={styles.checkIcon}>
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.checklistText}>Take your time reading</Text>
            </View>
          </View>
          {/* Instructions Section */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionTitle}>
              Transform Your Voice Into Power
            </Text>
            <Text style={styles.instructionText}>
              You'll see text appear on screen. Read it naturally at your own pace.
            </Text>
            <Text style={styles.instructionText}>
              Words will highlight as you speak to guide your reading.
            </Text>
            <Text style={styles.instructionText}>
              The waveform shows your voice strength - speak clearly and consistently.
            </Text>
          </View>
        </Animated.View>
        <View style={[
          styles.buttonContainer,
          { marginBottom: insets.bottom + foundations.spacing.md },
        ]}>
          <Animated.View style={buttonAnimatedStyle}>
            <Pressable 
              style={({ pressed }) => [
                utils.createButtonStyle('primary', 'lg', { width: '100%' }),
                pressed && components.button.states.pressed
              ]} 
              onPress={() => {
                if (navigation) {
                  navigation.navigate('RecordingScreen', { 
                    userName: userData?.name || 'Friend' 
                  });
                } else if (onComplete) {
                  // In onboarding flow, just complete the step
                  onComplete();
                }
              }}
            >
              <LinearGradient
                colors={[...foundations.gradients.primaryButton.colors]}
                start={foundations.gradients.primaryButton.start}
                end={foundations.gradients.primaryButton.end}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[
                components.button.typography.lg,
                { color: foundations.colors.textLight }
              ]}>
                Begin Voice Cloning
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderCompletedScreen = () => (
    <View style={styles.fullScreenStep}>
      {recordingState.isProcessing ? (
        <>
          <ActivityIndicator size="large" color={foundations.colors.primary} style={{ marginBottom: 20 }} />
          <Text style={styles.stepTitle}>Processing Your Voice...</Text>
          <Text style={styles.instructionText}>
            This may take a few moments while we create your personalized voice clone.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.stepTitle}>Hear the beginning of your transformation</Text>
          
          <View style={styles.completedInfo}>
            <Text style={styles.completedText}>
              This isn't just your voice — it's your new beliefs taking root.
            </Text>
            
            <Text style={[styles.completedSubtext, { marginTop: 12, marginBottom: 16 }]}>
              Every time you play it, you're rewiring old patterns and building the future you've always wanted.
            </Text>
            
            {previewAudio ? (
              <>
                <Text style={[styles.completedSubtext, { marginBottom: 16, fontWeight: '600', color: foundations.colors.primary }]}>
                  Tap play. Feel what's possible.
                </Text>
                <VoicePreviewPlayer
                  audioUrl={previewAudio.url}
                  duration={previewAudio.duration}
                />
              </>
            ) : (
              <View style={styles.previewLoading}>
                <ActivityIndicator size="small" color={foundations.colors.primary} />
                <Text style={styles.previewLoadingText}>
                  Generating voice preview...
                </Text>
              </View>
            )}

            <Text style={[styles.completedSubtext, { marginTop: 24, textAlign: 'center' }]}>
              Not quite perfect?
            </Text>
            
            <Pressable 
              style={styles.reRecordButton}
              onPress={() => {
                setRecordingState(prevState => ({
                  ...prevState,
                  currentStep: 'instructions',
                  isProcessing: false,
                  isCompleted: false,
                  recordingUri: undefined
                }));
                setPreviewAudio(null);
                setVoiceCloneResult(null);
                Voice.destroy().then(() => {
                  // cleanup
                });
                Voice.removeAllListeners();
                // Re-register handlers after cleanup
                setupVoiceHandlers();
                setIsRecognitionActive(false);
              }}
            >
              <Text style={styles.reRecordButtonText}>
                Re-record and make it even stronger.
              </Text>
            </Pressable>
          </View>
          
          <View style={[
            styles.actionButtons,
            { marginBottom: insets.bottom + foundations.spacing.md },
          ]}>
            <Pressable 
              style={({ pressed }) => [
                utils.createButtonStyle('primary', 'lg', {
                  width: '100%',
                }),
                pressed && components.button.states.pressed
              ]} 
              onPress={handleContinue}
            >
              <LinearGradient
                colors={[...foundations.gradients.primaryButton.colors]}
                start={foundations.gradients.primaryButton.start}
                end={foundations.gradients.primaryButton.end}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.buttonText}>
                {onComplete ? 'Continue' : 'Preview Voice'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (recordingState.currentStep) {
      case 'instructions':
        return renderInstructionsScreen(mainAnimatedStyle, buttonAnimatedStyle);
      case 'completed':
        return renderCompletedScreen();
      default:
        return renderInstructionsScreen(mainAnimatedStyle, buttonAnimatedStyle);
    }
  };

  return (
    <ScreenWrapper
      useGradient={false}
      style={styles.container}
      contentStyle={{
        paddingTop: foundations.spacing['5xl'], // Match VoiceCloneIntroScreen spacing
        paddingBottom: foundations.spacing['3xl'],
        paddingHorizontal: foundations.spacing.lg,
        flex: 1,
        backgroundColor: '#0A0A0A',
      }}
      statusBarColor="#0A0A0A"
    >
      {renderCurrentStep()}

      {recordingState.isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={foundations.colors.primary} />
          <Text style={styles.processingText}>Processing your voice...</Text>
          <Text style={styles.processingSubtext}>This may take a moment</Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A0A0A',
    paddingTop: foundations.spacing.xs,

  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  fullScreenStep: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  microphoneIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: foundations.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: foundations.colors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  successIconContainer: {
    marginBottom: 40,
    backgroundColor: '#0A0A0A',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: foundations.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: foundations.colors.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  stepTitle: {
    ...components.typography.display.medium,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: foundations.fonts.families.bold,
  },
  checklistContainer: {
    width: '100%',
    marginBottom: 32,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: foundations.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checklistText: {
    ...components.typography.body.large,
    color: '#FFFFFF',
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  instructionTitle: {
    ...components.typography.heading.h1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: foundations.fonts.families.bold,
  },
  instructionText: {
    ...components.typography.subtitle,
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: foundations.spacing.xl,
    marginTop: 'auto',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#555555',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    ...components.button.typography.lg,
    color: '#FFFFFF',
  },
  buttonText: {
    fontFamily: foundations.fonts.families.bold,
    fontSize: foundations.fonts.sizes.lg,
    letterSpacing: 0.5,
    color: foundations.colors.textLight,
    textAlign: 'center',
  },
  // Recording screen styles
  recordingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 20,
  },
  textScrollView: {
    height: Dimensions.get('window').height * 0.5, // 50% of screen height
    backgroundColor: '#0A0A0A',
  },
  textScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  word: {
    ...components.typography.body.large,
    color: '#6B7280',
    marginRight: 8,
    marginBottom: 12,
  },
  highlightedWord: {
    color: foundations.colors.primary,
    fontWeight: '600',
  },
  completedWord: {
    color: '#9CA3AF',
  },
  upcomingWord: {
    color: '#4B5563',
  },
  lineBreak: {
    width: '100%',
    height: 28, // Increased line height
  },
  recordingControls: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 60, // Increase bottom margin to push button up
  },
  progressButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  progressCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mainRecordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: foundations.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 40,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  completedButton: {
    backgroundColor: '#8b5cf6',
  },
  completedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedInfo: {
    marginBottom: 60,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  completedText: {
    ...components.typography.body.large,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  completedSubtext: {
    ...components.typography.body.medium,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: foundations.spacing.xl,
    marginTop: 24,
    alignItems: 'center',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  processingSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentWord: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nextWordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  nextWord: {
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 0.5,
    marginHorizontal: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: foundations.colors.gradientStart,
  },
  recordingButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  buttonPressed: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    padding: 12,
    borderRadius: 12,
  },
  previewLoadingText: {
    ...components.typography.caption.medium,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  specialCharWord: {
    color: '#6B7280',
    opacity: 0.5
  },
  skipButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  skipButtonText: {
    ...components.typography.button.medium,
    color: foundations.colors.primary,
  },
  reRecordButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  reRecordButtonText: {
    ...components.typography.body.medium,
    color: '#9CA3AF',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
}); 

export default VoiceCloneScreen; 