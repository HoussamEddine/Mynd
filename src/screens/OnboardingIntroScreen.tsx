import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import Animated, { 
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Text } from '../components/base/Text';
import { theme, ScreenWrapper } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const { foundations, components, utils } = theme;

interface OnboardingIntroScreenProps {
  onStartQuestionnaire: () => void;
}

export default function OnboardingIntroScreen({ onStartQuestionnaire }: OnboardingIntroScreenProps) {
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

  // Animation values - start with some opacity for fallback
  const titleOpacity = useSharedValue(0.3);
  const titleTranslateY = useSharedValue(20);
  const bodyOpacity = useSharedValue(0.3);
  const bodyTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0.3);
  const buttonTranslateY = useSharedValue(20);
  const animationScale = useSharedValue(0.8);

  // Questionnaire opening animation values
  const bookOpacity = useSharedValue(0);
  const bookRotation = useSharedValue(-15);
  const page1Opacity = useSharedValue(0);
  const page1TranslateX = useSharedValue(-20);
  const page2Opacity = useSharedValue(0);
  const page2TranslateX = useSharedValue(-15);
  const page3Opacity = useSharedValue(0);
  const page3TranslateX = useSharedValue(-10);
  const questionMarkOpacity = useSharedValue(0);
  const questionMarkScale = useSharedValue(0.5);
  const questionMarkBounce = useSharedValue(0);
  const cursorOpacity = useSharedValue(0);
  const cursorBlink = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);

  // Animation styles
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const bodyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
    transform: [{ translateY: bodyTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const animationContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animationScale.value }],
  }));

  // Questionnaire opening animated styles
  const bookAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bookOpacity.value,
    transform: [{ rotateY: `${bookRotation.value}deg` }],
  }));

  const page1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: page1Opacity.value,
    transform: [{ translateX: page1TranslateX.value }],
  }));

  const page2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: page2Opacity.value,
    transform: [{ translateX: page2TranslateX.value }],
  }));

  const page3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: page3Opacity.value,
    transform: [{ translateX: page3TranslateX.value }],
  }));

  const questionMarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionMarkOpacity.value,
    transform: [
      { scale: questionMarkScale.value },
      { translateY: questionMarkBounce.value }
    ] as any,
  }));

  const cursorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value * cursorBlink.value,
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  // Questionnaire opening animation sequence
  useEffect(() => {
    // Container entrance
    animationScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });

    // PHASE 1: Book/journal appears (foundation of questions)
    bookOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
    );
    bookRotation.value = withDelay(
      400,
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.back(1.2)) })
    );

    // PHASE 2: Pages unfold one by one (questions revealing)
    page1Opacity.value = withDelay(
      1200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    page1TranslateX.value = withDelay(
      1200,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.1)) })
    );

    page2Opacity.value = withDelay(
      1600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    page2TranslateX.value = withDelay(
      1600,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.1)) })
    );

    page3Opacity.value = withDelay(
      2000,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    page3TranslateX.value = withDelay(
      2000,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.1)) })
    );

    // PHASE 3: Question mark appears (curiosity awakens)
    questionMarkOpacity.value = withDelay(
      2600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    questionMarkScale.value = withDelay(
      2600,
      withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
      )
    );

    // PHASE 4: Question mark gentle bounce (inviting interaction)
    questionMarkBounce.value = withDelay(
      3200,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // PHASE 5: Cursor appears (ready to respond)
    cursorOpacity.value = withDelay(
      3800,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    // PHASE 6: Cursor blinks (awaiting input)
    cursorBlink.value = withDelay(
      4000,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 500, easing: Easing.linear }),
          withTiming(1, { duration: 500, easing: Easing.linear })
        ),
        -1,
        true
      )
    );

    // PHASE 7: Subtle sparkles (insights waiting to be discovered)
    sparkleOpacity.value = withDelay(
      4500,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.6, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 1200, easing: Easing.out(Easing.quad) })
        ),
        -1,
        false
      )
    );
    sparkleRotation.value = withDelay(
      4500,
      withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Text animations (immediate reveal)
    titleOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) })
    );
    titleTranslateY.value = withDelay(
      300,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) })
    );

    bodyOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) })
    );
    bodyTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) })
    );

    buttonOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) })
    );
    buttonTranslateY.value = withDelay(
      500,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) })
    );
  }, []);

  return (
    <ScreenWrapper contentStyle={styles.content}>
      <StatusBar barStyle="dark-content" backgroundColor={foundations.colors.background} />
      
      <View style={styles.content}>
        {/* Animation Container */}
        <Animated.View style={[styles.animationContainer, animationContainerStyle]}>
          <View style={styles.animationPlaceholder}>
            {/* Book/Journal base */}
            <Animated.View style={[styles.book, bookAnimatedStyle]} />
            
            {/* Pages unfolding */}
            <Animated.View style={[styles.page, styles.page1, page1AnimatedStyle]} />
            <Animated.View style={[styles.page, styles.page2, page2AnimatedStyle]} />
            <Animated.View style={[styles.page, styles.page3, page3AnimatedStyle]} />
            
            {/* Question mark */}
            <Animated.View style={[styles.questionMark, questionMarkAnimatedStyle]}>
              <Text style={styles.questionMarkText}>?</Text>
            </Animated.View>
            
            {/* Cursor */}
            <Animated.View style={[styles.cursor, cursorAnimatedStyle]} />
            
            {/* Subtle sparkles */}
            <Animated.View style={[styles.sparkleContainer, sparkleAnimatedStyle]}>
              <View style={[styles.sparkle, styles.sparkle1]} />
              <View style={[styles.sparkle, styles.sparkle2]} />
              <View style={[styles.sparkle, styles.sparkle3]} />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Content */}
        <View style={styles.textContent}>
          {/* Header */}
          <Animated.View style={[styles.headerContainer, titleAnimatedStyle]}>
            <Text style={styles.headerText}>
              Let's Personalize Your Experience
            </Text>
          </Animated.View>

          {/* Body Text */}
          <Animated.View style={[styles.bodyContainer, bodyAnimatedStyle]}>
            <Text style={styles.bodyText}>
              A few simple questions help us tailor every affirmation, insight, and habit to you.
            </Text>
            <Text style={styles.subBodyText}>
              It only takes 2 minutes — and it's worth it.
            </Text>
          </Animated.View>
        </View>

        {/* CTA Button */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable 
            style={({ pressed }) => [
              utils.createButtonStyle('primary', 'lg'),
              { minWidth: 340, width: '95%', paddingHorizontal: 48 },
              pressed && components.button.states.pressed
            ]} 
            onPress={onStartQuestionnaire}
          >
            <LinearGradient
              colors={[...foundations.gradients.primaryButton.colors]}
              start={foundations.gradients.primaryButton.start}
              end={foundations.gradients.primaryButton.end}
              style={StyleSheet.absoluteFill}
            />
            <Text 
              numberOfLines={1} 
              style={[
                components.button.typography.lg,
                { color: foundations.colors.textLight }
              ]}
            >
              Start My Questionnaire
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: foundations.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 40,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:foundations.spacing.lg,
    marginBottom: 20,
  },
  animationPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Questionnaire opening animation elements
  book: {
    position: 'absolute',
    bottom: 60,
    width: 80,
    height: 60,
    backgroundColor: foundations.colors.primary,
    borderRadius: 8,
    opacity: 0.8,
    shadowColor: foundations.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  page: {
    position: 'absolute',
    width: 70,
    height: 2,
    backgroundColor: foundations.colors.textMuted,
    borderRadius: 1,
    opacity: 0.7,
  },
  page1: {
    bottom: 100,
    left: 5,
  },
  page2: {
    bottom: 95,
    left: 10,
  },
  page3: {
    bottom: 90,
    left: 15,
  },
  questionMark: {
    position: 'absolute',
    top: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderWidth: 2,
    borderColor: foundations.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionMarkText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: foundations.colors.primary,
  },
  cursor: {
    position: 'absolute',
    top: 110,
    right: 20,
    width: 2,
    height: 20,
    backgroundColor: foundations.colors.primary,
    borderRadius: 1,
  },
  sparkleContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: foundations.colors.primary,
    borderRadius: 2,
    shadowColor: foundations.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  sparkle1: {
    top: 20,
    right: 30,
  },
  sparkle2: {
    bottom: 30,
    left: 25,
  },
  sparkle3: {
    top: 60,
    left: 15,
  },
  sparkle4: {
    bottom: 60,
    right: 20,
  },
  textContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginVertical: 20,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerText: {
    ...components.typography.display.small,
    color: foundations.colors.textPrimary,
    textAlign: 'center',
  },
  bodyContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  bodyText: {
    ...components.typography.body.large,
    color: foundations.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subBodyText: {
    ...components.typography.body.medium,
    color: foundations.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});  