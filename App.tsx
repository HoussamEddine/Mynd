import './src/polyfills/url.js';
import { enableScreens } from 'react-native-screens';
import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, StackCardStyleInterpolator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Alert, Button } from 'react-native';
import AffirmationScreen from './src/screens/AffirmationScreen';
import BeliefInputScreen from './src/screens/BeliefInputScreen';
import AppTabs from './src/navigation/AppTabs';
import type { RootStackParamList } from './src/types/navigation';

import BeliefsScreen from './src/screens/BeliefsScreen';
import VoiceCloneScreen from './src/screens/VoiceCloneScreen';
import VoiceCloneIntroScreen from './src/screens/VoiceCloneIntroScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import OnboardingStepsScreen from './src/screens/OnboardingStepsScreen';
import OnboardingDetailedQuestionsScreen from './src/screens/OnboardingDetailedQuestionsScreen';
import OnboardingQuestionsFlow from './src/screens/OnboardingQuestionsFlow';
import SignupScreen from './src/screens/SignupScreen';
import SignInScreen from './src/screens/SignInScreen';
import EmailSignupScreen from './src/screens/EmailSignupScreen';
import OnboardingFlow from './src/screens/OnboardingFlow';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { supabase } from './src/lib/supabase';
// Import native Google Auth for early initialization
import { nativeGoogleAuth } from './src/services/nativeGoogleAuth';
import { initializeGoogleAuth } from './src/services/googleAuthConfig';
import { NotificationProvider } from './src/components/NotificationProvider';

// Enable screens for better navigation performance
enableScreens();

// Constants for storing user progress
const ONBOARDING_ANSWERS_KEY = '@onboarding_answers';
const VOICE_CLONE_STATUS_KEY = '@voice_clone_status';
const FIRST_TIME_USER_KEY = '@first_time_user';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Error preventing splash screen auto-hide:', error);
});

// Create custom transparent theme
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

const Stack = createStackNavigator<RootStackParamList>();

// Create a navigation ref that can be used outside of components
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Custom card style interpolator for smooth transitions
const forFadeAndScale: StackCardStyleInterpolator = ({ current }) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
      ],
    },
  };
};

type AuthFlow = 'welcome' | 'steps' | 'auth' | 'signin' | 'emailsignup' | 'onboarding' | 'authenticated';

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [appState, setAppState] = useState<AuthFlow | null>(null);
  
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, flex: 1 }));

  useEffect(() => {
    const determineState = async () => {
      try {
        console.log('determineState - start', { authLoading, isAuthenticated });
        
      if (authLoading) return;

      if (!isAuthenticated) {
        // Check if user has used the app before
        const hasUsedAppBefore = await AsyncStorage.getItem(FIRST_TIME_USER_KEY);
          console.log('hasUsedAppBefore:', hasUsedAppBefore);
          
        if (hasUsedAppBefore === 'true') {
          // Returning user - skip welcome flow, go directly to sign-in
            console.log('Setting state to signin - returning user');
          setAppState('signin');
        } else {
          // New user - show welcome flow
            console.log('Setting state to welcome - new user');
          setAppState('welcome');
        }
      } else {
        const answersDone = await AsyncStorage.getItem(ONBOARDING_ANSWERS_KEY);
        const voiceDone = await AsyncStorage.getItem(VOICE_CLONE_STATUS_KEY);
          console.log('Onboarding status:', { answersDone, voiceDone });
          
        if (answersDone === 'true' && voiceDone === 'completed') {
            console.log('Setting state to authenticated - onboarding complete');
          setAppState('authenticated');
        } else {
            console.log('Setting state to onboarding - onboarding incomplete');
          setAppState('onboarding');
          }
        }
      } catch (error) {
        console.error('Error in determineState:', error);
        // Fallback to welcome state on error
        setAppState('welcome');
      }
    };
    determineState();
  }, [isAuthenticated, authLoading]);

  const onLayoutRootView = useCallback(async () => {
    try {
    if (appState) {
        console.log('Hiding splash screen, appState:', appState);
          await SplashScreen.hideAsync();
          opacity.value = withTiming(1, { duration: 300 });
      }
    } catch (error) {
      console.error('Error in onLayoutRootView:', error);
    }
  }, [appState, opacity]);

  if (!appState) {
    return null; // Keep splash screen visible
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Animated.View style={animatedStyle}>
        <SafeAreaProvider>
          {appState === 'authenticated' && (
            <NavigationContainer ref={navigationRef} theme={navTheme}>
              <Stack.Navigator id={undefined} initialRouteName="MainApp">
                <Stack.Screen name="MainApp" component={AppTabs} options={{ headerShown: false }}/>
                <Stack.Screen name="BeliefInput" component={BeliefInputScreen} options={{ presentation: 'transparentModal' }} />
                <Stack.Screen name="MeditationPlayer" component={MeditationPlayerScreen} options={{ presentation: 'modal' }} />
                <Stack.Screen name="MoodLog" component={MoodLogScreen} />
                <Stack.Screen name="RelaxScreen" component={RelaxScreen} />
                <Stack.Screen name="AffirmationSelection" component={AffirmationSelectionScreen} />
                <Stack.Screen name="AddStory" component={AddStoryScreen} />
                <Stack.Screen name="VoiceClone" options={{ headerShown: false, gestureEnabled: false }}>
                  {(props) => (
                    <VoiceCloneScreen
                      {...props}
                      onComplete={() => console.log('Standalone Voice Clone Complete')}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Beliefs" component={BeliefsScreen} />
                <Stack.Screen name="AffirmationScreen" component={AffirmationScreen} options={{ presentation: 'modal' }} />
              </Stack.Navigator>
            </NavigationContainer>
          )}
          {appState === 'onboarding' && (
            <OnboardingFlow onOnboardingComplete={() => setAppState('authenticated')} />
          )}
          {appState === 'welcome' && (
            <WelcomeScreen onContinue={() => setAppState('steps')} />
          )}
          {appState === 'steps' && (
            <OnboardingStepsScreen
              onComplete={() => setAppState('auth')}
              onBack={() => setAppState('welcome')}
            />
          )}
          {appState === 'auth' && (
            <SignupScreen
              onComplete={(user) => {
                console.log('SignupScreen onComplete called with user:', user);
                setAppState('onboarding');
              }}
              onShowSignIn={() => setAppState('signin')}
              onBack={() => setAppState('steps')}
              onShowEmailSignup={() => setAppState('emailsignup')}
            />
          )}
          {appState === 'signin' && (
            <SignInScreen
              onComplete={(user) => {
                console.log('SignInScreen onComplete called with user:', user);
                setAppState('onboarding');
              }}
              onShowSignup={() => setAppState('auth')}
            />
          )}
          {appState === 'emailsignup' && (
            <EmailSignupScreen
              onComplete={(user) => {
                console.log('EmailSignupScreen onComplete called with user:', user);
                setAppState('onboarding');
              }}
              onShowSignIn={() => setAppState('signin')}
              onBack={() => setAppState('auth')}
            />
          )}
        </SafeAreaProvider>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

// Custom hook to load fonts
function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Poppins-Regular': require('./assets/fonts/Poppins/Poppins-Regular.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
          'Poppins-Black': require('./assets/fonts/Poppins/Poppins-Black.ttf'),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.error('Error loading fonts', e);
        setError(e as Error);
        setFontsLoaded(true); // Continue app even if fonts fail to load
      }
    }

    loadFonts();
  }, []);

  return { fontsLoaded, error };
}

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);
  const [currentAuthFlow, setCurrentAuthFlow] = useState<AuthFlow>('welcome');
  const { fontsLoaded: areFontsLoaded } = useFonts();

  // Initialize app
  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize Google Sign-In
        await initializeGoogleAuth();
        setIsAppReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Still mark app as ready even if initialization fails
        setIsAppReady(true);
      }
    }

    initializeApp();
  }, []);

  // Don't render anything until fonts are loaded and app is ready
  if (!isAppReady || !areFontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF', // Ensured this is white
    zIndex: -2,
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Nura-Bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 