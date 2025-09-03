import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants';
import { Feather } from '@expo/vector-icons';
import SoundWaveSpinner from '../SoundWaveSpinner';
import { CircularProgress } from 'react-native-circular-progress';

const { colors, spacing, radii, gradients } = theme.foundations;
const { button } = theme.components;
const { utils } = theme;

// Reusable Skeleton Component
interface SkeletonProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  backgroundColor?: string;
  style?: any;
  isActive?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = 100, 
  height = 16, 
  borderRadius = 4, 
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  style,
  isActive = true 
}) => {
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonOpacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      skeletonOpacity.setValue(0.3);
    }
  }, [isActive, skeletonOpacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity: skeletonOpacity,
        },
        style,
      ]}
    />
  );
};

// Modern Skeleton Card Overlay Component
interface ModernSkeletonOverlayProps {
  children: React.ReactNode;
  isLoading: boolean;
  style?: any;
  cardBackgroundColor?: string;
}

export const ModernSkeletonOverlay: React.FC<ModernSkeletonOverlayProps> = ({ 
  children, 
  isLoading, 
  style,
  cardBackgroundColor = 'white'
}) => {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(0)).current;

  // Determine skeleton colors based on card background
  const isPurpleCard = cardBackgroundColor?.includes('purple') || cardBackgroundColor?.includes('gradient');
  const isLightPurpleCard = cardBackgroundColor?.includes('f6f3ff') || cardBackgroundColor?.includes('f3f4f6');
  const skeletonColor = (isPurpleCard || isLightPurpleCard) ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255, 255, 255, 0.3)'; // App primary purple for purple cards, white for white cards

  useEffect(() => {
    if (isLoading) {
      // Hide content and show skeleton
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Show content and hide skeleton
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, contentOpacity, skeletonOpacity]);

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Content */}
      <Animated.View style={{ opacity: contentOpacity }}>
        {children}
      </Animated.View>
      
              {/* Modern Skeleton Overlay */}
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: skeletonOpacity,
              zIndex: 10,
            }
          ]}
        >
          {/* Content Placeholder Shapes */}
          <View style={{ padding: 16, gap: 12 }}>
            {/* Title placeholder */}
            <View style={{ 
              height: 24, 
              backgroundColor: skeletonColor, 
              borderRadius: 6,
              width: '70%',
            }} />
            
            {/* Text placeholder */}
            <View style={{ 
              height: 16, 
              backgroundColor: skeletonColor, 
              borderRadius: 4,
              width: '90%',
            }} />
            <View style={{ 
              height: 16, 
              backgroundColor: skeletonColor, 
              borderRadius: 4,
              width: '60%',
            }} />
            
            {/* Additional content placeholder */}
            <View style={{ 
              height: 80, 
              backgroundColor: skeletonColor, 
              borderRadius: 8,
              width: '100%',
            }} />
          </View>
        </Animated.View>
    </View>
  );
};

// Reusable Skeleton Content Overlay Component
interface SkeletonContentOverlayProps {
  children: React.ReactNode;
  isLoading: boolean;
  skeletonColor?: string;
  style?: any;
}

export const SkeletonContentOverlay: React.FC<SkeletonContentOverlayProps> = ({ 
  children, 
  isLoading, 
  skeletonColor = 'rgba(128, 128, 128, 0.4)',
  style 
}) => {
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      // Hide content
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Show content with animation
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, contentOpacity]);

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Content */}
      <Animated.View style={{ opacity: contentOpacity }}>
        {children}
      </Animated.View>
      
      {/* Skeleton Overlay - only shows when loading */}
      {isLoading && (
        <View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: skeletonColor,
              zIndex: 10,
            }
          ]}
        />
      )}
    </View>
  );
};

// Reusable Skeleton Card Overlay Component (keeping for backward compatibility)
interface SkeletonCardOverlayProps {
  children: React.ReactNode;
  isLoading: boolean;
  skeletonColor?: string;
  style?: any;
}

export const SkeletonCardOverlay: React.FC<SkeletonCardOverlayProps> = ({ 
  children, 
  isLoading, 
  skeletonColor = 'rgba(128, 128, 128, 0.3)',
  style 
}) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      // Show skeleton overlay
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Hide content
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Hide skeleton overlay
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Show content with animation
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, overlayOpacity, contentOpacity]);

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Content */}
      <Animated.View style={{ opacity: contentOpacity }}>
        {children}
      </Animated.View>
      
      {/* Skeleton Overlay */}
      <Animated.View 
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: skeletonColor,
            opacity: overlayOpacity,
            zIndex: 10,
          }
        ]}
      />
    </View>
  );
};

interface InfoContainerProps {
  title: string;
  text: string;
  style?: any;
  showProgress?: boolean;
  progressValue?: number;
  progressMax?: number;
  showButton?: boolean;
  buttonText?: string;
  onButtonPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  showInput?: boolean;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (text: string) => void;
  buttonStyle?: 'default' | 'purple';
  // Multiple buttons support
  showMultipleButtons?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryButtonPress?: () => void;
  onSecondaryButtonPress?: () => void;
  // Audio player support
  showAudioPlayer?: boolean;
  audioTitle?: string;
  audioDuration?: number;
  audioUrl?: string;
  onAudioPlay?: () => void;
  onAudioPause?: () => void;
  isAudioPlaying?: boolean;
  audioProgress?: number;
  isLoopEnabled?: boolean;
  onToggleLoop?: () => void;
  // Skeleton loading support
  isLoading?: boolean;
  skeletonTitleWidth?: number;
  skeletonTextLines?: number;
  skeletonTextWidth?: number;
  // Belief progress support
  showBeliefProgress?: boolean;
  beliefProgressTitle?: string;
  beliefProgressPercentage?: number;
  showCircularProgress?: boolean;
  circularProgressPercentage?: number;
  // Text styling support
  textStyle?: 'default' | 'italic-centered';
}

const InfoContainer: React.FC<InfoContainerProps> = ({ title, text, style, showProgress = false, progressValue = 0, progressMax = 2, showButton = false, buttonText = '', onButtonPress, backgroundColor, textColor: customTextColor, showInput = false, inputPlaceholder = '', inputValue = '', onInputChange, buttonStyle = 'default', showMultipleButtons = false, primaryButtonText = '', secondaryButtonText = '', onPrimaryButtonPress, onSecondaryButtonPress, showAudioPlayer = false, audioTitle = '', audioDuration = 0, audioUrl = '', onAudioPlay, onAudioPause, isAudioPlaying = false, audioProgress = 0, isLoopEnabled = false, onToggleLoop, isLoading = false, skeletonTitleWidth = 200, skeletonTextLines = 2, skeletonTextWidth = 280, showBeliefProgress = false, beliefProgressTitle = '', beliefProgressPercentage = 0, showCircularProgress = false, circularProgressPercentage = 0, textStyle = 'default' }) => {
  // Debug logging
  const progressPercentage = progressMax > 0 ? (progressValue / progressMax) * 100 : 0;
  const isWhiteBackground = backgroundColor === colors.surface || backgroundColor === '#FFFFFF';
  const textColor = customTextColor || (isWhiteBackground ? colors.textPrimary : colors.textLight);
  


  // Animated value for circular progress
  const [animatedFillValue, setAnimatedFillValue] = useState(0);

  useEffect(() => {
    if (showCircularProgress) {
      setAnimatedFillValue(0);
      const timer = setTimeout(() => {
        setAnimatedFillValue(circularProgressPercentage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [circularProgressPercentage, showCircularProgress]);


  // Skeleton components using reusable Skeleton
  const SkeletonTitle = () => (
    <Skeleton 
      width={skeletonTitleWidth}
      height={24}
      style={styles.skeletonTitle}
      isActive={isLoading}
    />
  );

  const SkeletonText = () => (
    <View style={styles.skeletonTextContainer}>
      {Array.from({ length: skeletonTextLines }, (_, index) => (
        <Skeleton
          key={index}
          width={index === skeletonTextLines - 1 ? skeletonTextWidth * 0.7 : skeletonTextWidth}
          height={16}
          style={styles.skeletonTextLine}
          isActive={isLoading}
        />
      ))}
    </View>
  );

  const SkeletonProgress = () => (
    <View style={styles.progressContainer}>
      <Skeleton 
        width={60}
        height={60}
        borderRadius={30}
        style={styles.skeletonProgressCircle}
        isActive={isLoading}
      />
      <Skeleton 
        width={80}
        height={12}
        style={styles.skeletonProgressLabel}
        isActive={isLoading}
      />
    </View>
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor || colors.primary }, style]}>
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          {isLoading ? (
            <>
              <SkeletonTitle />
              <SkeletonText />
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: textColor }]}>{title}</Text>
              <Text style={[
                styles.text, 
                { color: textColor },
                textStyle === 'italic-centered' && {
                  fontStyle: 'italic',
                  textAlign: 'center',
                  fontSize: theme.foundations.fonts.sizes.lg,
                  fontFamily: theme.foundations.fonts.families.medium,
                  lineHeight: theme.foundations.fonts.sizes.lg * 1.4,
                }
              ]}>{text}</Text>
              {showInput && (
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder={inputPlaceholder}
                  placeholderTextColor={isWhiteBackground ? colors.textSecondary : 'rgba(255, 255, 255, 0.7)'}
                  value={inputValue}
                  onChangeText={onInputChange}
                  multiline={true}
                  numberOfLines={3}
                />
              )}
            </>
          )}
        </View>
        {showProgress && (
          isLoading ? (
            <SkeletonProgress />
          ) : (
            <View style={styles.progressContainer}>
              <View style={styles.progressCircle}>
                <View style={[styles.progressBackground, { 
                  borderColor: progressValue > 0 ? (colors.border || '#D1D5DB') : 'rgba(229, 231, 235, 0.3)'
                }]} />
                {progressValue > 0 && (
                  <View style={[styles.progressFill, { 
                    transform: [{ rotate: '-90deg' }],
                    borderTopColor: progressValue >= 1 ? colors.primary : 'transparent',
                    borderRightColor: progressValue >= 2 ? colors.primary : 'transparent',
                    borderBottomColor: progressValue >= 3 ? colors.primary : 'transparent',
                    borderLeftColor: progressValue >= 4 ? colors.primary : 'transparent',
                  }]} />
                )}
                <Text style={[styles.progressText, { color: textColor }]}>{progressValue}/{progressMax}</Text>
              </View>
              <Text style={[styles.progressLabel, { color: textColor }]}>Daily Sessions</Text>
            </View>
          )
        )}
      </View>
      
      {/* Belief Progress Section */}
      {showBeliefProgress && (
        <View style={styles.beliefProgressContainer}>
          <Text style={[styles.text, { color: textColor, fontSize: theme.foundations.fonts.sizes.xl, fontFamily: theme.foundations.fonts.families.bold, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: spacing.md }]}>
            {beliefProgressTitle}
          </Text>
          {showCircularProgress && (
            <View style={styles.circularProgressContainer}>
              <CircularProgress
                size={120}
                width={12}
                fill={animatedFillValue}
                tintColor={colors.background}
                backgroundColor="transparent"
                rotation={0}
                lineCap="round"
                arcSweepAngle={360}
              />
              <View style={styles.circularProgressTextContainer}>
                <Text style={[styles.circularProgressText, { color: textColor }]}>
                  {Math.round(circularProgressPercentage)}%
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
      
      {showAudioPlayer && (
        <View style={styles.audioPlayerContainer}>
          {audioTitle && (
            <View style={styles.audioTitleContainer}>
              <Text style={styles.audioTitleText}>
                {audioTitle}
              </Text>
            </View>
          )}
          <View style={styles.audioPlayerContent}>
                                    <Pressable 
              style={({ pressed }) => [
                styles.audioPlayButton,
                pressed && {
                  transform: [{ scale: 0.95 }],
                  shadowOpacity: 0.3,
                }
              ]}
              onPress={isAudioPlaying ? onAudioPause : onAudioPlay}
              disabled={isLoading}
            >
              {isLoading ? (
                <SoundWaveSpinner size="small" />
              ) : (
                <Feather 
                  name={isAudioPlaying ? 'pause' : 'play'} 
                  size={22} 
                  color={colors.textLight} 
                  style={{ marginLeft: isAudioPlaying ? -1 : 1 }}
                />
              )}
            </Pressable>
                          <View style={styles.audioProgressContainer}>
                <View style={styles.waveformProgressContainer}>
                  {Array.from({ length: 40 }, (_, index) => {
                    const isFilled = (index / 40) * 100 <= audioProgress;
                    
                    // Create a more dynamic and realistic waveform pattern
                    const intensityPattern = [
                      3, 5, 8, 12, 16, 20, 22, 18, 14, 10, 8, 12, 16, 20, 18, 15, 12, 8, 6, 9,
                      12, 16, 20, 18, 14, 10, 7, 9, 13, 17, 19, 16, 12, 8, 11, 15, 18, 16, 12, 8
                    ];
                    const barHeight = intensityPattern[index];
                    
                    return (
                      <View
                        key={index}
                        style={[
                          styles.waveformBar,
                          {
                            height: barHeight,
                            backgroundColor: isFilled ? colors.textLight : 'rgba(255, 255, 255, 0.15)',
                            opacity: isFilled ? 1 : 0.3,
                            borderRadius: isFilled ? 1.5 : 1,
                            shadowColor: isFilled ? colors.textLight : 'transparent',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: isFilled ? 0.4 : 0,
                            shadowRadius: 2,
                            elevation: isFilled ? 2 : 0,
                          }
                        ]}
                      />
                    );
                  })}
                </View>
                <View style={styles.audioTimeRow}>
                  <Text style={styles.audioTimeText}>
                    {formatTime(audioProgress * audioDuration / 100)} / {formatTime(audioDuration)}
                  </Text>
                  <Pressable onPress={onToggleLoop} style={styles.loopButton}>
                    <Feather 
                      name="repeat" 
                      size={12} 
                      color={isLoopEnabled ? colors.textLight : 'rgba(255, 255, 255, 0.6)'} 
                    />
                  </Pressable>
                </View>
              </View>
          </View>
          
          
        </View>
      )}
              {showMultipleButtons ? (
          <View style={styles.multipleButtonsContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.smallButton,
                buttonStyle === 'purple' ? { borderColor: colors.primary } : { borderColor: textColor },
                pressed && (buttonStyle === 'purple' ? styles.purpleButtonPressed : styles.transparentButtonPressed)
              ]} 
              onPress={onPrimaryButtonPress}
            >
              <Text style={[styles.smallButtonText, { color: buttonStyle === 'purple' ? colors.primary : textColor }]}>
                {primaryButtonText}
              </Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.smallButton,
                buttonStyle === 'purple' ? { borderColor: colors.primary } : { borderColor: textColor },
                pressed && (buttonStyle === 'purple' ? styles.purpleButtonPressed : styles.transparentButtonPressed)
              ]} 
              onPress={onSecondaryButtonPress}
            >
              <Text style={[styles.smallButtonText, { color: buttonStyle === 'purple' ? colors.primary : textColor }]}>
                {secondaryButtonText}
              </Text>
            </Pressable>
          </View>
        ) : showButton && (
          <View style={styles.buttonContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.transparentButton,
                buttonStyle === 'purple' ? { borderColor: colors.primary } : { borderColor: textColor },
                pressed && (buttonStyle === 'purple' ? styles.purpleButtonPressed : styles.transparentButtonPressed)
              ]} 
              onPress={onButtonPress}
            >
              <Text style={[styles.transparentButtonText, { color: buttonStyle === 'purple' ? colors.primary : textColor }]}>
                {buttonText}
              </Text>
            </Pressable>
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    marginHorizontal: spacing.xs,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.border || '#D1D5DB',
  },
  progressFill: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  progressText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.textLight,
  },
  progressLabel: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.xl,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multipleButtonsContainer: {
    marginTop: spacing.xl,
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing.sm,
  },
  smallButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  transparentButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
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
    marginBottom: spacing.sm,
  },
  transparentButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  purpleButtonPressed: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  transparentButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: theme.foundations.fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: {
    width: '100%',
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  // Audio player styles
  audioPlayerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 18,
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  audioTitleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  audioTitleText: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: theme.foundations.fonts.sizes.base * 1.4,
  },
  audioPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: spacing.md,
  },
  audioPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    paddingLeft: 2, // Small adjustment for play icon centering
  },
  audioProgressContainer: {
    flex: 1,
    position: 'relative',
  },
  waveformProgressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 26,
    gap: 1.5,
    marginBottom: spacing.sm,
    paddingHorizontal: 3,
    flex: 1,
    justifyContent: 'space-between',
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.25,
    minHeight: 3,
  },

  audioTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioTimeText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.semiBold,
    opacity: 0.9,
    color: colors.textLight,
  },
  loopButton: {
    padding: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Skeleton styles
  skeletonTitle: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  skeletonTextContainer: {
    gap: spacing.xs,
  },
  skeletonTextLine: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
  },
  skeletonProgressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: spacing.xs,
  },
  skeletonProgressLabel: {
    width: 80,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
  },

  // Belief Progress styles
  beliefProgressContainer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  beliefProgressTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    marginBottom: spacing.md,
    textAlign: 'left',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textLight,
    paddingLeft: spacing.sm,
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  circularProgressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressText: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
  },

});

export default InfoContainer; 