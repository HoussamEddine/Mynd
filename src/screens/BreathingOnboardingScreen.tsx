import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants';

const { colors, spacing, radii } = theme.foundations;

interface BreathingOnboardingScreenProps {
  navigation: any;
  route: any;
}

export default function BreathingOnboardingScreen({ navigation, route }: BreathingOnboardingScreenProps) {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const boxAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Start box breathing animation
    startBoxBreathingAnimation();
  }, []);

  const startBoxBreathingAnimation = () => {
    const breatheIn = Animated.timing(boxAnim, {
      toValue: 1.3,
      duration: 4000,
      useNativeDriver: true,
    });
    
    const holdIn = Animated.timing(boxAnim, {
      toValue: 1.3,
      duration: 4000,
      useNativeDriver: true,
    });
    
    const breatheOut = Animated.timing(boxAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: true,
    });
    
    const holdOut = Animated.timing(boxAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: true,
    });
    
    const sequence = Animated.sequence([breatheIn, holdIn, breatheOut, holdOut]);
    Animated.loop(sequence).start();
  };

  const handleContinuePress = async () => {
    try {
      // Mark that user has seen the onboarding
      await AsyncStorage.setItem('has_seen_breathing_onboarding', 'true');
      
      // Navigate to breathing screen
      navigation.navigate('BreathingScreen', route.params);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Still navigate even if saving fails
      navigation.navigate('BreathingScreen', route.params);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Prepare Your Mind</Text>
          <Text style={styles.subtitle}>
            A simple breathing exercise to get the most out of your session.
          </Text>
        </View>

        <View style={styles.illustrationContainer}>
          <Animated.View 
            style={[
              styles.breathingBox, 
              { 
                transform: [{ scale: boxAnim }],
                opacity: boxAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.7, 1],
                })
              }
            ]}
          >
            <View style={styles.innerBox} />
          </Animated.View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Before each session, we recommend taking a moment to breathe. This simple exercise helps to calm your nervous system, quiet distracting thoughts, and make your mind more receptive to your new belief.
          </Text>
          
          <Text style={styles.instruction}>
            We will guide you through a simple Box Breathing exercise.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={handleContinuePress}>
            <Text style={styles.buttonText}>Got it, Start Session</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  title: {
    fontSize: theme.foundations.fonts.sizes['3xl'],
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingBox: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  innerBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.background,
    opacity: 0.9,
  },
  descriptionContainer: {
    marginBottom: spacing.xl,
  },
  description: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  instruction: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  button: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  buttonText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
}); 