import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import SoundWaveSpinner from './SoundWaveSpinner';

interface WaveSpinnerOverlayProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

const WaveSpinnerOverlay: React.FC<WaveSpinnerOverlayProps> = ({ 
  isVisible, 
  onAnimationComplete 
}) => {
  const fadeAnim = new Animated.Value(isVisible ? 1 : 0);

  useEffect(() => {
    if (isVisible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [isVisible, fadeAnim, onAnimationComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <BlurView intensity={20} style={styles.blurOverlay}>
        <View style={styles.spinnerContainer}>
          <SoundWaveSpinner size="large" />
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WaveSpinnerOverlay; 