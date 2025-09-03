import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import SoundWaveSpinner from './SoundWaveSpinner';

const { colors, spacing, radii } = theme.foundations;
const { width: screenWidth } = Dimensions.get('window');
const cardWidth = Math.round(screenWidth * 0.6);

interface CustomTrack {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
}

interface CustomTracksGridProps {
  onTrackPress?: (trackId: string) => void;
}

const CustomTracksGrid: React.FC<CustomTracksGridProps> = ({ onTrackPress }) => {
  const { user } = useAuth();
  const [generatingTrack, setGeneratingTrack] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const customTracks: CustomTrack[] = [
    {
      id: 'sleep-rewiring',
      title: 'Sleep Rewiring',
      description: 'Peaceful sleep transformation',
      icon: 'moon',
      duration: '8 min'
    },
    {
      id: 'morning-power',
      title: 'Morning Power',
      description: 'Energize your day',
      icon: 'sun',
      duration: '5 min'
    },
    {
      id: 'confidence-surge',
      title: 'Confidence Surge',
      description: 'Before big moments',
      icon: 'zap',
      duration: '6 min'
    },
    {
      id: 'overcoming-fear',
      title: 'Overcoming Fear',
      description: 'Calm anxiety',
      icon: 'heart',
      duration: '7 min'
    },
    {
      id: 'love-connection',
      title: 'Love & Connection',
      description: 'Heal relationships',
      icon: 'users',
      duration: '9 min'
    },
    {
      id: 'resilience-recharge',
      title: 'Resilience Recharge',
      description: 'Bounce back stronger',
      icon: 'refresh-cw',
      duration: '6 min'
    }
  ];

  const handleTrackPress = async (track: CustomTrack) => {
    if (!user?.id) return;

    if (playingTrack === track.id) {
      // Stop playing
      setPlayingTrack(null);
      return;
    }

    if (generatingTrack === track.id) {
      // Already generating
      return;
    }

    // Start generating
    setGeneratingTrack(track.id);
    
    try {
      // TODO: Implement audio generation logic
      // const result = await audioGenerationService.generateCustomTrack(track.id, user.id);
      
      // Simulate generation time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGeneratingTrack(null);
      setPlayingTrack(track.id);
      
      onTrackPress?.(track.id);
    } catch (error) {
      console.error('Error generating custom track:', error);
      setGeneratingTrack(null);
    }
  };

  const getTrackStatus = (track: CustomTrack) => {
    if (generatingTrack === track.id) {
      return 'generating';
    }
    if (playingTrack === track.id) {
      return 'playing';
    }
    return 'idle';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reusable track container (copied from DailyBoostCard structure)
  const TrackContainer = ({ track }: { track: CustomTrack }) => {
    const status = getTrackStatus(track);
    const isSleepTrack = track.id === 'sleep-rewiring';
    
    const CardContent = () => (
      <>
        <View style={styles.trackHeader}>
          <Feather 
            name={track.icon as any} 
            size={24} 
            color={colors.textLight} 
          />
          <Text style={styles.duration}>{track.duration}</Text>
        </View>
        
        <Text style={styles.trackTitle}>
          {track.title}
        </Text>
        
        <Text style={styles.trackDescription}>
          {track.description}
        </Text>
        
        <View style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.startTrackButton,
              pressed && {
                transform: [{ scale: 0.95 }],
                shadowOpacity: 0.3,
              }
            ]}
            onPress={() => handleTrackPress(track)}
            disabled={status === 'generating'}
          >
            {status === 'generating' ? (
              <SoundWaveSpinner size="small" />
            ) : (
              <Text style={styles.startTrackButtonText}>Start Track</Text>
            )}
          </Pressable>
        </View>
      </>
    );
    
    if (isSleepTrack) {
      return (
        <ImageBackground 
          source={require('../../assets/images/Tracks/Sleep.jpg')}
          style={styles.sleepCard}
          imageStyle={styles.sleepCardImage}
        >
          <View style={styles.sleepOverlay}>
            <CardContent />
          </View>
        </ImageBackground>
      );
    }
    
    return (
      <View style={styles.purpleCard}>
        <CardContent />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Custom Tracks</Text>
      </View>
      
      <Text style={styles.subtitle}>Curated experiences for every part of your day</Text>

      <View style={styles.content}>
        {customTracks.length > 1 ? (
          <View style={styles.scrollerBleed}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {customTracks.map((track, idx, arr) => (
                <View
                  key={track.id}
                  style={[
                    styles.listItemWrapper,
                    idx === arr.length - 1 && { marginRight: 0 },
                  ]}
                >
                  <TrackContainer track={track} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={[styles.listItemWrapper, { alignSelf: 'center' }]}>
            <TrackContainer track={customTracks[0]} />
          </View>
        )}
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
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 240,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },

  duration: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
    opacity: 0.9,
  },
  trackTitle: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    lineHeight: theme.foundations.fonts.sizes.lg * 1.4,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  trackDescription: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    textAlign: 'center',
    marginBottom: spacing.xl,
    opacity: 0.9,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  startTrackButton: {
    borderWidth: 1,
    borderColor: colors.textLight,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  startTrackButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sleepCard: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 240,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  sleepCardImage: {
    borderRadius: 12,
    width: '100%',
    height: '100%',
  },
  sleepOverlay: {
    flex: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomTracksGrid; 