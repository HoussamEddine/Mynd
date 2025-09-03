import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { Text } from '../components/base/Text';
import { theme, ScreenWrapper } from '../constants';
import LottieView from 'lottie-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { appApiService } from '../services/appApiService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { navigationRef } from '../../App';
import { appStateService } from '../services/appStateService';

const { width: screenWidth } = Dimensions.get('window');
const { foundations, components } = theme;
const utils = theme.utils;

export default function AILoadingScreen() {
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route as any).params || {};
  const { user } = useAuth();

  // Call OpenAI API on mount
  useEffect(() => {
    async function generateTransformation() {
      if (!user || !params) {
        console.error('Missing user or params for transformation generation');
        return;
      }

      // Extract user data from params
      const userData = {
        name: params.name || 'User',
        age: params.age || 25,
        gender: params.gender || 'Other',
        motivation: params.motivation || '',
        struggling_emotions: params.struggling_emotions || [],
        self_relationship: params.self_relationship || [],
        inner_voice_change: params.inner_voice_change || [],
        current_self_talk: params.current_self_talk || [],
        affirmation_tone: params.affirmation_tone || '',
        wake_sleep_time: params.wake_sleep_time || { wakeUp: { hour: 7, minute: 0 }, bedTime: { hour: 22, minute: 0 } },
        limiting_belief: params.limiting_belief || '',
      };

      try {
        const result = await appApiService.generateCoreBeliefTransformation(userData);

        // Ensure user exists in the database
        const { data: userCheck, error: userCheckError } = await supabase
          .from('users')
          .select('id, email, onboarding_data, is_onboarding_complete')
          .eq('id', user.id)
          .maybeSingle();

        if (userCheckError) {
          console.error('Error checking user existence:', userCheckError);
        }

        if (!userCheck) {
          const { error: insertUserError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              subscription_tier: 'free',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              auth_providers: [user?.user_metadata?.provider || 'email'],
            });
          if (insertUserError) {
            console.error('Failed creating user row before AI content insert:', insertUserError);
            throw insertUserError;
          }
        }
        
        // Save transformation content to ai_audio_content table
        const { data: inserted, error: contentError } = await supabase
          .from('ai_audio_content')
          .insert({
            user_id: user.id,
            belief_id: null,
            content_type: 'transformation',
            source_text: result.transformation_text,
            audio_url: 'placeholder://pending-generation',
            voice_type: 'user_cloned_voice',
            generation_date: new Date().toISOString().split('T')[0],
            is_active: true,
            content_metadata: {
              positive_belief: result.positive_belief,
              affirmations: result.affirmations,
              pep_talk: result.pep_talk,
              user_data: userData
            }
          })
          .select('id')
          .single();

        if (contentError) {
          console.error('Error saving AI content:', contentError);
          throw new Error('Failed to save transformation content');
        }

        setLoading(false);
        
        // Navigate to VoiceCloneIntroScreen with the transformation data and affirmations
        await appStateService.setOnboardingStep('voice_clone_intro');

        (navigationRef as any).navigate('VoiceCloneIntro', {
          transformationText: result.transformation_text,
          affirmations: result.affirmations,
          userData: userData
        });
        
      } catch (err) {
        console.error('Error in transformation generation:', err);
        setLoading(false);
      }
    }
    generateTransformation();
  }, [params, user]);

  return (
    <ScreenWrapper contentStyle={styles.content}>
      {/* Animation Section */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.animationSection}>
        <View style={styles.animationPlaceholder}>
          <LottieView
            source={require('../../assets/animations/Loading.lottie')}
            autoPlay
            loop
            style={styles.lottie}
            colorFilters={[
              {
                keypath: '**',
                color: foundations.colors.primary,
              },
              {
                keypath: 'Layer 1',
                color: foundations.colors.primary,
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.View entering={FadeInUp.delay(500)} style={styles.mainContent}>
        <View style={styles.textSection}>
          <Text style={styles.title}>Crafting Your Personal Breakthrough</Text>
          
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>Just a moment! We're generating your unique Core Belief Transformation session and powerful affirmations, all tailored just for you.</Text>
          </View>
        </View>
      </Animated.View>

      {/* CTA Section */}
      <Animated.View entering={FadeInUp.delay(700)} style={styles.ctaSection}>
        <Pressable
          style={({ pressed }) => [
            utils.createButtonStyle('primary', 'lg'),
            pressed && components.button.states.pressed,
            loading && { opacity: 0.5 }
          ]}
          disabled={loading}
          onPress={() => {
            if (!loading) {
              // Navigate to VoiceCloneIntroScreen if not already navigated
              (navigationRef as any).navigate('VoiceCloneIntro', {
                transformationText: 'Your transformation is ready',
                affirmations: ['Your affirmations are ready'],
                userData: {
                  name: params.name || 'User',
                  age: params.age || 25,
                  gender: params.gender || 'Other',
                  motivation: params.motivation || '',
                  struggling_emotions: params.struggling_emotions || [],
                  self_relationship: params.self_relationship || [],
                  inner_voice_change: params.inner_voice_change || [],
                  self_talk_difficult: params.self_talk_difficult || [],
                  current_self_talk: params.current_self_talk || [],
                  affirmation_tone: params.affirmation_tone || 'Gentle & supportive',
                  limiting_belief: params.limiting_belief || '',
                  userId: user?.id
                }
              });
            }
          }}
        >
          <Text style={[
            components.button.typography.lg,
            { color: foundations.colors.textLight }
          ]}>
            {loading ? 'Generating...' : 'Continue'}
          </Text>
        </Pressable>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: foundations.spacing.md,
    paddingBottom: foundations.spacing['3xl'],
    justifyContent: 'space-between',
  },
  
  // Animation Section
  animationSection: {
    alignItems: 'center',
    marginTop: 44,
  },
  animationPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 250,
    height: 250,
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
    maxWidth: screenWidth * 0.9,
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
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.medium,
    textAlign: 'center',
    color: foundations.colors.textPrimary,
    marginBottom: foundations.spacing.xs,
    lineHeight: theme.foundations.fonts.sizes.lg * 1.4,
    letterSpacing: 0.3,
  },
  
  // CTA Section
  ctaSection: {
    paddingHorizontal: foundations.spacing.base,
    paddingBottom: foundations.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
}); 