import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, Text, Pressable, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import { requestAllAudioPermissions, showPermissionDeniedAlert, openAppSettings } from '../utils/audioPermissions';
import { useRoute, useNavigation } from '@react-navigation/native';
import { appApiService } from '../services/appApiService';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { errorHandlerService } from '../services/errorHandlerService';
import { guidedVoiceCloneService } from '../services/guidedVoiceCloneService';
import { ScreenWrapper } from '../constants';
import { NotificationBanner } from '../components/NotificationBanner';
import { EXPO_PUBLIC_BACKEND_API_URL } from '@env';

const styles = StyleSheet.create({
  recordingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 20,
  },
  simulationControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderRadius: 8,
    padding: 8,
  },
  simulationButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  simulationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  simulationIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1000,
  },
  simulationIndicatorText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '600',
  },
  textScrollView: {
    height: Dimensions.get('window').height * 0.5, // 50% of screen height
    backgroundColor: '#0A0A0A',
    marginTop: 40, // Increased top margin for more spacing
  },
  textScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30, // Added top padding for more text spacing
    paddingBottom: 40,
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  word: {
    fontSize: 28, // Increased font size
    color: '#6B7280',
    marginRight: 0, // Remove margin to prevent layout shifts
    marginBottom: 0, // Remove margin to prevent layout shifts
    lineHeight: 38, // Add more line height for better paragraph spacing
    // Avoid per-word textAlign, rely on paragraph center alignment
    // Ensure consistent font weight to prevent layout shifts
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  highlightedWord: {
    color: '#8b5cf6',
    // Keep font weight unchanged to avoid reflow
    fontWeight: '400',
    // Keep the same layout properties to prevent shifts
    fontFamily: 'Inter-Regular',
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
    paddingTop: 40, // Push the button down slightly
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
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedButton: {
    backgroundColor: '#10B981',
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reRecordButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  reRecordButtonText: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  paragraph: {
    fontSize: 28,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 38,
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
    // Ensure consistent spacing and prevent layout shifts
    flexWrap: 'wrap',
    fontFamily: 'Inter-Regular',
  },
  morphWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  morphWaveBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    minHeight: 4,
  },
});

const BAR_COUNT = 10;
const BAR_MIN_HEIGHT = 8;
const BAR_MAX_HEIGHT = 24;

const normalizeWord = (word: string) => word.replace(/[.,!?`'"\-]/g, '').toLowerCase();

const RecordingScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { currentLanguage } = useLanguage();
  const params = (route as any).params || {};
  const resolvedName = params.resolvedName || '';
  const scrollOffsetRef = useRef(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  
  // Multi-language sample texts for voice recording
  const SAMPLE_TEXTS = {
    en: (name: string) => name ? `Hey there, I'm ${name}.

I'm just taking a moment to slow down and breathe.

I have a feeling today's going to be a good day.

Life can get pretty crazy sometimes, but through it all, I'm choosing to stay calm,
trust myself, and focus on what really matters.

I know good things are on the way.

I don't have to figure it all out at once —
I'm just enjoying the journey, taking my time,
and celebrating the small wins along the way.

Feels pretty great, honestly.

One step at a time — I've got this.` : `Hey there.

I'm just taking a moment to slow down and breathe.

I have a feeling today's going to be a good day.

Life can get pretty crazy sometimes, but through it all, I'm choosing to stay calm,
trust myself, and focus on what really matters.

I know good things are on the way.

I don't have to figure it all out at once —
I'm just enjoying the journey, taking my time,
and celebrating the small wins along the way.

Feels pretty great, honestly.

One step at a time — I've got this.`,
    
    de: (name: string) => name ? `Hey, ich bin ${name}.

Ich nehme mir gerade einen Moment Zeit, um langsamer zu werden und zu atmen.

Ich habe das Gefühl, dass heute ein guter Tag wird.

Das Leben kann manchmal ganz schön verrückt sein, aber durch alles hindurch entscheide ich mich dafür, ruhig zu bleiben,
mir selbst zu vertrauen und mich auf das zu konzentrieren, was wirklich wichtig ist.

Ich weiß, dass gute Dinge auf dem Weg sind.

Ich muss nicht alles auf einmal herausfinden —
Ich genieße einfach die Reise, nehme mir Zeit
und feiere die kleinen Erfolge auf dem Weg.

Fühlt sich ziemlich großartig an, ehrlich gesagt.

Schritt für Schritt — ich schaffe das.` : `Hey.

Ich nehme mir gerade einen Moment Zeit, um langsamer zu werden und zu atmen.

Ich habe das Gefühl, dass heute ein guter Tag wird.

Das Leben kann manchmal ganz schön verrückt sein, aber durch alles hindurch entscheide ich mich dafür, ruhig zu bleiben,
mir selbst zu vertrauen und mich auf das zu konzentrieren, was wirklich wichtig ist.

Ich weiß, dass gute Dinge auf dem Weg sind.

Ich muss nicht alles auf einmal herausfinden —
Ich genieße einfach die Reise, nehme mir Zeit
und feiere die kleinen Erfolge auf dem Weg.

Fühlt sich ziemlich großartig an, ehrlich gesagt.

Schritt für Schritt — ich schaffe das.`,
    
    fr: (name: string) => name ? `Salut, je suis ${name}.

Je prends juste un moment pour ralentir et respirer.

J'ai le sentiment qu'aujourd'hui va être une bonne journée.

La vie peut devenir assez folle parfois, mais à travers tout cela, je choisis de rester calme,
de me faire confiance et de me concentrer sur ce qui compte vraiment.

Je sais que de bonnes choses arrivent.

Je n'ai pas besoin de tout comprendre d'un coup —
Je profite simplement du voyage, je prends mon temps
et je célèbre les petites victoires en cours de route.

Ça fait vraiment du bien, honnêtement.

Pas à pas — j'y arriverai.` : `Salut.

Je prends juste un moment pour ralentir et respirer.

J'ai le sentiment qu'aujourd'hui va être une bonne journée.

La vie peut devenir assez folle parfois, mais à travers tout cela, je choisis de rester calme,
de me faire confiance et de me concentrer sur ce qui compte vraiment.

Je sais que de bonnes choses arrivent.

Je n'ai pas besoin de tout comprendre d'un coup —
Je profite simplement du voyage, je prends mon temps
et je célèbre les petites victoires en cours de route.

Ça fait vraiment du bien, honnêtement.

Pas à pas — j'y arriverai.`,
    
    es: (name: string) => name ? `Hola, soy ${name}.

Solo estoy tomando un momento para desacelerar y respirar.

Tengo la sensación de que hoy va a ser un buen día.

La vida puede volverse bastante loca a veces, pero a través de todo, estoy eligiendo mantener la calma,
confiar en mí mismo y enfocarme en lo que realmente importa.

Sé que cosas buenas están en camino.

No tengo que averiguarlo todo de una vez —
Solo estoy disfrutando el viaje, tomándome mi tiempo
y celebrando las pequeñas victorias en el camino.

Se siente bastante genial, honestamente.

Paso a paso — puedo hacerlo.` : `Hola.

Solo estoy tomando un momento para desacelerar y respirar.

Tengo la sensación de que hoy va a ser un buen día.

La vida puede volverse bastante loca a veces, pero a través de todo, estoy eligiendo mantener la calma,
confiar en mí mismo y enfocarme en lo que realmente importa.

Sé que cosas buenas están en camino.

No tengo que averiguarlo todo de una vez —
Solo estoy disfrutando el viaje, tomándome mi tiempo
y celebrando las pequeñas victorias en el camino.

Se siente bastante genial, honestamente.

Paso a paso — puedo hacerlo.`
  };
  
  // Create sample text dynamically based on userName and language
  const getSampleText = (name: string) => {
    const textFunction = SAMPLE_TEXTS[currentLanguage as keyof typeof SAMPLE_TEXTS] || SAMPLE_TEXTS.en;
    return textFunction(name);
  };

  // Use resolved name to prevent reformatting - name is already fetched in VoiceCloneScreen
  // If no name is available, use a generic version without name
  const sampleText = resolvedName ? getSampleText(resolvedName) : getSampleText('');
  // Flatten all words from all paragraphs into a single array for global word highlighting
  const allWords = React.useMemo(() => sampleText.split(/\s+/g).map(w => w.trim()).filter(Boolean), [sampleText]);
  const flatWords = React.useMemo(() => {
    const paragraphs = sampleText.split('\n');
    const words: Array<{ word: string; isParagraphStart: boolean }> = [];
    paragraphs.forEach((para) => {
      const paraWords = para.split(' ').filter(Boolean);
      paraWords.forEach((word, wIdx) => {
        words.push({ word, isParagraphStart: wIdx === 0 });
      });
    });
    return words;
  }, [sampleText]);
  const [currentIndex, setCurrentIndex] = useState(-1); // Start at -1 so no word is highlighted initially
  
  // Auto-scroll tied to actual reading progress
  // Starts when text reaches half the scroll area and smoothly follows progress
  const scrollToCurrentWord = useCallback(() => {
    if (!scrollViewRef.current || flatWords.length === 0) return;
    if (scrollViewHeight === 0 || contentHeight === 0) return;
    // Don't scroll if we haven't started reading yet (currentIndex is -1)
    if (currentIndex < 0) return;
    // Stop forcing scroll after completion
    if (currentIndex >= Math.max(0, flatWords.length - 1)) return;

    const progressRatio = Math.min(1, Math.max(0, currentIndex / Math.max(1, flatWords.length - 1)));
    const rawTarget = progressRatio * contentHeight - scrollViewHeight * 0.5; // center current progress
    if (rawTarget <= 0) return; // don't scroll until midpoint is passed

    const maxY = Math.max(0, contentHeight - scrollViewHeight);
    const targetY = Math.min(Math.max(0, rawTarget), maxY);
    const delta = targetY - scrollOffsetRef.current;
    const absDelta = Math.abs(delta);
    if (absDelta > 2) {
      const smoothY = scrollOffsetRef.current + delta * 0.35; // ease toward target
      const clampedY = Math.min(Math.max(0, smoothY), maxY);
      scrollViewRef.current.scrollTo({ y: clampedY, animated: true });
    }
  }, [currentIndex, flatWords.length, scrollViewHeight, contentHeight]);

  // Scroll to current word whenever currentIndex changes
  useEffect(() => {
    // Only scroll if we have actually started reading (currentIndex >= 0)
    if (currentIndex >= 0) {
      scrollToCurrentWord();
    }
  }, [currentIndex, scrollToCurrentWord]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;
  const doneAnim = useRef(new Animated.Value(0)).current;
  const [waveformHeights, setWaveformHeights] = useState(Array(BAR_COUNT).fill(BAR_MIN_HEIGHT));
  const [buttonWaveHeights, setButtonWaveHeights] = useState(Array(5).fill(4));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const recognitionStartedRef = useRef(false);
  const [isVoiceCloning, setIsVoiceCloning] = useState(false);
  const [voiceCloneComplete, setVoiceCloneComplete] = useState(false);
  const [showReadingCompleteNotification, setShowReadingCompleteNotification] = useState(false);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  
  // Simulation state
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Component mount/unmount handling
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
    };
  }, []);

  // Check permissions on mount
  useEffect(() => {
    if (!isComponentMounted) return;
    
    async function checkPermissions() {
      const { microphone, speechRecognition } = await requestAllAudioPermissions();
      if (!microphone || !speechRecognition) {
        setHasPermissions(false);
        showPermissionDeniedAlert(openAppSettings);
      } else {
        setHasPermissions(true);
      }
    }
    
    checkPermissions();
  }, [isComponentMounted]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      })
    ).start();
  }, [animation]);

  // Done-state animation for the check icon (subtle, modern)
  useEffect(() => {
    if (isCompleted) {
      doneAnim.setValue(0);
      Animated.timing(doneAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else {
      doneAnim.setValue(0);
    }
  }, [isCompleted, doneAnim]);

  useEffect(() => {
    const id = animation.addListener(({ value }) => {
      // Simulate more realistic voice detection with varying intensity
      const time = Date.now() / 300;
      const voiceIntensity = isProcessing ? Math.abs(Math.sin(time * 0.5)) * 0.8 + 0.2 : 0; // Simulate voice intensity
      
      const newWaveformHeights = Array(BAR_COUNT)
        .fill(0)
        .map((_, i) => {
          const baseHeight = BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * Math.abs(Math.sin(time + (i * Math.PI) / BAR_COUNT));
          // Apply voice intensity to make it more realistic
          return BAR_MIN_HEIGHT + (baseHeight - BAR_MIN_HEIGHT) * voiceIntensity;
        });
      
      setWaveformHeights(newWaveformHeights);
      
      // Detect voice based on intensity and processing state
      const hasVoiceInput = voiceIntensity > 0.3 && isProcessing;
      setIsVoiceDetected(hasVoiceInput);
    });
    return () => animation.removeListener(id);
  }, [animation, isProcessing]);

  // Simulation auto-advance logic
  const startSimulation = useCallback(() => {
    setIsSimulationActive(true);
    setIsSimulationPaused(false);
    setIsProcessing(true);
    
    // Clear any existing interval
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    
    // Auto-advance through words at realistic reading pace (~150-200 words per minute)
    // This means ~2.5-3.3 words per second, so we'll use 400ms per word
    simulationIntervalRef.current = setInterval(() => {
      if (!isSimulationPaused && currentIndex < allWords.length - 1) {
        setCurrentIndex(prev => prev === -1 ? 0 : prev + 1);
      } else if (currentIndex >= allWords.length - 1) {
        // Complete the reading simulation
        setProgress(100);
        setIsProcessing(false);
        setIsSimulationActive(false);
        setShowReadingCompleteNotification(true);
        
        // Stop voice recognition to prevent warnings
        Voice.stop().catch(() => {
          // Ignore errors if already stopped
        });
        
        // Start voice cloning process
        setIsVoiceCloning(true);
        startVoiceCloning();
        
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
        }
      }
    }, 400) as unknown as NodeJS.Timeout;
  }, [currentIndex, allWords.length, isSimulationPaused]);

  // Voice cloning function
  const startVoiceCloning = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        errorHandlerService.logError(new Error('No user found'), 'RECORDING_SCREEN - startVoiceCloning');
        return;
      }

      // In a real implementation, this would send the recorded audio to the backend
      // For now, we'll simulate the process since we're not actually recording audio
      setTimeout(async () => {
        try {
          // Simulate sending audio data to backend for voice cloning
          // In production, this would be the actual recorded audio from the user reading
          const mockAudioData = 'mock_audio_base64_data'; // This would be real audio data
          
          // Call the backend voice cloning API (optional - skip if backend is not available)
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
              console.log('No authentication token available, skipping voice cloning');
            } else {
              const response = await fetch(`${EXPO_PUBLIC_BACKEND_API_URL}/voice/clone`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  audioBuffer: mockAudioData,
                  quality: 'high',
                  metadata: {
                    source: 'recording_screen',
                    userId: user.id,
                    timestamp: new Date().toISOString()
                  }
                })
              });

              if (response.ok) {
                const result = await response.json();
                console.log('Voice cloning successful:', result);
              } else {
                console.log('Voice cloning failed, continuing without backend');
              }
            }
          } catch (networkError) {
            console.log('Network error during voice cloning, continuing without backend:', networkError);
          }
          
          // Update completion step using RPC function (bypasses RLS)
          const { error: stepError } = await supabase.rpc('update_user_completion_step', {
            p_user_id: user.id,
            p_step_name: 'step_4_voice_cloning_completed',
            p_completed: true
          });

          if (!stepError) {
            setVoiceCloneComplete(true);
            setIsCompleted(true);
            setIsVoiceCloning(false);
            
            // Navigate to VoicePreviewPlayer after 1 second delay
            setTimeout(() => {
              navigation.navigate('VoicePreviewPlayer', {
                audioUrl: 'demo-audio-url',
                duration: 30
              });
            }, 1000);
          } else {
            errorHandlerService.logError(stepError, 'RECORDING_SCREEN - completion step update');
            setIsVoiceCloning(false);
          }
        } catch (error) {
          console.log('Voice cloning error (non-critical):', error);
          setIsVoiceCloning(false);
        }
      }, 3000); // 3 second delay to simulate processing time
      
    } catch (error) {
      errorHandlerService.logError(error, 'RECORDING_SCREEN - startVoiceCloning');
      setIsVoiceCloning(false);
    }
  }, []);

  const pauseSimulation = useCallback(() => {
    setIsSimulationPaused(true);
    setIsProcessing(false);
  }, []);

  const resumeSimulation = useCallback(() => {
    setIsSimulationPaused(false);
    setIsProcessing(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsSimulationActive(false);
    setIsSimulationPaused(false);
    setIsProcessing(false);
    
    // Stop voice recognition to prevent warnings
    Voice.stop().catch(() => {
      // Ignore errors if already stopped
    });
    
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  const skipToEnd = useCallback(() => {
    setCurrentIndex(allWords.length - 1);
    setProgress(100);
    setIsProcessing(false);
    setIsSimulationActive(false);
    setShowReadingCompleteNotification(true);
    
    // Stop voice recognition to prevent warnings
    Voice.stop().catch(() => {
      // Ignore errors if already stopped
    });
    
    // Start voice cloning process
    setIsVoiceCloning(true);
    startVoiceCloning();
    
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, [allWords.length]);

  const resetSimulation = useCallback(() => {
    setCurrentIndex(0);
    setProgress(0);
    setIsCompleted(false);
    setIsProcessing(false);
    setIsSimulationActive(false);
    setIsSimulationPaused(false);
    setIsVoiceCloning(false);
    setVoiceCloneComplete(false);
    setShowReadingCompleteNotification(false);
    setWaveformHeights(Array(BAR_COUNT).fill(BAR_MIN_HEIGHT));
    setButtonWaveHeights(Array(5).fill(4));
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  // Cleanup simulation and voice recognition on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      // Stop voice recognition on unmount with proper error handling
      try {
        Voice.stop().catch(() => {
          // Ignore errors if already stopped
        });
      } catch (error) {
        // Ignore any errors during cleanup
        console.log('Voice cleanup error (ignored):', error);
      }
    };
  }, []);

  // Register Voice event handlers only once on mount
  useEffect(() => {
    // Add error handling for Voice library initialization
    const setupVoiceHandlers = async () => {
      try {
        Voice.onSpeechResults = (event) => {
          if (!event.value || event.value.length === 0) return;
          const spoken = event.value[0].split(' ');
          if (spoken.length > 0) {
            // If we haven't started yet (currentIndex is -1), start with the first word
            const targetIndex = currentIndex === -1 ? 0 : currentIndex;
            
            if (allWords[targetIndex]) {
              const expected = normalizeWord(allWords[targetIndex]);
              const heard = normalizeWord(spoken[spoken.length - 1]);
              if (heard === expected) {
                setCurrentIndex(targetIndex + 1);
              }
            }
          }
        };
        
        Voice.onSpeechStart = () => { 
          setIsProcessing(true);
          setIsVoiceDetected(false); // Reset voice detection when speech starts
          
          // Add a small delay before voice detection becomes active to simulate natural speech onset
          setTimeout(() => {
            if (isProcessing) {
              // Voice detection will be controlled by the animation listener
            }
          }, 500);
        };
        
        Voice.onSpeechEnd = () => { 
          setIsProcessing(false);
          setIsVoiceDetected(false); // Reset voice detection when speech ends
        };
        
        Voice.onSpeechError = (e) => { 
          errorHandlerService.logError(e, 'RECORDING_SCREEN');
          setIsProcessing(false); 
        };
        
        Voice.onSpeechVolumeChanged = (e) => {
          // Handle volume changes properly to prevent infinite warnings
          if (e && typeof e.value === 'number') {
            // Use volume data if needed, otherwise just acknowledge the event
          }
        };
      } catch (error) {
        errorHandlerService.logError(error, 'RECORDING_SCREEN - Voice setup');
      }
    };

    setupVoiceHandlers();

    return () => {
      // Proper cleanup to prevent crashes on refresh
      try {
        Voice.stop().catch(() => {
          // Ignore errors if already stopped
        });
        Voice.destroy().then(() => {
          Voice.removeAllListeners();
        }).catch(() => {
          // Ignore errors if already destroyed
        });
      } catch (error) {
        errorHandlerService.logError(error, 'RECORDING_SCREEN - Voice cleanup');
      }
    };
  }, [currentIndex, allWords]); // Add dependencies to ensure current values are used

  // Start voice recognition automatically after permissions are granted, only once
  useEffect(() => {
    if (hasPermissions && !recognitionStartedRef.current && !isSimulationActive) {
      recognitionStartedRef.current = true;
      (async () => {
        try {
          // Add delay to ensure Voice library is properly initialized
          await new Promise(resolve => setTimeout(resolve, 1000));
          await Voice.start('en-US'); // Use en-US for better Android compatibility
        } catch (err) {
          errorHandlerService.logError(err, 'RECORDING_SCREEN');
          // Try with default locale if en-US fails
          try {
            await Voice.start('en'); // Use 'en' as fallback
          } catch (fallbackErr) {
            errorHandlerService.logError(fallbackErr, 'RECORDING_SCREEN');
            // If all voice recognition fails, just continue without it
            console.log('Voice recognition not available, continuing without it');
          }
        }
      })();
    }
  }, [hasPermissions, isSimulationActive]);

  const skipToNext = useCallback(async () => {
    if (currentIndex < allWords.length - 1) {
      setCurrentIndex(prev => prev === -1 ? 0 : prev + 1);
      // Progress will be updated by the useEffect hook
    } else {
      setIsCompleted(true);
      setProgress(100); // Ensure progress reaches 100% when completed
    }
  }, [currentIndex, allWords.length]);

  const reRecord = useCallback(() => {
    setCurrentIndex(-1);
    setProgress(0);
    setIsCompleted(false);
    setWaveformHeights(Array(BAR_COUNT).fill(BAR_MIN_HEIGHT));
    stopSimulation();
  }, [stopSimulation]);

  // Update progress whenever currentIndex changes
  useEffect(() => {
    // currentIndex represents the next word to be read, so progress should be based on completed words
    // If currentIndex is -1, no words have been completed yet
    const completedWords = currentIndex <= 0 ? 0 : currentIndex;
    const newProgress = (completedWords / allWords.length) * 100;
    setProgress(newProgress);
    
    // Check if all words have been completed
    if (currentIndex >= allWords.length) {
      setIsCompleted(true);
      setProgress(100);
    }
  }, [currentIndex, allWords.length]);

  // Animate waveform bars when isProcessing is true
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isProcessing) {
      interval = setInterval(() => {
        setWaveformHeights(
          Array(BAR_COUNT)
            .fill(0)
            .map((_, i) => BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * Math.abs(Math.sin(Date.now() / 300 + (i * Math.PI) / BAR_COUNT)))
        );
      }, 100);
    } else {
      setWaveformHeights(Array(BAR_COUNT).fill(BAR_MIN_HEIGHT));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  // Separate optimized animation for button wave during voice cloning
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isVoiceCloning) {
      interval = setInterval(() => {
        const time = Date.now() / 200; // Faster animation for button
        setButtonWaveHeights(
          Array(5)
            .fill(0)
            .map((_, i) => {
              const baseHeight = 4 + 12 * Math.abs(Math.sin(time + (i * 0.8))); // Smoother wave
              return Math.max(4, Math.min(20, baseHeight)); // Clamp between 4 and 20
            })
        );
      }, 60); // Higher frequency for smoother animation
    } else {
      setButtonWaveHeights(Array(5).fill(4));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVoiceCloning]);

  const recordingState = {
    currentWordIndex: currentIndex,
    progress: progress,
    isProcessing: isProcessing,
    isCompleted: isCompleted,
  };

  // Prevent UI interaction if permissions are not granted
  if (hasPermissions === false) {
    return (
      <View style={[styles.recordingContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', margin: 24 }}>
          Microphone and Speech Recognition permissions are required to use this feature. Please enable them in your device settings.
        </Text>
      </View>
    );
  }

  return (
    <ScreenWrapper
      useGradient={false}
      style={{ backgroundColor: '#0A0A0A' }}
      contentStyle={{
        paddingHorizontal: 0,
        flex: 1,
        backgroundColor: '#0A0A0A',
      }}
      statusBarColor="#0A0A0A"
      statusBarStyle="light"
    >
      <View style={styles.recordingContainer}>
      {/* Simulation Controls - Only show in development */}
      {__DEV__ && (
        <>
          <View style={styles.simulationControls}>
            {!isSimulationActive ? (
              <Pressable style={styles.simulationButton} onPress={startSimulation}>
                <Text style={styles.simulationButtonText}>Start Sim</Text>
              </Pressable>
            ) : (
              <>
                {isSimulationPaused ? (
                  <Pressable style={styles.simulationButton} onPress={resumeSimulation}>
                    <Text style={styles.simulationButtonText}>Resume</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.simulationButton} onPress={pauseSimulation}>
                    <Text style={styles.simulationButtonText}>Pause</Text>
                  </Pressable>
                )}
                <Pressable style={styles.simulationButton} onPress={stopSimulation}>
                  <Text style={styles.simulationButtonText}>Stop</Text>
                </Pressable>
                <Pressable style={styles.simulationButton} onPress={skipToEnd}>
                  <Text style={styles.simulationButtonText}>Skip End</Text>
                </Pressable>
                <Pressable style={styles.simulationButton} onPress={resetSimulation}>
                  <Text style={styles.simulationButtonText}>Reset</Text>
                </Pressable>
              </>
            )}
          </View>
          
          {isSimulationActive && (
            <View style={styles.simulationIndicator}>
              <Text style={styles.simulationIndicatorText}>
                {isSimulationPaused ? 'SIMULATION PAUSED' : 'SIMULATION ACTIVE'}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Reading Complete Notification */}
      <NotificationBanner
        message="Great job! Voice cloning in progress..."
        type="success"
        visible={showReadingCompleteNotification}
        onHide={() => setShowReadingCompleteNotification(false)}
        top={60}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.textScrollView}
        contentContainerStyle={styles.textScrollContent}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.textContainer} onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
          {/* Render the text with stable layout */}
          {(() => {
            const elements = [];
            let currentPara: React.ReactNode[] = [];
            
            flatWords.forEach((item, idx) => {
              if (item.isParagraphStart && currentPara.length > 0) {
                // Push previous paragraph
                elements.push(
                  <Text key={`para-${elements.length}`} style={styles.paragraph}>
                    {currentPara}
                  </Text>
                );
                currentPara = [];
              }
              
              // Create stable word component with consistent styling
              const isHighlighted = idx === currentIndex;
              currentPara.push(
                <Text
                  key={`word-${idx}`}
                  style={[
                    styles.word,
                    // Only apply highlight style, don't change base styling
                    isHighlighted && styles.highlightedWord
                  ]}
                >
                  {item.word}
                  {/* Add space after each word for consistent spacing */}
                  {idx < flatWords.length - 1 && !flatWords[idx + 1]?.isParagraphStart ? ' ' : ''}
                </Text>
              );
            });
            
            // Push last paragraph
            if (currentPara.length > 0) {
              elements.push(
                <Text key={`para-${elements.length}`} style={styles.paragraph}>
                  {currentPara}
                </Text>
              );
            }
            
            return elements;
          })()}
        </View>
      </ScrollView>
      <View style={styles.recordingControls}>
        <View style={styles.progressButtonContainer}>
          <Svg style={styles.progressCircle} width={100} height={100} viewBox="0 0 100 100">
            <Circle
              cx={50}
              cy={50}
              r={46}
              fill="none"
              stroke="#1F2937"
              strokeWidth={8}
            />
            <Circle
              cx={50}
              cy={50}
              r={46}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth={8}
              strokeDasharray={289}
              strokeDashoffset={289 * (1 - (recordingState.progress || 0) / 100)}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </Svg>
          <Pressable
            accessibilityRole="button"
            disabled={!voiceCloneComplete}
            onPress={async () => {
              if (!voiceCloneComplete) return;
              try {
                // cleanup recognition and simulation
                stopSimulation();
                await Voice.destroy();
                Voice.removeAllListeners();
                
                // Generate real preview audio from belief shift text
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id) {
                  // Use the new database structure - get voice ID using RPC function
                  const { data: voiceDataArray } = await supabase.rpc('get_user_voice', {
                    p_user_id: user.id
                  });
                  
                  const voiceData = voiceDataArray?.[0];
                  if (voiceData?.voice_id && voiceData?.is_active) {
                    // Get the belief content from the new belief_content table
                    const { data: latestBeliefContent } = await supabase
                      .from('belief_content')
                      .select('content')
                      .eq('user_id', user.id)
                      .eq('content_type', 'transformation_text')
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .single();
                    
                    if (latestBeliefContent?.content?.transformation_text) {
                      const previewUrl = await appApiService.generateBeliefShiftPreviewAudio(
                        latestBeliefContent.content.transformation_text,
                        voiceData.voice_id
                      );
                      
                      navigation.navigate('VoicePreviewPlayer', {
                        audioUrl: previewUrl,
                        duration: 20
                      });
                      return;
                    }
                  }
                }
                
                // Fallback to demo if no voice or transformation found
                navigation.navigate('VoicePreviewPlayer', {
                  audioUrl: 'demo-audio-url',
                  duration: 30
                });
              } catch (error) {
                errorHandlerService.logError(error, 'RECORDING_SCREEN');
                // Fallback to demo on error
                navigation.navigate('VoicePreviewPlayer', {
                  audioUrl: 'demo-audio-url',
                  duration: 30
                });
              }
            }}
            style={[
              styles.mainRecordButton,
              { opacity: (isVoiceCloning || voiceCloneComplete) ? 1 : 0.5 }
            ]}
          >
            <View style={styles.buttonContent}>
              {isVoiceCloning && (
                <View style={styles.morphWaveContainer}>
                  {buttonWaveHeights.map((height, index) => (
                    <View
                      key={index}
                      style={[
                        styles.morphWaveBar,
                        {
                          height: height,
                          marginHorizontal: 2,
                        }
                      ]}
                    />
                  ))}
                </View>
              )}
              {voiceCloneComplete && (
                <Animated.View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{
                      scale: doneAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      })
                    }],
                    opacity: doneAnim,
                  }}
                >
                  <Feather name="check" size={28} color="#FFFFFF" />
                </Animated.View>
              )}
            </View>
          </Pressable>
          
          {isCompleted && (
            <Animated.View
              style={{
                marginTop: 16,
                opacity: doneAnim,
                transform: [{
                  scale: doneAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }],
              }}
            >
              {isVoiceCloning && (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  textAlign: 'center',
                  fontFamily: 'Inter-SemiBold',
                }}>
                  Cloning Voice...
                </Text>
              )}
            </Animated.View>
          )}
        </View>

      </View>
    </View>
    </ScreenWrapper>
  );
};

export default RecordingScreen;
