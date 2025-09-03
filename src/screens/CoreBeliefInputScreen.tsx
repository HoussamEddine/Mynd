import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions, Platform, StatusBar, TouchableWithoutFeedback, Pressable, Keyboard, ScrollView, Alert } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withDelay,
  Easing 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { userCompletionService } from '../services/userCompletionService';
import { BeliefValidationService } from '../services/beliefValidationService';
import { appApiService } from '../services/appApiService';
import { audioGenerationService } from '../services/audioGenerationService';
import SoundWaveSpinner from '../components/SoundWaveSpinner';
import { errorHandlerService } from '../services/errorHandlerService';

const { foundations, components, utils } = theme;
const { colors, spacing, radii, fonts } = theme.foundations;

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

interface CoreBeliefInputScreenProps {
  name?: string;
  age?: number;
  gender?: string;
  motivation?: string;
  struggling_emotions?: string[];
  self_relationship?: string[];
  inner_voice_change?: string[];
  current_self_talk?: string[];
  affirmation_tone?: string;
  wake_sleep_time?: { wakeUp: { hour: number; minute: number }; bedTime: { hour: number; minute: number } };
}

const CoreBeliefInputScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ CoreBeliefInput: CoreBeliefInputScreenProps }, 'CoreBeliefInput'>>();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [inputText, setInputText] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [characterCount, setCharacterCount] = useState(200);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);



  const addBelief = async () => {
    if (!inputText.trim()) {
      showNotification('Please enter your core limiting belief', 'error');
      return;
    }

    if (!user?.id) {
      showNotification('Please log in to add beliefs', 'error');
      return;
    }

    // Set loading immediately to show animation during validation
    setIsLoading(true);

    try {
      // Validate the belief first
      const validationResult = await BeliefValidationService.validateCoreBelief(inputText.trim());
      if (!BeliefValidationService.isValidCoreBelief(validationResult)) {
        const errorMessage = BeliefValidationService.getErrorMessage(validationResult);
        showNotification(errorMessage, 'error');
        setIsLoading(false);
        return;
      }
      console.log('Adding core belief with title:', inputText.trim());
      
      // Save the belief to database
      const { data: beliefData, error: beliefError } = await supabase
        .from('beliefs')
        .insert([
          {
            user_id: user.id,
            title: inputText.trim(),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (beliefError) {
        errorHandlerService.logError(beliefError instanceof Error ? beliefError : new Error(String(beliefError)), 'CORE_BELIEF_INPUT');
        showNotification('Failed to add belief', 'error');
        return;
      }

      console.log('Core belief added successfully:', beliefData);
      
      // Mark onboarding answers as completed
      await AsyncStorage.setItem('@onboarding_answers', 'true');
      
      // Navigate to voice cloning intro
      (navigation as any).replace('VoiceCloneIntro', {
        transformationText: 'Your transformation is ready',
        affirmations: ['Your affirmations are ready'],
        userData: {
          name: route.params?.name || 'User',
          age: route.params?.age || 25,
          gender: route.params?.gender || 'Other',
          motivation: route.params?.motivation || '',
          struggling_emotions: Array.isArray(route.params?.struggling_emotions) ? route.params.struggling_emotions : [],
          self_relationship: Array.isArray(route.params?.self_relationship) ? route.params.self_relationship : [],
          inner_voice_change: Array.isArray(route.params?.inner_voice_change) ? route.params.inner_voice_change : [],
          current_self_talk: Array.isArray(route.params?.current_self_talk) ? route.params.current_self_talk : [],
          affirmation_tone: route.params?.affirmation_tone || '',
          limiting_belief: inputText.trim(),
          userId: user?.id
        }
      });
      
      // Generate AI content in the background (without audio for now)
      generateAIContentInBackground(inputText.trim(), beliefData.id);
      
    } catch (error) {
      errorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'CORE_BELIEF_INPUT');
      showNotification('Failed to add belief', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIContentInBackground = async (beliefText: string, beliefId: string) => {
    try {
      console.log('Starting background AI content generation...');
      
      if (!user?.id) {
        errorHandlerService.logError(new Error('User not available for background generation'), 'CORE_BELIEF_INPUT');
        return;
      }
      
      // Get user data from route params or use defaults
      const userData = {
        name: route.params?.name || 'User',
        age: route.params?.age || 25,
        gender: route.params?.gender || 'Other',
        motivation: route.params?.motivation || '',
        struggling_emotions: Array.isArray(route.params?.struggling_emotions) ? route.params.struggling_emotions : [],
        self_relationship: Array.isArray(route.params?.self_relationship) ? route.params.self_relationship : [],
        inner_voice_change: Array.isArray(route.params?.inner_voice_change) ? route.params.inner_voice_change : [],
        current_self_talk: Array.isArray(route.params?.current_self_talk) ? route.params.current_self_talk : [],
        affirmation_tone: route.params?.affirmation_tone || '',
        wake_sleep_time: route.params?.wake_sleep_time || { wakeUp: { hour: 7, minute: 0 }, bedTime: { hour: 22, minute: 0 } },
        limiting_belief: beliefText,
      };

      // Generate transformation content
      const result = await appApiService.generateCoreBeliefTransformation(userData);

      // Update the belief with positive belief
      await supabase
        .from('beliefs')
        .update({
          positive_belief: result.positive_belief,
          updated_at: new Date().toISOString()
        })
        .eq('id', beliefId);

      // Save transformation content to ai_audio_content table
      const { data: inserted, error: contentError } = await supabase
        .from('ai_audio_content')
        .insert({
          user_id: user.id,
          belief_id: beliefId,
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
        errorHandlerService.logError(contentError instanceof Error ? contentError : new Error(String(contentError)), 'CORE_BELIEF_INPUT');
        return;
      }

      // Store the content without audio for now - audio will be generated after voice cloning
      await supabase
        .from('ai_audio_content')
        .update({
          content_metadata: {
            positive_belief: result.positive_belief,
            affirmations: result.affirmations,
            pep_talk: result.pep_talk,
            user_data: userData,
            full_text: result.transformation_text,
            audio_pending: true // Flag to indicate audio needs to be generated
          }
        })
        .eq('id', inserted.id);

      console.log('Background AI content generation completed successfully');
      
    } catch (error) {
      console.error('Error in background AI content generation:', error);
    }
  };

  return (
    <LinearGradient
      colors={[...foundations.gradients.welcomeScreen.colors]}
      start={foundations.gradients.welcomeScreen.start}
      end={foundations.gradients.welcomeScreen.end}
      style={styles.container}
    >
      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Title Above Input */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Start Your Transformation</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          {/* ChatGPT-style Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                setCharacterCount(200 - text.length);
              }}
              placeholder="What limiting belief do you want to transform?"
              placeholderTextColor="rgba(0, 0, 0, 0.6)"
              multiline
              maxLength={200}
              onFocus={() => setIsKeyboardOpen(true)}
              onBlur={() => setIsKeyboardOpen(false)}
              autoFocus={false}
              editable={true}
              selectTextOnFocus={false}
            />
            <View style={styles.inputFooter}>
              <Text style={styles.characterCount}>{characterCount}</Text>
            </View>
          </View>
        </View>

        {/* Spacer to center info container */}
        <Pressable 
          style={styles.spacer}
          onPress={() => {
            if (isKeyboardOpen) {
              Keyboard.dismiss();
              setIsKeyboardOpen(false);
            }
          }}
        />

        {/* Info Text in the middle */}
        <Pressable 
          style={styles.infoContainer}
          onPress={() => {
            if (isKeyboardOpen) {
              Keyboard.dismiss();
              setIsKeyboardOpen(false);
            }
          }}
        >
          <Text style={styles.infoTitle}>What is a core limiting belief?</Text>
          <Text style={styles.infoText}>
            A deeply held negative thought that holds you back from reaching your full potential.
          </Text>
          <Text style={styles.infoText}>
            Examples: "I'm not good enough", "I don't deserve success"
          </Text>
        </Pressable>

        {/* Spacer to push button to bottom */}
        <Pressable 
          style={styles.spacer}
          onPress={() => {
            if (isKeyboardOpen) {
              Keyboard.dismiss();
              setIsKeyboardOpen(false);
            }
          }}
        />

        {/* Button at the bottom */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.submitButton,
              pressed && { opacity: 0.8 },
              isLoading && { opacity: 0.8 },
              !inputText.trim() && { opacity: 0.3 }
            ]}
            onPress={addBelief}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <SoundWaveSpinner size="medium" color={foundations.colors.primary} />
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                Add Core Belief
              </Text>
            )}
          </Pressable>
        </View>
      </View>



    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: STATUSBAR_HEIGHT,
  },
  backArrowContainer: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT + spacing.sm,
    left: spacing.xl,
    zIndex: 1000,
    padding: spacing.sm,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: STATUSBAR_HEIGHT + spacing.xl,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...components.typography.display.medium,
    textAlign: 'center',
    marginBottom: foundations.spacing['2xl'],
    letterSpacing: -1,
    color: foundations.colors.textPrimary,
  },
  spacer: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  input: {
    fontSize: 16,
    fontFamily: fonts.families.regular,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.md,
    textAlignVertical: 'top',
    minHeight: 120,
    maxHeight: 200,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
  },

  infoContainer: {
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: fonts.families.semiBold,
    color: foundations.colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: fonts.families.regular,
    color: foundations.colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  submitButton: {
    borderWidth: 1,
    borderColor: foundations.colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: foundations.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    minHeight: 56,
  },
  submitButtonText: {
    color: foundations.colors.primary,
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

});

export default CoreBeliefInputScreen;
