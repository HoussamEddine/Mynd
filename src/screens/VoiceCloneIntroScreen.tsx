import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
  withDelay,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { theme, ScreenWrapper } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');
const { foundations, components, utils } = theme;

interface VoiceCloneIntroScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

export default function VoiceCloneIntroScreen({ onContinue, onBack }: VoiceCloneIntroScreenProps) {
  // Animation values
  const waveScale1 = useSharedValue(1);
  const waveScale2 = useSharedValue(1);
  const waveScale3 = useSharedValue(1);
  const micScale = useSharedValue(1);
  const faceOpacity = useSharedValue(0);

  const morphProgress = useSharedValue(0);

  const insets = useSafeAreaInsets();

  // Animation for main content and button
  const mainOpacity = useSharedValue(0);
  const mainTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  useEffect(() => {
    // Start the morphing animation sequence
    const startAnimations = () => {
      // Initial wave pulses
      waveScale1.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      waveScale2.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      waveScale3.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Microphone breathing effect
      micScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Morphing sequence: voice waves gradually reveal face
      setTimeout(() => {
        morphProgress.value = withTiming(1, { 
          duration: 3000, 
          easing: Easing.inOut(Easing.ease) 
        });
        
        faceOpacity.value = withTiming(1, { 
          duration: 2000, 
          easing: Easing.inOut(Easing.ease) 
        });
      }, 2000);
    };

    startAnimations();
  }, []);

  useEffect(() => {
    mainOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    mainTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
    buttonOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    buttonTranslateY.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, []);

  // Animated styles
  const animatedWave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale1.value }],
    opacity: interpolate(morphProgress.value, [0, 1], [1, 0.3]),
  }));

  const animatedWave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale2.value }],
    opacity: interpolate(morphProgress.value, [0, 1], [1, 0.4]),
  }));

  const animatedWave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale3.value }],
    opacity: interpolate(morphProgress.value, [0, 1], [1, 0.5]),
  }));

  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const animatedFaceStyle = useAnimatedStyle(() => ({
    opacity: faceOpacity.value,
    transform: [{ 
      scale: interpolate(morphProgress.value, [0, 1], [0.8, 1]) 
    }],
  }));

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mainOpacity.value,
    transform: [{ translateY: mainTranslateY.value }],
  }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  // Add clearAllData function
  const clearAllData = async () => {
    try {
      console.log('🧹 Clearing all data and session...');
      
      // Clear all AsyncStorage data
      await AsyncStorage.clear();
      
      // Sign out from Supabase completely
      await supabase.auth.signOut();
      
      console.log('✅ All data cleared and session signed out');
      console.log('📱 Please restart the app to test from the beginning');
      
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  return (
    <ScreenWrapper
      useGradient={false}
      style={styles.container}
      contentStyle={{
        paddingTop: foundations.spacing.xs,
        paddingBottom: foundations.spacing.md,
        paddingHorizontal: foundations.spacing.xl,
        flex: 1,
        backgroundColor: '#0A0A0A',
      }}
    >
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Dynamic Voice Wave Animation Section */}
        <View style={styles.animationSection}>
          <View style={styles.animationContainer}>
            <View style={styles.voiceWaveContainer}>
              {/* Animated face outline */}
              <Animated.View style={[styles.faceOutline, animatedFaceStyle]}>
                <View style={styles.faceFeatures}>
                  {/* Mouth element removed */}
                </View>
              </Animated.View>
              {/* Animated voice wave center */}
              <Animated.View style={[styles.voiceWave, animatedMicStyle]}>
                <Feather name="mic" size={52} color={foundations.colors.primary} />
              </Animated.View>
              {/* Dynamic animated ripples */}
              <Animated.View style={[styles.waveRipple, styles.waveRipple1, animatedWave1Style]} />
              <Animated.View style={[styles.waveRipple, styles.waveRipple2, animatedWave2Style]} />
              <Animated.View style={[styles.waveRipple, styles.waveRipple3, animatedWave3Style]} />
            </View>
          </View>
        </View>
        {/* Main Content */}
        <Animated.View style={[styles.mainSection, mainAnimatedStyle]}>
          <Text style={styles.title}>Let's Make It Personal.</Text>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              We use your real voice to make your affirmations{' '}
              <Text style={styles.highlightText}>10x more powerful.</Text>
            </Text>
            <Text style={styles.description}>
              Why? Because your brain trusts your own voice the most.
            </Text>
            <Text style={styles.description}>
              In just <Text style={styles.highlightText}>1 minute</Text>, we'll capture your voice — safely,
              securely, and privately.
            </Text>
          </View>
        </Animated.View>
        {/* Call to Action */}
        <Animated.View style={[styles.ctaSection, buttonAnimatedStyle]}>
          <Pressable 
            style={({ pressed }) => [
              utils.createButtonStyle('primary', 'lg', {
                width: '100%',
              }),
              pressed && components.button.states.pressed
            ]}
            onPress={onContinue}
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
              Start Voice Setup
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A0A0A',
    
  },
  content: {
    flex: 1,
    paddingHorizontal: foundations.spacing.xl,
    paddingBottom: foundations.spacing.md,
    backgroundColor: '#0A0A0A',
  },
  animationSection: {
    alignItems: 'center',
    marginBottom: foundations.spacing['4xl'],
  },
  animationContainer: {
    width: width * 0.5,
    height: width * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceWaveContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  voiceWave: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  waveRipple: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: foundations.colors.primary,
    borderRadius: width,
  },
  waveRipple1: {
    width: width * 0.32,
    height: width * 0.32,
  },
  waveRipple2: {
    width: width * 0.40,
    height: width * 0.40,
  },
  waveRipple3: {
    width: width * 0.48,
    height: width * 0.48,
  },
  faceOutline: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    borderWidth: 2,
    borderColor: foundations.colors.primary,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFeatures: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSection: {
    alignItems: 'center',
    marginBottom: foundations.spacing.lg,
  },
  title: {
    ...components.typography.display.medium,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: foundations.spacing['2xl'],
    fontFamily: foundations.fonts.families.bold,
  },
  descriptionContainer: {
    width: '100%',
  },
  description: {
    ...components.typography.body.large,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: foundations.spacing.lg,
  },
  highlightText: {
    ...components.typography.body.large,
    color: foundations.colors.primary,
    fontWeight: '600',
  },
  ctaSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
}); 
