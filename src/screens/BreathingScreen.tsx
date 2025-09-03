import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants';

const { colors, spacing, radii } = theme.foundations;

interface BreathingScreenProps {
  navigation: any;
  route: any;
}

export default function BreathingScreen({ navigation, route }: BreathingScreenProps) {
  const [breathingPhase, setBreathingPhase] = useState<'getReady' | 'inhale' | 'hold' | 'exhale' | 'hold2'>('getReady');
  const [timeLeft, setTimeLeft] = useState(1);
  const [cycleCount, setCycleCount] = useState(0);
  
  const dotPosition = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  const BREATH_CYCLE_DURATION = 16000; // 16 seconds total (4-4-4-4)

  useEffect(() => {
    // Start breathing cycle when screen loads
    startBreathingCycle();
  }, []);

  useEffect(() => {
    // Timer countdown that resets every 4 seconds
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathingPhase]);

  // Optimize re-renders by memoizing the breathing text
  const breathingText = useMemo(() => {
    switch (breathingPhase) {
      case 'getReady':
        return 'GET READY';
      case 'inhale':
        return 'INHALE';
      case 'hold':
        return 'HOLD';
      case 'exhale':
        return 'EXHALE';
      case 'hold2':
        return 'HOLD';
      default:
        return 'GET READY';
    }
  }, [breathingPhase]);

  const startBreathingCycle = () => {
    // Start with "Get Ready" for 1 second (only once)
    setBreathingPhase('getReady');
    setTimeLeft(1);
    
    // After 1 second, start the actual breathing cycle
    setTimeout(() => {
      startBreathingLoop();
    }, 1000);
  };

  const startBreathingLoop = () => {
    setBreathingPhase('inhale');
    setTimeLeft(4);
    
    // Inhale animation (0-4s) - complete full rotation clockwise
    const inhaleAnimation = Animated.timing(dotPosition, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    });
    inhaleAnimation.start();

    // Hold at bottom (4-8s) - stop animation, change text
    setTimeout(() => {
      fadeText('hold');
    }, 4000);

    // Exhale animation (8-12s) - rotate counter-clockwise from bottom to top
    setTimeout(() => {
      fadeText('exhale');
      const exhaleAnimation = Animated.timing(dotPosition, {
        toValue: 0,
        duration: 4000,
        useNativeDriver: false,
      });
      exhaleAnimation.start();
    }, 8000);

    // Hold at top (12-16s) - stop animation, change text
    setTimeout(() => {
      fadeText('hold2');
    }, 12000);

    // Reset to bottom and repeat cycle
    setTimeout(() => {
      setBreathingPhase('inhale');
      setTimeLeft(4);
      setCycleCount(prev => prev + 1);
      // Reset animation
      const resetAnimation = Animated.timing(dotPosition, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      });
      resetAnimation.start();
      // Restart the cycle
      setTimeout(() => {
        startBreathingLoop();
      }, 100);
    }, 16000);
  };

  const handleSkip = () => {
    navigation.navigate('SessionPlayer', route.params);
  };

  const handleComplete = () => {
    navigation.navigate('SessionPlayer', route.params);
  };

  const fadeText = (newPhase: 'getReady' | 'inhale' | 'hold' | 'exhale' | 'hold2') => {
    // Fade out
    Animated.timing(textOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: false,
    }).start(() => {
      // Change phase after fade out
      setBreathingPhase(newPhase);
      setTimeLeft(4);
      // Fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }).start();
    });
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.breathingContainer}>
            <View style={styles.circleContainer}>
              <View style={styles.breathingCircle}>
                <Animated.View
                  style={[
                    styles.breathingDot,
                    {
                      transform: [
                        {
                          rotate: dotPosition.interpolate({
                            inputRange: [0, 0.25, 0.5, 0.75, 1],
                            outputRange: ['0deg', '-90deg', '-180deg', '-270deg', '-360deg'],
                          })
                        },
                        {
                          translateY: 80,
                        }
                      ],
                    },
                  ]}
                />
              </View>
            </View>

            <Animated.Text style={[styles.instructionText, { opacity: textOpacity }]}>
              {breathingText}
            </Animated.Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
          </View>

          <View style={styles.bottomButtonContainer}>
            <Pressable 
              style={[
                styles.readyButton, 
                cycleCount < 3 && styles.readyButtonDisabled
              ]} 
              onPress={handleComplete}
              disabled={cycleCount < 3}
            >
              <Text style={[
                styles.readyButtonText,
                cycleCount < 3 && styles.readyButtonTextDisabled
              ]}>
                Mynd is ready
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  breathingContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: spacing.xl * 4,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderWidth: 8,
    borderColor: colors.textLight,
    borderRadius: 100,
    borderBottomWidth: 0,
    position: 'relative',
  },
  breathingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textLight,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -6,
    marginTop: -6,
    shadowColor: colors.textLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  instructionText: {
    fontSize: theme.foundations.fonts.sizes['3xl'],
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xl * 4,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: spacing['2xl'],
    paddingHorizontal: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
  },
  readyButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  readyButtonDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.7,
  },
  readyButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  readyButtonTextDisabled: {
    color: 'white',
    opacity: 0.7,
  },
}); 