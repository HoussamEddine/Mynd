import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface VoicePreviewPlayerProps {
  audioUrl: string;
  duration?: number;
}

export default function VoicePreviewPlayer({ audioUrl, duration = 0 }: VoicePreviewPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>(Array(30).fill(20));

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUrl]);

  const loadAudio = async () => {
    try {
      // Handle demo audio URL
      if (audioUrl === 'demo_audio_url' || audioUrl === 'demo-audio-url') {
        console.log('[VOICE_PREVIEW] Demo audio detected, simulating playback');
        // Don't load actual audio for demo, just simulate
        return;
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / (status.durationMillis || 1));
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const togglePlayback = async () => {
    try {
      // Handle demo audio playback
      if (audioUrl === 'demo_audio_url' || audioUrl === 'demo-audio-url') {
        console.log('[VOICE_PREVIEW] Demo playback toggled');
        if (isPlaying) {
          setIsPlaying(false);
          setPosition(0);
        } else {
          setIsPlaying(true);
          // Simulate audio playback for demo
          simulateDemoPlayback();
        }
        return;
      }
      
      if (!sound) return;
      
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const simulateDemoPlayback = () => {
    const demoDuration = duration * 1000 || 3000; // Use actual duration or 3 seconds fallback
    const interval = 50; // Update every 50ms
    let currentTime = 0;
    
    const timer = setInterval(() => {
      currentTime += interval;
      const progress = currentTime / demoDuration;
      
      if (progress >= 1) {
        setPosition(0);
        setIsPlaying(false);
        clearInterval(timer);
      } else {
        setPosition(progress);
      }
    }, interval);
  };

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progressStroke = circumference * (1 - position);

  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        <Pressable onPress={togglePlayback} style={styles.playButton}>
          <Svg width={60} height={60} style={styles.progressRing}>
            <Circle
              cx={30}
              cy={30}
              r={26}
              stroke="rgba(139, 92, 246, 0.2)"
              strokeWidth={2}
              fill="transparent"
            />
            <Circle
              cx={30}
              cy={30}
              r={26}
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={progressStroke}
              transform="rotate(-90 30 30)"
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.playIcon}>
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="#FFFFFF"
              style={{ marginLeft: isPlaying ? 0 : 2 }}
            />
          </View>
        </Pressable>

        <View style={styles.waveformContainer}>
          {waveformHeights.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(height, 8) + (isPlaying && index / waveformHeights.length < position ? 8 : 0),
                  backgroundColor: index / waveformHeights.length < position ? '#8b5cf6' : 'rgba(255, 255, 255, 0.3)',
                  opacity: index / waveformHeights.length < position ? 1 : 0.6
                }
              ]}
            />
          ))}
        </View>

        <View style={styles.durationContainer}>
          <Text style={styles.duration}>
            {formatDuration(duration)}
          </Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill,
              { width: `${position * 100}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 0,
    marginVertical: 20,
    alignItems: 'center',
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    width: '100%',
    maxWidth: 280,
    justifyContent: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playIcon: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 2,
    marginRight: 12,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  durationContainer: {
    alignItems: 'center',
  },
  duration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 35,
  },
  progressRing: {
    // Remove the transform since we're handling it in the SVG
  },
  progressContainer: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressTrack: {
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 1,
  },
}); 