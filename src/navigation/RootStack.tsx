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
import AffirmationScreen from './src/screens/AffirmationScreen';
import BeliefInputScreen from './src/screens/BeliefInputScreen';
import MeditationPlayerScreen from './src/screens/MeditationPlayerScreen';
import MoodLogScreen from './src/screens/MoodLogScreen';
import RelaxScreen from './src/screens/RelaxScreen';
import AppTabs from './src/navigation/AppTabs';
import type { RootStackParamList } from './src/types/navigation';
import AffirmationSelectionScreen from './src/screens/AffirmationSelectionScreen';
import AddStoryScreen from './src/screens/AddStoryScreen';

// Enable screens for better navigation performance
enableScreens();

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create custom transparent theme
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF', // Changed from transparent
  },
};

const Stack = createStackNavigator<RootStackParamList>();
// const ONBOARDING_COMPLETE_KEY = '@onboarding_complete'; // Removed onboarding key

// Create a navigation ref that can be used outside of components
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Export a helper for navigation outside of React components
export function navigate(name: keyof RootStackParamList, params?: any) {
  navigationRef.current?.navigate(name, params);
}

// Custom interpolator for fade and scale (Corrected)
const forFadeAndScale: StackCardStyleInterpolator = ({ current, layouts }) => {
  const progress = current.progress; // Animation progress for the current screen

  // Interpolate opacity for the current screen (incoming)
  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.3, 1],
    extrapolate: 'clamp', // Clamp ensures opacity stays within 0-1
  });

  // Interpolate scale for the current screen (incoming)
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1], // Scale up from 95% to 100%
    extrapolate: 'clamp', // Clamp ensures scale stays within range
  });

  return {
    cardStyle: {
      opacity: opacity,
      transform: [{ scale: scale }],
    },
    overlayStyle: { // Keep overlay animation if desired
      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
      }),
    },
  };
};

export default function App() {
  const [initialRouteName, setInitialRouteName] = useState<keyof RootStackParamList | null>(null);
  const [isAppReady, setIsAppReady] = useState(false); // Track overall readiness

  // Animation value for fade-in
  const opacity = useSharedValue(0);

  // Animated style for the main container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      flex: 1, // Ensure the animated view takes up space
    };
  });

  useEffect(() => {
    async function prepareApp() {
      // let routeName: keyof RootStackParamList = 'MainApp'; // Default to MainApp
      try {
        // Perform tasks concurrently
        await Promise.all([
          // AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY).then(status => { // Removed onboarding check
          //   if (status !== 'true') {
          //     routeName = 'BeliefInput';
          //   }
          //   console.log(`Onboarding previously completed: ${status === 'true'}`);
          // }),
          Font.loadAsync({
            'Nura-Regular': require('./assets/fonts/Nura-Normal.ttf'),
            'Nura-Bold': require('./assets/fonts/Nura-Bold.ttf'),
            // Poppins fonts
            'Poppins-Regular': require('./assets/fonts/Poppins/Poppins-Regular.ttf'),
            'Poppins-Italic': require('./assets/fonts/Poppins/Poppins-Italic.ttf'),
            'Poppins-Thin': require('./assets/fonts/Poppins/Poppins-Thin.ttf'),
            'Poppins-ThinItalic': require('./assets/fonts/Poppins/Poppins-ThinItalic.ttf'),
            'Poppins-ExtraLight': require('./assets/fonts/Poppins/Poppins-ExtraLight.ttf'),
            'Poppins-ExtraLightItalic': require('./assets/fonts/Poppins/Poppins-ExtraLightItalic.ttf'),
            'Poppins-Light': require('./assets/fonts/Poppins/Poppins-Light.ttf'),
            'Poppins-LightItalic': require('./assets/fonts/Poppins/Poppins-LightItalic.ttf'),
            'Poppins-Medium': require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
            'Poppins-MediumItalic': require('./assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
            'Poppins-SemiBold': require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
            'Poppins-SemiBoldItalic': require('./assets/fonts/Poppins/Poppins-SemiBoldItalic.ttf'),
            'Poppins-Bold': require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
            'Poppins-BoldItalic': require('./assets/fonts/Poppins/Poppins-BoldItalic.ttf'),
            'Poppins-ExtraBold': require('./assets/fonts/Poppins/Poppins-ExtraBold.ttf'),
            'Poppins-ExtraBoldItalic': require('./assets/fonts/Poppins/Poppins-ExtraBoldItalic.ttf'),
            'Poppins-Black': require('./assets/fonts/Poppins/Poppins-Black.ttf'),
            'Poppins-BlackItalic': require('./assets/fonts/Poppins/Poppins-BlackItalic.ttf'),
          })
        ]);
      } catch (e) {
        console.warn("App preparation error:", e);
        // routeName = 'MainApp'; // Default route on error
      } finally {
        setInitialRouteName('MainApp'); // Directly set to MainApp
        setIsAppReady(true); // Mark app as ready
        // We will hide the splash screen and start animation in the layout callback
      }
    }
    prepareApp();
  }, []);

  // Use useCallback to memoize the layout handler
  const onLayoutRootView = useCallback(async () => {
    if (isAppReady) {
      // Hide the splash screen now that the layout is complete
      await SplashScreen.hideAsync();
      // Start the fade-in animation
      opacity.value = withTiming(1, { duration: 500 }); // Adjust duration as needed
    }
  }, [isAppReady, opacity]);

  // Render nothing until the initial route is determined and app is ready
  // This prevents a flash of unstyled content before animation starts
  if (!isAppReady || !initialRouteName) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.rootContainer}>
      {/* Wrap the content that should fade in with Animated.View */}
      <Animated.View style={animatedStyle} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          {/* The transparent background should probably be outside the animated view
              or managed differently if it shouldn't fade in */}
          {/* <View style={styles.appBackground} /> */}{/* Consider if this needs animation */}
          <NavigationContainer ref={navigationRef} theme={navTheme}>
            <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
            <Stack.Navigator
              id={undefined}
              initialRouteName={initialRouteName} // This will now be MainApp
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#FFFFFF' },
                gestureEnabled: true,
                cardStyleInterpolator: forFadeAndScale, // Default animation for other screens
              }}
            >
              <Stack.Screen
                name="MainApp"
                component={AppTabs}
                options={{ cardStyleInterpolator: ({ current }) => ({ // Override for MainApp
                  cardStyle: {
                    opacity: current.progress, // Use default simple fade or set to 1 for no fade
                  },
                }) }}
              />
              {/* <Stack.Screen // Removed BeliefInput from stack
                name="BeliefInput"
                component={BeliefInputScreen}
                options={{ presentation: 'transparentModal' }}
              /> */}
              <Stack.Screen
                name="MeditationPlayer"
                component={MeditationPlayerScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="MoodLog"
                component={MoodLogScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="RelaxScreen"
                component={RelaxScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="AffirmationSelection"
                component={AffirmationSelectionScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="AddStory"
                component={AddStoryScreen}
                options={{ 
                  animation: 'slide_from_bottom',
                  presentation: 'modal'
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Added white background
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
}); 