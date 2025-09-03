import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import Animated, { 
  FadeInUp,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, ScreenWrapper } from '../constants';
import { Text } from '../components/base/Text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const { foundations, components, utils } = theme;
const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const clearAllData = async () => {
    try {
      console.log('🧹 Clearing all data and session...');
      
      // Clear all AsyncStorage data
      await AsyncStorage.clear();
      
      // Sign out from Supabase completely
      await supabase.auth.signOut();
      
      // Force reload the app to ensure fresh state
      // In React Native, we can't easily reload, but we can clear the session
      console.log('✅ All data cleared and session signed out');
      console.log('📱 Please restart the app to test from the beginning');
      
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  return (
    <ScreenWrapper
      contentStyle={styles.content}
    >
        {/* Logo Section */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.logoSection}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
        </Animated.View>

      {/* Main Content */}
      <Animated.View entering={FadeInUp.delay(500)} style={styles.mainContent}>
        <View style={styles.textSection}>
          <Text style={styles.title}>Welcome to{'\n'}Mynd</Text>
          
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>Rewire your thoughts.</Text>
            <Text style={styles.subtitle}>Transform your life.</Text>
              </View>
          
          <Text style={styles.description}>
            Your daily ritual for mental clarity, confidence, and growth.
          </Text>
          </View>
        </Animated.View>

      {/* CTA Section */}
      <Animated.View entering={SlideInRight.delay(700)} style={styles.ctaSection}>
        <Pressable 
          style={({ pressed }) => [
            utils.createButtonStyle('primary', 'lg'),
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
            Begin Your Journey
          </Text>
          </Pressable>
        </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: foundations.spacing['2xl'],
    paddingBottom: foundations.spacing['3xl'],
    justifyContent: 'space-between',
  },
  
  // Logo Section
  logoSection: {
    alignItems: 'center',
    paddingTop: foundations.spacing.lg,
  },
  logo: {
    width: foundations.spacing['8xl'],
    height: foundations.spacing['8xl'],
    tintColor: foundations.colors.primary,
  },
  
  // Main Content
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: foundations.spacing['4xl'],
  },
  textSection: {
    alignItems: 'center',
    maxWidth: width * 0.9,
  },
  title: {
    ...components.typography.display.large,
    textAlign: 'center',
    marginBottom: foundations.spacing['2xl'],
    letterSpacing: -1,
    color: foundations.colors.textPrimary,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: foundations.spacing['3xl'],
  },
  subtitle: {
    ...components.typography.heading.h1,
    textAlign: 'center',
    color: foundations.colors.primary,
    marginBottom: foundations.spacing.xs,
  },
  description: {
    ...components.typography.body.large,
    textAlign: 'center',
    color: foundations.colors.textSecondary,
    lineHeight: foundations.fonts.sizes.lg * 1.6,
    paddingHorizontal: foundations.spacing.lg,
  },
  
  // CTA Section
  ctaSection: {
    paddingHorizontal: 16,
    paddingBottom: foundations.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
}); 