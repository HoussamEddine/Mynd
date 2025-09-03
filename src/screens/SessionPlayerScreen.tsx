import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Text } from '../components/base/Text';
import { theme } from '../constants';
const { colors } = theme.foundations;
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { audioGenerationService } from '../services/audioGenerationService';
import { userDataService } from '../services/userDataService';
import { useAuth } from '../contexts/AuthContext';
import InfoContainer from '../components/ui/InfoContainer';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import NeuralGalaxy from '../components/NeuralGalaxy';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Neural Galaxy configuration for SessionPlayerScreen


// Word timing interface for synchronization
interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  emphasis: boolean;
}

// Define prop type for the screen
type SessionPlayerScreenProps = NativeStackScreenProps<RootStackParamList, 'SessionPlayer'>;

export function SessionPlayerScreen({ route, navigation }: SessionPlayerScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    affirmationText, 
    transformationText, 
    transformationId,
    customTrackId,
    customTrackTitle,
    customTrackDescription,
    customTrackDuration
  } = route.params;

  // Determine session type
  const isCustomTrack = !!customTrackId;
  const sessionTitle = customTrackTitle || 'Transformation Session';
  const sessionDescription = customTrackDescription || '';

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 20;

  // Phrase-level synchronization state
  const [phrases, setPhrases] = useState<string[]>([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechResults, setSpeechResults] = useState<string[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Audio playback state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [userVoiceId, setUserVoiceId] = useState<string | null>(null);

  // Real data from audio playback
  const [duration, setDuration] = useState(15 * 60);
  const [currentTime, setCurrentTime] = useState(10 * 60);
  const progressValue = duration > 0 ? currentTime / duration : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Split text into phrases for speech synchronization
  const splitTextIntoPhrases = useCallback((text: string): string[] => {
    // Split by sentences, commas, and line breaks for natural phrases
    return text
      .split(/(?<=[.!?])\s+|,\s+|\n+/)
      .filter(phrase => phrase.trim().length > 0)
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 3); // Filter out very short phrases
  }, []);

  // Get user's voice ID on mount
  useEffect(() => {
    const getUserVoiceId = async () => {
      if (!user?.id) return;
      
      const voiceId = await userDataService.getVoiceId(user.id);
      if (voiceId) {
        setUserVoiceId(voiceId);
      }
    };

    getUserVoiceId();
  }, [user?.id]);

  // Initialize phrases when text changes
  useEffect(() => {
    const text = transformationText || affirmationText || '';
    if (text) {
      const textPhrases = splitTextIntoPhrases(text);
      setPhrases(textPhrases);
      setCurrentPhraseIndex(0);
      setDisplayedText(''); // Don't show any phrase initially
    }
  }, [transformationText, affirmationText, splitTextIntoPhrases]);

  // Speech recognition setup
  useEffect(() => {
    // Set up Voice event handlers
    Voice.onSpeechStart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    Voice.onSpeechEnd = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      console.log('Speech results:', event.value);
      if (event.value && event.value.length > 0) {
        const spokenText = event.value[0].toLowerCase();
        setSpeechResults(prev => [...prev, spokenText]);
        
        // Check if spoken text matches current phrase
        const currentPhrase = phrases[currentPhraseIndex];
        if (currentPhrase && isPhraseMatch(spokenText, currentPhrase)) {
          // Move to next phrase
          const nextIndex = currentPhraseIndex + 1;
          if (nextIndex < phrases.length) {
            setCurrentPhraseIndex(nextIndex);
            setDisplayedText(phrases[nextIndex]);
          } else {
            // All phrases completed
            setIsPlaying(false);
            setDisplayedText(transformationText || affirmationText || '');
          }
        }
      }
    };

    Voice.onSpeechError = (event) => {
      console.error('Speech recognition error:', event);
      setIsListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [phrases, currentPhraseIndex, transformationText, affirmationText]);

  // Helper function to check if spoken text matches phrase
  const isPhraseMatch = useCallback((spokenText: string, targetPhrase: string): boolean => {
    const spokenWords = spokenText.split(' ').filter(word => word.length > 0);
    const targetWords = targetPhrase.toLowerCase().split(' ').filter(word => word.length > 0);
    
    // Check if at least 70% of words match
    const matchThreshold = Math.max(1, Math.floor(targetWords.length * 0.7));
    let matches = 0;
    
    for (const targetWord of targetWords) {
      if (spokenWords.some(spokenWord => 
        spokenWord.includes(targetWord) || targetWord.includes(spokenWord)
      )) {
        matches++;
      }
    }
    
    return matches >= matchThreshold;
  }, []);

  // Generate audio for the complete transformation text
  const generateAudioForTransformation = async () => {
    if (!userVoiceId || !phrases.length) {
      Alert.alert('No Voice Available', 'Please complete voice cloning first to hear your transformation in your own voice.');
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const completeText = phrases.join(' ');
      
      // If we have a transformation ID, try to get stored audio first
      if (transformationId) {
        const storedAudioUrl = await audioGenerationService.getStoredTransformationAudio(transformationId);
        if (storedAudioUrl) {
          setCurrentAudioUrl(storedAudioUrl);
          // Start speech recognition instead of audio playback
          await startSpeechRecognition();
          setIsGeneratingAudio(false);
          return;
        }
      }
      
      // Generate new audio using the user's cloned voice
      const result = await audioGenerationService.generateAudioForTransformation(
        transformationText || '', 
        userVoiceId, 
        transformationId || ''
      );

      if (result.success && result.audio_url) {
        setCurrentAudioUrl(result.audio_url);
        // Start speech recognition instead of audio playback
        await startSpeechRecognition();
      } else {
        Alert.alert('Audio Generation Failed', 'Could not generate audio for this transformation. Please try again.');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      Alert.alert('Audio Generation Failed', 'There was an error generating the audio. Please try again.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Start speech recognition for phrase synchronization
  const startSpeechRecognition = async () => {
    try {
      await Voice.start('en-US');
      console.log('Started speech recognition');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      Alert.alert('Speech Recognition Error', 'Could not start speech recognition. Please try again.');
    }
  };

  // Stop speech recognition
  const stopSpeechRecognition = async () => {
    try {
      await Voice.stop();
      console.log('Stopped speech recognition');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  // Handlers
  const handlePlayPause = async () => {
    if (isGeneratingAudio) return;

    if (isPlaying) {
      // Stop playback
      setIsPlaying(false);
      await stopSpeechRecognition();
      setCurrentPhraseIndex(0);
      setDisplayedText(phrases[0] || '');
    } else {
      // Start playback
      setIsPlaying(true);
      setDisplayedText(phrases[0] || ''); // Show first phrase when starting
      await generateAudioForTransformation();
    }
  };

  const handleChangeVoice = () => {
    setSelectedVoiceIndex(prev => (prev + 1) % 3);
  };

  const handleToggleMusic = () => {
    setIsMusicEnabled(prev => !prev);
  };

  const [floatingPlayerHeight, setFloatingPlayerHeight] = useState(0);

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.container}
      >
        {/* Back arrow */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('MainApp')} 
          style={{ position: 'absolute', top: insets.top + 10, left: 10, zIndex: 10, backgroundColor: 'transparent', padding: 8 }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.headerIcon || "#FFF"} />
        </TouchableOpacity>
        
        {/* Neural Galaxy Visualization */}
        <NeuralGalaxy 
          nodeCount={40}
          exclusionZone={{
            height: screenHeight * 0.25,
            width: screenWidth * 0.85,
            offsetY: -20
          }}
          animationDuration={2000}
          cycleDuration={2500}
        />
        
        <StatusBar style="light" />
        
        {/* Content Area - Centered, non-scrollable */}
        <View style={[
          styles.content,
          { 
            paddingTop: Math.max(0, (insets.top + theme.foundations.spacing.xl) - floatingPlayerHeight),
            paddingBottom: insets.bottom,
            zIndex: 1
          }
        ]}> 
          <View style={styles.nonScrollableContent}>
            <View style={styles.phraseContainer}>
              <View style={styles.phraseAnimatedContainer}>
                <Text style={styles.affirmationDisplayText}>
                  {isPlaying ? (displayedText || '') : 'Click play to start your transformation session'}
                </Text>

              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      {/* Floating Player Bar */}
      <View style={styles.floatingPlayerContainer}>
        <View style={styles.floatingPlayerBar} onLayout={(e) => setFloatingPlayerHeight(e.nativeEvent.layout.height)}>
          {/* Progress Bar Inside Floating Player */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill, 
                  { width: `${progressValue * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          {/* Play Button with Time */}
          <View style={styles.playButtonContainer}>
            <TouchableOpacity 
              onPress={handlePlayPause} 
              style={styles.playButton}
              disabled={isGeneratingAudio}
            >
              <Ionicons 
                name={isGeneratingAudio ? "hourglass-outline" : (isPlaying ? "pause" : "play")}
                size={24}
                color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>/</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Background Music Toggle */}
          <TouchableOpacity onPress={handleToggleMusic} style={styles.controlButton}>
            <Ionicons 
              name="musical-note-outline" 
              size={20} 
              color={isMusicEnabled ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>

          {/* Speed */}
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Loop */}
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="repeat" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Update styles
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerIcon: {
    color: colors.textPrimary,
  },
  playerIconActive: {
    color: colors.primary,
  },
  playerIconInactive: {
    color: colors.textSecondary,
  },
  galaxyNode: {
    color: colors.primary,
  },
  galaxyConnection: {
    color: colors.primaryLight,
  },
  minimalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 5,
  },
  backButton: {
    padding: 15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.foundations.spacing.xs,
    paddingTop: theme.foundations.spacing['2xl'],
    paddingBottom: theme.foundations.spacing['2xl'],
  },
  nonScrollableContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    maxHeight: '70%',
  },
  scrollContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.foundations.spacing.lg,
    minHeight: '100%',
  },
  phraseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 120,
  },
  phraseAnimatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 120,
  },
  phraseNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
    marginHorizontal: 10,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  phraseCounter: {
    color: colors.textLight || '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 20,
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    maxHeight: '70%',
    width: '100%',
  },
  affirmationDisplayText: {
    color: '#FFFFFF',
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    textAlign: 'center',
    lineHeight: theme.foundations.fonts.sizes.xl * 1.4,
    letterSpacing: 0.3,
    marginVertical: 20,
    textTransform: 'uppercase',
    paddingHorizontal: 35,
    maxWidth: '90%',
    alignSelf: 'center',
  },
  wordProgressContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  wordProgressText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: theme.foundations.fonts.families.medium,
  },

  // Floating Player Styles
  floatingPlayerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    zIndex: 100,
  },
  floatingPlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  playButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: theme.foundations.fonts.families.medium,
  },
  // Progress Bar Styles
  progressBarContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
});

export default SessionPlayerScreen;