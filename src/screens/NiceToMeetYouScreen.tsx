import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, { 
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Text } from '../components/base/Text';
import { theme, ScreenWrapper } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../hooks/useLanguage';
import LottieView from 'lottie-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const { foundations, components, utils } = theme;

interface NiceToMeetYouScreenProps {
  userName: string;
  onContinue: () => void;
}

export default function NiceToMeetYouScreen({ userName, onContinue }: NiceToMeetYouScreenProps) {
  const { t } = useLanguage();
  
  // Animation values
  const handshakeScale = useSharedValue(0.8);
  const handshakeOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  
  // Entry animation for the whole screen (scale in)
  const animationScale = useSharedValue(0.8);
  const animationContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animationScale.value }],
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  }));


  // Lottie container animation
  const handshakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: handshakeScale.value }],
    opacity: handshakeOpacity.value,
  }));





  // Text animation
  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  // Button animation
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  useEffect(() => {
    // Entry scale animation
    animationScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    // Lottie handshake animation
    handshakeOpacity.value = withDelay(500, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    handshakeScale.value = withDelay(
      500,
      withSequence(
        withTiming(1.1, { duration: 400, easing: Easing.out(Easing.back(1.2)) }),
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) })
      )
    );
    // Text animation
    textOpacity.value = withDelay(
      1200,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
    );
    textTranslateY.value = withDelay(
      1200,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.1)) })
    );
    // Button animation
    buttonOpacity.value = withDelay(
      1800,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    buttonTranslateY.value = withDelay(
      1800,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.1)) })
    );
  }, []);

  return (
    <ScreenWrapper contentStyle={styles.content}>
      <Animated.View style={animationContainerStyle}>
        {/* Handshake Animation */}
        <View style={styles.handshakeContainer}>
          <Animated.View style={[styles.lottieContainer, handshakeAnimatedStyle]}>
            <LottieView
              source={require('../../assets/animations/handshakeLoop.lottie')}
              autoPlay
              style={styles.lottieAnimation}
            />
          </Animated.View>
        </View>
        {/* Main Content */}
        <Animated.View style={[styles.textSection, textAnimatedStyle]}>
          <View style={styles.headerContainer}>
            <Text style={styles.greetingText}>
              Nice to meet you, {userName}!
            </Text>
          </View>
          <View style={styles.bodyContainer}>
            <Text style={styles.subtitleText}>
              We're excited to personalize your experience and help you on your journey.
            </Text>
          </View>
        </Animated.View>
        {/* Continue Button */}
        <Animated.View style={[styles.ctaSection, buttonAnimatedStyle]}>
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
            <Text 
              style={[
                components.button.typography.lg,
                { 
                  color: foundations.colors.textLight,
                  textAlign: 'center',
                  flexShrink: 1
                }
              ]}
              numberOfLines={1}
            >
              Continue
            </Text>
          </Pressable>
        </Animated.View>
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
  handshakeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 44,
    marginBottom: foundations.spacing.xs,
  },
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  textSection: {
    alignItems: 'center',
    maxWidth: screenWidth * 0.9,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  greetingText: {
    ...components.typography.display.large,
    textAlign: 'center',
    marginBottom: foundations.spacing['2xl'],
    letterSpacing: -1,
    color: foundations.colors.textPrimary,
  },
  bodyContainer: {
    alignItems: 'center',
    width: '100%',
  },
  subtitleText: {
    ...components.typography.subtitle,
    textAlign: 'center',
    marginBottom: foundations.spacing.md,
  },
  ctaSection: {
    paddingHorizontal: 16,
    paddingBottom: foundations.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
}); 