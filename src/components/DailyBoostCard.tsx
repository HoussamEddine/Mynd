import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { audioGenerationService } from '../services/audioGenerationService';
import { aiContentService } from '../services/aiContentService';
import { userDataService } from '../services/userDataService';
import { useAuth } from '../contexts/AuthContext';
import SoundWaveSpinner from './SoundWaveSpinner';
import { supabase } from '../lib/supabase';

const { colors, spacing, radii } = theme.foundations;
const { button } = theme.components;
const { width: screenWidth } = Dimensions.get('window');
const cardWidth = Math.round(screenWidth * 0.6);

interface DailyBoostCardProps {
  affirmationText: string;
}

const DailyBoostCard: React.FC<DailyBoostCardProps> = ({ affirmationText }) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dailyBoostText, setDailyBoostText] = useState<string>('');
  const [transformationId, setTransformationId] = useState<string | null>(null);

  // Load daily boost text from cached AI content
  useEffect(() => {
    const loadDailyBoost = async () => {
      if (!user?.id) return;

      try {
        // Get daily boost text from cached AI content
        const aiContent = await aiContentService.getAIContent(user.id);
        if (aiContent?.pep_talk) {
          setDailyBoostText(aiContent.pep_talk);
        }

        // Get transformation ID for audio generation
        const { data: beliefs } = await supabase
          .from('beliefs')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (beliefs && beliefs.length > 0) {
          setTransformationId(beliefs[0].id);
        }
      } catch (error) {
        console.error('Error loading daily boost:', error);
      }
    };

    loadDailyBoost();
  }, [user?.id]);

  const handlePlayPause = async () => {
    if (!user?.id || !dailyBoostText) return;

    if (isPlaying) {
      // Stop playback
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      // Play existing audio
      setIsPlaying(true);
      return;
    }

    // Generate new audio
    setIsGenerating(true);
    try {
      const userVoiceId = await userDataService.getVoiceId(user.id);
      if (!userVoiceId) {
        console.log('No voice ID available for audio generation');
        return;
      }

      // Try to get cached audio URL first
      const cachedAudioUrl = await audioGenerationService.getStoredDailyBoostAudio(
        dailyBoostText,
        userVoiceId,
        transformationId || ''
      );

      if (cachedAudioUrl) {
        setAudioUrl(cachedAudioUrl);
        setIsPlaying(true);
        return;
      }

      // Generate new audio
      const result = await audioGenerationService.generateAudioForDailyBoost(
        dailyBoostText,
        userVoiceId,
        transformationId || ''
      );

      if (result.success && result.audio_url) {
        setAudioUrl(result.audio_url);
        setIsPlaying(true);
      } else {
        console.log('Failed to generate audio for daily boost');
      }
    } catch (error) {
      console.error('Error generating audio for daily boost:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reusable audio container (keeps original layout)
  const AudioContainer = () => (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.purpleCard}
    >
      <Text style={styles.boostText}>
        {dailyBoostText ? dailyBoostText.split('.')[0] + '.' : ''}
      </Text>
      
      <View style={styles.audioPlayerContainer}>
        <View style={styles.audioPlayerContent}>
          <Pressable 
            style={({ pressed }) => [
              styles.audioPlayButton,
              pressed && {
                transform: [{ scale: 0.95 }],
                shadowOpacity: 0.3,
              }
            ]}
            onPress={handlePlayPause}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <SoundWaveSpinner size="small" />
            ) : (
              <Feather 
                name={isPlaying ? 'pause' : 'play'} 
                size={22} 
                color={colors.textLight} 
                style={{ marginLeft: isPlaying ? 0 : 1 }}
              />
            )}
          </Pressable>
          
          <View style={styles.audioProgressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${isPlaying ? 50 : 0}%` }]} />
              <View style={[styles.progressThumb, { left: `${isPlaying ? 50 : 0}%` }]} />
            </View>
            <View style={styles.audioTimeRow}>
              <Text style={styles.audioTimeText}>
                {isPlaying ? formatTime(15) : formatTime(0)}
              </Text>
              <Text style={styles.audioTimeText}>
                {formatTime(80)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Boost</Text>
      </View>
      
      <Text style={styles.subtitle}>A quick dose of inspiration to guide your day.</Text>

      <View style={styles.content}>
        {dailyBoostText ? (
          // For now we render two items if a second audio exists. This preserves the player UI.
          // Replace the array below with real additional items when available.
          [dailyBoostText, dailyBoostText].length > 1 ? (
            <View style={styles.scrollerBleed}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {[dailyBoostText, dailyBoostText].map((text, idx, arr) => (
                  <View
                    key={idx}
                    style={[
                      styles.listItemWrapper,
                      idx === arr.length - 1 && { marginRight: 0 },
                    ]}
                  >
                    <AudioContainer />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={[styles.listItemWrapper, { alignSelf: 'center' }]}>
              <AudioContainer />
            </View>
          )
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    marginHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    
    marginBottom: spacing.lg,
  },
  content: {
    gap: spacing.md,
  },
  scrollerBleed: {
    marginHorizontal: -spacing.lg,
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
  },
  listItemWrapper: {
    width: cardWidth,
    marginRight: spacing.sm,
  },
  purpleCard: {
    borderRadius: 12,
    padding: spacing.lg,
    minHeight: 250,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostText: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    lineHeight: theme.foundations.fonts.sizes.lg * 1.4,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  audioPlayerContainer: {
    padding: spacing.md,
  },
  audioPlayerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  audioPlayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    marginTop: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  audioProgressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.textLight,
    borderRadius: 4,
  },
  progressThumb: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textLight,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  audioTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioTimeText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
  },
});

export default DailyBoostCard; 