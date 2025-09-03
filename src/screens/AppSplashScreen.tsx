import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface AppSplashScreenProps {
  onComplete: () => void;
  isVisible: boolean;
}

export function AppSplashScreen({ onComplete, isVisible }: AppSplashScreenProps) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.8);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    if (logoLoaded || logoError) {
      // Animate logo entrance
      scale.value = withTiming(1, { 
        duration: 600, 
        easing: Easing.out(Easing.cubic) 
      });

      // Wait a bit, then signal completion
      const timer = setTimeout(() => {
        if (!isVisible) {
          opacity.value = withTiming(0, { duration: 300 }, () => {
            onComplete();
          });
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [logoLoaded, logoError, isVisible, onComplete, opacity, scale]);

  useEffect(() => {
    if (!isVisible && (logoLoaded || logoError)) {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        onComplete();
      });
    }
  }, [isVisible, logoLoaded, logoError, onComplete, opacity]);

  if (!isVisible && logoLoaded) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        {!logoError ? (
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            onLoad={() => setLogoLoaded(true)}
            onError={() => {
              console.warn('Failed to load splash screen logo');
              setLogoError(true);
            }}
          />
        ) : (
          <View style={styles.fallbackLogo}>
            <Text style={styles.fallbackText}>Mynd</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 150,
    height: 150,
  },
  logo: {
    width: 80,
    height: 80,
    tintColor: '#FFFFFF',
  },
  fallbackLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fallbackText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
}); 