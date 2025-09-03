import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from './base/Text';
import { theme } from '../constants';
import { useOnboardingStore } from '../stores/onboardingStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const { colors } = theme.foundations;

// Colors already imported above
const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';
const containerHeight = 380;

interface BeliefInputBoxProps {
  navigation: NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>;
}

const BeliefInputBox: React.FC<BeliefInputBoxProps> = ({ navigation }) => {
  const containerTranslateY = useSharedValue(screenHeight);

  const {
    phase,
    beliefInput,
    isInputFocused,
    setPhase,
    setBeliefInput,
    setInputFocused,
    resetStore,
    generateAffirmations,
    setOnboardingComplete,
    setHasShownInputInSession,
  } = useOnboardingStore();

  // Animation values...
  const welcomeTitleOpacity = useSharedValue(phase === 'welcome' ? 1 : 0);
  const welcomeTitleTranslateX = useSharedValue(phase === 'welcome' ? 0 : -screenWidth);
  const welcomeDescriptionOpacity = useSharedValue(phase === 'welcome' ? 1 : 0);
  const welcomeDescriptionTranslateX = useSharedValue(phase === 'welcome' ? 0 : -screenWidth);
  const welcomeButtonOpacity = useSharedValue(phase === 'welcome' ? 1 : 0);
  const welcomeButtonTranslateX = useSharedValue(phase === 'welcome' ? 0 : -screenWidth);
  const inputTitleOpacity = useSharedValue(phase === 'input' ? 1 : 0);
  const inputTitleTranslateX = useSharedValue(phase === 'input' ? 0 : screenWidth);
  const textInputOpacity = useSharedValue(phase === 'input' ? 1 : 0);
  const textInputTranslateX = useSharedValue(phase === 'input' ? 0 : screenWidth);
  const subtextOpacity = useSharedValue(phase === 'input' ? 1 : 0);
  const subtextTranslateX = useSharedValue(phase === 'input' ? 0 : screenWidth);
  const nextButtonOpacity = useSharedValue(phase === 'input' ? 1 : 0);
  const nextButtonTranslateX = useSharedValue(phase === 'input' ? 0 : screenWidth);
  const affirmIntroHeadlineOpacity = useSharedValue(0);
  const affirmIntroHeadlineTranslateX = useSharedValue(screenWidth);
  const affirmIntroSubtextOpacity = useSharedValue(0);
  const affirmIntroSubtextTranslateX = useSharedValue(screenWidth);
  const affirmIntroDoneButtonOpacity = useSharedValue(0);
  const affirmIntroDoneButtonTranslateX = useSharedValue(screenWidth);

  // Animation styles...
  const containerAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: containerTranslateY.value }] }));
  const welcomeTitleAnimatedStyle = useAnimatedStyle(() => ({ opacity: welcomeTitleOpacity.value, transform: [{ translateX: welcomeTitleTranslateX.value }] }));
  const welcomeDescriptionAnimatedStyle = useAnimatedStyle(() => ({ opacity: welcomeDescriptionOpacity.value, transform: [{ translateX: welcomeDescriptionTranslateX.value }] }));
  const welcomeButtonAnimatedStyle = useAnimatedStyle(() => ({ opacity: welcomeButtonOpacity.value, transform: [{ translateX: welcomeButtonTranslateX.value }] }));
  const inputTitleAnimatedStyle = useAnimatedStyle(() => ({ opacity: inputTitleOpacity.value, transform: [{ translateX: inputTitleTranslateX.value }] }));
  const textInputAnimatedStyle = useAnimatedStyle(() => ({ opacity: textInputOpacity.value, transform: [{ translateX: textInputTranslateX.value }] }));
  const subtextAnimatedStyle = useAnimatedStyle(() => ({ opacity: subtextOpacity.value, transform: [{ translateX: subtextTranslateX.value }] }));
  const nextButtonAnimatedStyle = useAnimatedStyle(() => ({ opacity: nextButtonOpacity.value, transform: [{ translateX: nextButtonTranslateX.value }] }));
  const affirmIntroHeadlineAnimatedStyle = useAnimatedStyle(() => ({ opacity: affirmIntroHeadlineOpacity.value, transform: [{ translateX: affirmIntroHeadlineTranslateX.value }] }));
  const affirmIntroSubtextAnimatedStyle = useAnimatedStyle(() => ({ opacity: affirmIntroSubtextOpacity.value, transform: [{ translateX: affirmIntroSubtextTranslateX.value }] }));
  const affirmIntroDoneButtonAnimatedStyle = useAnimatedStyle(() => ({ opacity: affirmIntroDoneButtonOpacity.value, transform: [{ translateX: affirmIntroDoneButtonTranslateX.value }] }));

  const [animationComplete, setAnimationComplete] = useState(false);
  const navigationAttempted = useRef(false);
  const [shouldAnimateEntry, setShouldAnimateEntry] = useState(false);

  // Add useEffect to handle initial slide-up animation (removed delay)
  useEffect(() => {
    // Animate containerTranslateY immediately from screenHeight to 0
    containerTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
    // Reset store state when animation starts
    resetStore();
    // Trigger entry animations after container animation
    setTimeout(() => {
      setShouldAnimateEntry(true);
    }, 300);
  }, [containerTranslateY, resetStore]); // Dependencies for the effect

  // Add entry animations for welcome phase content
  useEffect(() => {
    if (phase === 'welcome' && shouldAnimateEntry) {
      // Reset animation values first
      welcomeTitleOpacity.value = 0;
      welcomeTitleTranslateX.value = -screenWidth;
      welcomeDescriptionOpacity.value = 0;
      welcomeDescriptionTranslateX.value = -screenWidth;
      welcomeButtonOpacity.value = 0;
      welcomeButtonTranslateX.value = -screenWidth;
      
      // Staggered entry animations for welcome content
      welcomeTitleOpacity.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
      welcomeTitleTranslateX.value = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
      
      welcomeDescriptionOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
      welcomeDescriptionTranslateX.value = withDelay(400, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
      
      welcomeButtonOpacity.value = withDelay(600, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
      welcomeButtonTranslateX.value = withDelay(600, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    }
  }, [phase, shouldAnimateEntry, welcomeTitleOpacity, welcomeTitleTranslateX, welcomeDescriptionOpacity, welcomeDescriptionTranslateX, welcomeButtonOpacity, welcomeButtonTranslateX]);

  // Add entry animations for input phase content
  useEffect(() => {
    if (phase === 'input' && shouldAnimateEntry) {
      // Reset animation values first
      inputTitleOpacity.value = 0;
      inputTitleTranslateX.value = screenWidth;
      textInputOpacity.value = 0;
      textInputTranslateX.value = screenWidth;
      subtextOpacity.value = 0;
      subtextTranslateX.value = screenWidth;
      nextButtonOpacity.value = 0;
      nextButtonTranslateX.value = screenWidth;
      
      // Staggered entry animations for input content
      inputTitleOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      inputTitleTranslateX.value = withDelay(100, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
      
      textInputOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      textInputTranslateX.value = withDelay(200, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
      
      subtextOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      subtextTranslateX.value = withDelay(300, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
      
      nextButtonOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      nextButtonTranslateX.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
    }
  }, [phase, shouldAnimateEntry, inputTitleOpacity, inputTitleTranslateX, textInputOpacity, textInputTranslateX, subtextOpacity, subtextTranslateX, nextButtonOpacity, nextButtonTranslateX]);

  // Add entry animations for affirmation intro phase content
  useEffect(() => {
    if (phase === 'affirmation_intro' && shouldAnimateEntry) {
      // Reset animation values first
      affirmIntroHeadlineOpacity.value = 0;
      affirmIntroHeadlineTranslateX.value = screenWidth;
      affirmIntroSubtextOpacity.value = 0;
      affirmIntroSubtextTranslateX.value = screenWidth;
      affirmIntroDoneButtonOpacity.value = 0;
      affirmIntroDoneButtonTranslateX.value = screenWidth;
      
      // Staggered entry animations for affirmation intro content
      affirmIntroHeadlineOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      affirmIntroHeadlineTranslateX.value = withDelay(100, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
      
      affirmIntroSubtextOpacity.value = withDelay(250, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      affirmIntroSubtextTranslateX.value = withDelay(250, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
      
      affirmIntroDoneButtonOpacity.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      affirmIntroDoneButtonTranslateX.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
    }
  }, [phase, shouldAnimateEntry, affirmIntroHeadlineOpacity, affirmIntroHeadlineTranslateX, affirmIntroSubtextOpacity, affirmIntroSubtextTranslateX, affirmIntroDoneButtonOpacity, affirmIntroDoneButtonTranslateX]);

  // Navigation effect - Updated to navigate to AffirmationSelection
  useEffect(() => {
    if (animationComplete && !navigationAttempted.current) {
      navigationAttempted.current = true;
      navigation.replace('AffirmationSelection', { beliefId: 'initial' }); // Changed from 'AffirmationScreen'
    }
  }, [animationComplete, navigation]);

  const handleTransitionToInput = () => {
    const exitAnimConfig = { duration: 400, easing: Easing.inOut(Easing.ease) };
    const slideOutDistance = -screenWidth;
    const exitDelay = 100;
    welcomeTitleOpacity.value = withTiming(0, exitAnimConfig);
    welcomeTitleTranslateX.value = withTiming(slideOutDistance, exitAnimConfig);
    welcomeDescriptionOpacity.value = withDelay(exitDelay, withTiming(0, exitAnimConfig));
    welcomeDescriptionTranslateX.value = withDelay(exitDelay, withTiming(slideOutDistance, exitAnimConfig));
    welcomeButtonOpacity.value = withDelay(exitDelay * 2, withTiming(0, exitAnimConfig));
    welcomeButtonTranslateX.value = withDelay(exitDelay * 2, withTiming(slideOutDistance, exitAnimConfig));

    const entryAnimConfig = { duration: 400, easing: Easing.inOut(Easing.ease) };
    const slideInDistance = 0;
    const entryDelay = 150;
    const totalExitDuration = exitAnimConfig.duration + (exitDelay * 2);

    setTimeout(() => {
      runOnJS(setPhase)('input');
      inputTitleOpacity.value = withDelay(entryDelay, withTiming(1, entryAnimConfig));
      inputTitleTranslateX.value = withDelay(entryDelay, withTiming(slideInDistance, entryAnimConfig));
      textInputOpacity.value = withDelay(entryDelay + exitDelay, withTiming(1, entryAnimConfig));
      textInputTranslateX.value = withDelay(entryDelay + exitDelay, withTiming(slideInDistance, entryAnimConfig));
      subtextOpacity.value = withDelay(entryDelay + exitDelay * 2, withTiming(1, entryAnimConfig));
      subtextTranslateX.value = withDelay(entryDelay + exitDelay * 2, withTiming(slideInDistance, entryAnimConfig));
      nextButtonOpacity.value = withDelay(entryDelay + exitDelay * 3, withTiming(1, entryAnimConfig));
      nextButtonTranslateX.value = withDelay(entryDelay + exitDelay * 3, withTiming(slideInDistance, entryAnimConfig));
    }, totalExitDuration - 100);
  };

  const handleTransitionToAffirmationIntro = () => {
    const exitAnimConfig = { duration: 400, easing: Easing.inOut(Easing.ease) };
    const slideOutDistance = -screenWidth;
    const exitDelay = 100;
    inputTitleOpacity.value = withTiming(0, exitAnimConfig);
    inputTitleTranslateX.value = withTiming(slideOutDistance, exitAnimConfig);
    textInputOpacity.value = withDelay(exitDelay, withTiming(0, exitAnimConfig));
    textInputTranslateX.value = withDelay(exitDelay, withTiming(slideOutDistance, exitAnimConfig));
    subtextOpacity.value = withDelay(exitDelay * 2, withTiming(0, exitAnimConfig));
    subtextTranslateX.value = withDelay(exitDelay * 2, withTiming(slideOutDistance, exitAnimConfig));
    nextButtonOpacity.value = withDelay(exitDelay * 3, withTiming(0, exitAnimConfig));
    nextButtonTranslateX.value = withDelay(exitDelay * 3, withTiming(slideOutDistance, exitAnimConfig));

    const entryAnimConfig = { duration: 400, easing: Easing.inOut(Easing.ease) };
    const slideInDistance = 0;
    const entryDelay = 150;
    const totalExitDuration = exitAnimConfig.duration + (exitDelay * 3);

    setTimeout(() => {
      runOnJS(() => {
        generateAffirmations(beliefInput);
        setPhase('affirmation_intro');
      })();

      affirmIntroHeadlineOpacity.value = withDelay(entryDelay, withTiming(1, entryAnimConfig));
      affirmIntroHeadlineTranslateX.value = withDelay(entryDelay, withTiming(slideInDistance, entryAnimConfig));
      affirmIntroSubtextOpacity.value = withDelay(entryDelay + exitDelay, withTiming(1, entryAnimConfig));
      affirmIntroSubtextTranslateX.value = withDelay(entryDelay + exitDelay, withTiming(slideInDistance, entryAnimConfig));
      affirmIntroDoneButtonOpacity.value = withDelay(entryDelay + exitDelay * 2, withTiming(1, entryAnimConfig));
      affirmIntroDoneButtonTranslateX.value = withDelay(entryDelay + exitDelay * 2, withTiming(slideInDistance, entryAnimConfig));
    }, totalExitDuration - 100);
  };

  const handleDonePress = async () => {
    setHasShownInputInSession(true);
    setOnboardingComplete(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (e) {
      console.error("Failed to save onboarding status:", e);
    }
    containerTranslateY.value = withTiming(
      screenHeight,
      { duration: 400, easing: Easing.in(Easing.ease) },
      () => { runOnJS(setAnimationComplete)(true); }
    );
  };

  return (
    <View style={styles.fullScreenOverlay}>
      {/* Blur overlay removed from here */}
      {/* 
      <BlurView 
        intensity={50} 
        tint="dark" 
        style={styles.blurOverlay}
      />
      */}
      
      {/* Animated container for the input box itself */}
      <Animated.View style={[styles.animatedContentContainer, containerAnimatedStyle]}>
        <Pressable
          style={styles.touchLayer} // Positioned relative to animated container
          onPress={phase === 'welcome' ? handleTransitionToInput : undefined}
          disabled={phase !== 'welcome'}
        />

        <View style={styles.inputBoxContainer}>
          {/* Welcome Phase Content */}
          {phase === 'welcome' && (
            <>
              <Animated.View style={[styles.contentItemWrapper, welcomeTitleAnimatedStyle]} pointerEvents='box-none'>
                <Text variant="bold" style={styles.title}>Welcome to Mynd!</Text>
              </Animated.View>
              <Animated.View style={[styles.contentItemWrapper, welcomeDescriptionAnimatedStyle]} pointerEvents='box-none'>
                <Text style={styles.description}>
                  Ready to challenge limiting beliefs and unlock your potential?
                </Text>
              </Animated.View>
              <Animated.View style={[styles.contentItemWrapper, welcomeButtonAnimatedStyle]} pointerEvents='box-none'>
                <Pressable
                  style={styles.button}
                  onPress={handleTransitionToInput}
                >
                  <Text style={styles.buttonText}>Let's Go!</Text>
                </Pressable>
              </Animated.View>
            </>
          )}

          {/* Input Phase Content */}
          {phase === 'input' && (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.kavWrapper}
            >
              <Animated.View style={[styles.contentItemWrapper, inputTitleAnimatedStyle]}>
                <Text style={styles.inputTitle}>What's one <Text variant='bold'>belief</Text> about yourself you're ready to change?</Text>
              </Animated.View>
              <Animated.View style={[styles.contentItemWrapper, textInputAnimatedStyle]}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={beliefInput}
                    onChangeText={setBeliefInput}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    multiline={false}
                    placeholder={'"I\'m not good enough" or "I always fail"...'}
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </Animated.View>
              <Animated.View style={[styles.contentItemWrapper, subtextAnimatedStyle]}>
                <Text style={styles.subText}>
                  We'll turn this into a powerful affirmation you'll rewire daily — in your own voice.
                </Text>
              </Animated.View>
              <Animated.View style={[styles.contentItemWrapper, nextButtonAnimatedStyle]}>
                <Pressable style={styles.button} onPress={handleTransitionToAffirmationIntro}>
                  <Text style={styles.buttonText}>Next</Text>
                </Pressable>
              </Animated.View>
            </KeyboardAvoidingView>
          )}

          {/* Affirmation Intro Phase Content */}
          {phase === 'affirmation_intro' && (
            <>
              <Animated.View style={[styles.contentItemWrapper, affirmIntroHeadlineAnimatedStyle]}>
                <Text style={styles.affirmIntroHeadline}>
                  Let's start <Text variant="bold" style={styles.affirmIntroHeadlineBold}>rewriting</Text> that belief.
                </Text>
              </Animated.View>
              <Animated.View style={[styles.contentItemWrapper, affirmIntroSubtextAnimatedStyle]}>
                <Text style={styles.affirmIntroSubtext}>
                  We've turned your belief into empowering affirmations.
                  You'll rewire this daily — in your own voice.
                </Text>
              </Animated.View>
              <Animated.View style={[styles.contentItemWrapper, affirmIntroDoneButtonAnimatedStyle]}>
                <Pressable style={styles.button} onPress={handleDonePress}>
                  <Text style={styles.buttonText}>Continue</Text>
                </Pressable>
              </Animated.View>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: 'box-none',
    overflow: 'hidden',
    backgroundColor: 'transparent', // Ensure overlay is transparent
  },
  // blurOverlay style removed
  /*
  blurOverlay: { // Covers the entire screen instantly
    ...StyleSheet.absoluteFillObject,
    zIndex: 1, // Lowered zIndex as it's now the bottom layer
  },
  */
  animatedContentContainer: { // This container slides up
    position: 'absolute',
    bottom: 0, // Starts below the screen initially due to translateY
    left: 0,
    right: 0,
    height: containerHeight, // The height of the visible input box part
    zIndex: 5, // Above blur 
    // No background color here, background is in inputBoxContainer
  },
  touchLayer: { // Covers area *above* the input box, relative to animated container
    position: 'absolute',
    bottom: containerHeight, // Starts from the top edge of the input box
    top: -screenHeight, // Extends way up to cover the rest of the screen
    left: 0,
    right: 0,
    zIndex: 3, // Below the input box content but above blur
    backgroundColor: 'transparent',
  },
  inputBoxContainer: {
    backgroundColor: colors.primaryLight,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
    height: '100%', // Takes full height of animatedContentContainer
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 4, // Above touch layer
  },
  kavWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
  },
  contentItemWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Nura-Bold',
  },
  description: {
    fontSize: 17,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: 10,
    fontFamily: 'Nura-Regular',
  },
  inputTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'Nura-Regular',
    lineHeight: 24,
    marginTop: 10,
  },
  inputWrapper: {
    width: '100%',
    justifyContent: 'center',
    marginVertical: 10,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: 16,
    color: colors.textPrimary,
    width: '100%',
    fontFamily: 'Nura-Regular',
    minHeight: 48,
    textAlignVertical: 'center',
  },
  subText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Nura-Regular',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 17,
    fontFamily: 'Nura-Bold',
  },
  affirmIntroHeadline: {
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'Nura-Regular',
    lineHeight: 34,
  },
  affirmIntroHeadlineBold: {
    fontFamily: 'Nura-Bold',
  },
  affirmIntroSubtext: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Nura-Regular',
  },
});

export default BeliefInputBox; 