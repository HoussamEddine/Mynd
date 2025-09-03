import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme, ScreenWrapper } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Text as CustomText } from '../components/base/Text';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { foundations, components, utils } = theme;
const { width } = Dimensions.get('window');

// Custom animated component for voice transformation - Tangled to Clean
const MindTransformationAnimation = () => {
  const tangledOpacity = useSharedValue(1);
  const untangledOpacity = useSharedValue(0);
  const waveformOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  
  const tangledScale = useSharedValue(1);
  const untangledScale = useSharedValue(0);
  const waveformScale = useSharedValue(0);
  const glowScale = useSharedValue(0);

  useEffect(() => {
    // Phase 1: Tangled mess (0-2s)
    tangledOpacity.value = 1;
    tangledScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    
    // Phase 2: Untangle (2-4s)
    setTimeout(() => {
      tangledOpacity.value = withTiming(0, { duration: 800 });
      untangledOpacity.value = withTiming(1, { duration: 800 });
      untangledScale.value = withTiming(1, { duration: 1000 });
    }, 2000);
    
    // Phase 3: Transform to waveform (4-6s)
    setTimeout(() => {
      untangledOpacity.value = withTiming(0, { duration: 800 });
      waveformOpacity.value = withTiming(1, { duration: 800 });
      waveformScale.value = withTiming(1, { duration: 1000 });
    }, 4000);
    
    // Phase 4: Glow effect (6-8s)
    setTimeout(() => {
      glowOpacity.value = withTiming(1, { duration: 1000 });
      glowScale.value = withTiming(1, { duration: 1000 });
    }, 6000);
    
    // Reset and loop infinitely (every 9s)
    const interval = setInterval(() => {
      // Reset all values
      tangledOpacity.value = 1;
      untangledOpacity.value = 0;
      waveformOpacity.value = 0;
      glowOpacity.value = 0;
      tangledScale.value = 1;
      untangledScale.value = 0;
      waveformScale.value = 0;
      glowScale.value = 0;
      
      // Restart sequence
      setTimeout(() => {
        tangledOpacity.value = withTiming(0, { duration: 800 });
        untangledOpacity.value = withTiming(1, { duration: 800 });
        untangledScale.value = withTiming(1, { duration: 1000 });
      }, 2000);
      
      setTimeout(() => {
        untangledOpacity.value = withTiming(0, { duration: 800 });
        waveformOpacity.value = withTiming(1, { duration: 800 });
        waveformScale.value = withTiming(1, { duration: 1000 });
      }, 4000);
      
      setTimeout(() => {
        glowOpacity.value = withTiming(1, { duration: 1000 });
        glowScale.value = withTiming(1, { duration: 1000 });
      }, 6000);
    }, 9000);
    
    return () => clearInterval(interval);
  }, []);

  const tangledStyle = useAnimatedStyle(() => ({
    opacity: tangledOpacity.value,
    transform: [{ scale: tangledScale.value }],
    position: 'absolute',
  }));

  const untangledStyle = useAnimatedStyle(() => ({
    opacity: untangledOpacity.value,
    transform: [{ scale: untangledScale.value }],
    position: 'absolute',
  }));

  const waveformStyle = useAnimatedStyle(() => ({
    opacity: waveformOpacity.value,
    transform: [{ scale: waveformScale.value }],
    position: 'absolute',
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
    position: 'absolute',
  }));

  return (
    <View style={styles.mindAnimationContainer}>
      {/* Tangled Mess */}
      <Animated.View style={tangledStyle}>
        <Svg width="120" height="120" viewBox="0 0 120 120">
          {/* Chaotic, crisscrossed lines */}
          <Path
            d="M20 30 Q40 20, 60 40 Q80 60, 60 80 Q40 100, 20 80 Q10 60, 30 40"
            stroke="#8b5cf6"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M30 20 Q50 30, 70 50 Q90 70, 70 90 Q50 110, 30 90 Q10 70, 30 50"
            stroke="#a78bfa"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M40 10 Q60 20, 80 40 Q100 60, 80 80 Q60 100, 40 80 Q20 60, 40 40"
            stroke="#7c3aed"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M50 15 Q70 25, 90 45 Q110 65, 90 85 Q70 105, 50 85 Q30 65, 50 45"
            stroke="#6d28d9"
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Clean Spiral */}
      <Animated.View style={untangledStyle}>
        <Svg width="120" height="120" viewBox="0 0 120 120">
          {/* Elegant spiral */}
          <Path
            d="M60 60 Q60 40, 80 40 Q100 40, 100 60 Q100 80, 80 80 Q60 80, 60 60 Q60 50, 70 50 Q80 50, 80 60 Q80 70, 70 70 Q60 70, 60 60"
            stroke="#a78bfa"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* Waveform */}
      <Animated.View style={waveformStyle}>
        <Svg width="120" height="120" viewBox="0 0 120 120">
          {/* Clean waveform */}
          <Path
            d="M20 60 Q30 40, 40 60 Q50 80, 60 60 Q70 40, 80 60 Q90 80, 100 60"
            stroke="#a78bfa"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M25 60 Q35 45, 45 60 Q55 75, 65 60 Q75 45, 85 60 Q95 75, 105 60"
            stroke="#8b5cf6"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* Glow */}
      <Animated.View style={glowStyle}>
        <View style={styles.voiceGlow} />
      </Animated.View>
    </View>
  );
};

// Custom animated component for mental strength building - Building Blocks
const MentalStrengthAnimation = () => {
  const cube1Opacity = useSharedValue(0);
  const cube2Opacity = useSharedValue(0);
  const cube3Opacity = useSharedValue(0);
  const cube4Opacity = useSharedValue(0);
  const cube5Opacity = useSharedValue(0);
  const cube6Opacity = useSharedValue(0);
  const structureOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  
  const cube1Scale = useSharedValue(0);
  const cube2Scale = useSharedValue(0);
  const cube3Scale = useSharedValue(0);
  const cube4Scale = useSharedValue(0);
  const cube5Scale = useSharedValue(0);
  const cube6Scale = useSharedValue(0);
  const structureScale = useSharedValue(0);
  const glowScale = useSharedValue(0);

  useEffect(() => {
    // Phase 1: First cube appears (0-1s)
    cube1Opacity.value = withTiming(1, { duration: 500 });
    cube1Scale.value = withTiming(1, { duration: 500 });
    
    // Phase 2: Second cube slides in (1-2s)
    setTimeout(() => {
      cube2Opacity.value = withTiming(1, { duration: 500 });
      cube2Scale.value = withTiming(1, { duration: 500 });
    }, 1000);
    
    // Phase 3: Third cube (2-3s)
    setTimeout(() => {
      cube3Opacity.value = withTiming(1, { duration: 500 });
      cube3Scale.value = withTiming(1, { duration: 500 });
    }, 2000);
    
    // Phase 4: Fourth cube (3-4s)
    setTimeout(() => {
      cube4Opacity.value = withTiming(1, { duration: 500 });
      cube4Scale.value = withTiming(1, { duration: 500 });
    }, 3000);
    
    // Phase 5: Fifth cube (4-5s)
    setTimeout(() => {
      cube5Opacity.value = withTiming(1, { duration: 500 });
      cube5Scale.value = withTiming(1, { duration: 500 });
    }, 4000);
    
    // Phase 6: Sixth cube (5-6s)
    setTimeout(() => {
      cube6Opacity.value = withTiming(1, { duration: 500 });
      cube6Scale.value = withTiming(1, { duration: 500 });
    }, 5000);
    
    // Phase 7: Transform to solid structure (6-7s)
    setTimeout(() => {
      // Fade out individual cubes
      cube1Opacity.value = withTiming(0, { duration: 300 });
      cube2Opacity.value = withTiming(0, { duration: 300 });
      cube3Opacity.value = withTiming(0, { duration: 300 });
      cube4Opacity.value = withTiming(0, { duration: 300 });
      cube5Opacity.value = withTiming(0, { duration: 300 });
      cube6Opacity.value = withTiming(0, { duration: 300 });
      
      // Show solid structure
      setTimeout(() => {
        structureOpacity.value = withTiming(1, { duration: 800 });
        structureScale.value = withTiming(1, { duration: 800 });
      }, 300);
    }, 6000);
    
    // Phase 8: Glow effect (7-8s)
    setTimeout(() => {
      glowOpacity.value = withTiming(1, { duration: 1000 });
      glowScale.value = withTiming(1, { duration: 1000 });
    }, 7000);
    
    // Reset and loop infinitely (every 9s)
    const interval = setInterval(() => {
      // Reset all values
      cube1Opacity.value = 0;
      cube2Opacity.value = 0;
      cube3Opacity.value = 0;
      cube4Opacity.value = 0;
      cube5Opacity.value = 0;
      cube6Opacity.value = 0;
      structureOpacity.value = 0;
      glowOpacity.value = 0;
      cube1Scale.value = 0;
      cube2Scale.value = 0;
      cube3Scale.value = 0;
      cube4Scale.value = 0;
      cube5Scale.value = 0;
      cube6Scale.value = 0;
      structureScale.value = 0;
      glowScale.value = 0;
      
      // Restart sequence
      setTimeout(() => {
        cube1Opacity.value = withTiming(1, { duration: 500 });
        cube1Scale.value = withTiming(1, { duration: 500 });
      }, 1000);
      
      setTimeout(() => {
        cube2Opacity.value = withTiming(1, { duration: 500 });
        cube2Scale.value = withTiming(1, { duration: 500 });
      }, 2000);
      
      setTimeout(() => {
        cube3Opacity.value = withTiming(1, { duration: 500 });
        cube3Scale.value = withTiming(1, { duration: 500 });
      }, 3000);
      
      setTimeout(() => {
        cube4Opacity.value = withTiming(1, { duration: 500 });
        cube4Scale.value = withTiming(1, { duration: 500 });
      }, 4000);
      
      setTimeout(() => {
        cube5Opacity.value = withTiming(1, { duration: 500 });
        cube5Scale.value = withTiming(1, { duration: 500 });
      }, 5000);
      
      setTimeout(() => {
        cube6Opacity.value = withTiming(1, { duration: 500 });
        cube6Scale.value = withTiming(1, { duration: 500 });
      }, 6000);
      
      setTimeout(() => {
        cube1Opacity.value = withTiming(0, { duration: 300 });
        cube2Opacity.value = withTiming(0, { duration: 300 });
        cube3Opacity.value = withTiming(0, { duration: 300 });
        cube4Opacity.value = withTiming(0, { duration: 300 });
        cube5Opacity.value = withTiming(0, { duration: 300 });
        cube6Opacity.value = withTiming(0, { duration: 300 });
        
        setTimeout(() => {
          structureOpacity.value = withTiming(1, { duration: 800 });
          structureScale.value = withTiming(1, { duration: 800 });
        }, 300);
      }, 7000);
      
      setTimeout(() => {
        glowOpacity.value = withTiming(1, { duration: 1000 });
        glowScale.value = withTiming(1, { duration: 1000 });
      }, 8000);
    }, 9000);
    
    return () => clearInterval(interval);
  }, []);

  const cube1Style = useAnimatedStyle(() => ({
    opacity: cube1Opacity.value,
    transform: [{ scale: cube1Scale.value }],
    position: 'absolute',
  }));

  const cube2Style = useAnimatedStyle(() => ({
    opacity: cube2Opacity.value,
    transform: [{ scale: cube2Scale.value }],
    position: 'absolute',
  }));

  const cube3Style = useAnimatedStyle(() => ({
    opacity: cube3Opacity.value,
    transform: [{ scale: cube3Scale.value }],
    position: 'absolute',
  }));

  const cube4Style = useAnimatedStyle(() => ({
    opacity: cube4Opacity.value,
    transform: [{ scale: cube4Scale.value }],
    position: 'absolute',
  }));

  const cube5Style = useAnimatedStyle(() => ({
    opacity: cube5Opacity.value,
    transform: [{ scale: cube5Scale.value }],
    position: 'absolute',
  }));

  const cube6Style = useAnimatedStyle(() => ({
    opacity: cube6Opacity.value,
    transform: [{ scale: cube6Scale.value }],
    position: 'absolute',
  }));

  const structureStyle = useAnimatedStyle(() => ({
    opacity: structureOpacity.value,
    transform: [{ scale: structureScale.value }],
    position: 'absolute',
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
    position: 'absolute',
  }));

  return (
    <View style={styles.mentalStrengthContainer}>
      {/* Individual Building Blocks */}
      <Animated.View style={cube1Style}>
        <Svg width="40" height="40" viewBox="0 0 40 40">
          <Path
            d="M10 30 L30 30 L30 10 L10 10 Z"
            fill="#a78bfa"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={cube2Style}>
        <Svg width="40" height="40" viewBox="0 0 40 40">
          <Path
            d="M20 30 L40 30 L40 10 L20 10 Z"
            fill="#a78bfa"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={cube3Style}>
        <Svg width="40" height="40" viewBox="0 0 40 40">
          <Path
            d="M10 20 L30 20 L30 0 L10 0 Z"
            fill="#a78bfa"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={cube4Style}>
        <Svg width="40" height="40" viewBox="0 0 40 40">
          <Path
            d="M20 20 L40 20 L40 0 L20 0 Z"
            fill="#a78bfa"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={cube5Style}>
        <Svg width="40" height="40" viewBox="0 0 40 40">
          <Path
            d="M15 40 L35 40 L35 20 L15 20 Z"
            fill="#a78bfa"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={cube6Style}>
        <Svg width="40" height="40" viewBox="0 0 40 40">
          <Path
            d="M25 40 L45 40 L45 20 L25 20 Z"
            fill="#a78bfa"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      {/* Solid Structure */}
      <Animated.View style={structureStyle}>
        <Svg width="80" height="80" viewBox="0 0 80 80">
          {/* Pyramid structure */}
          <Path
            d="M20 60 L60 60 L40 20 Z"
            fill="#a78bfa"
            stroke="#8b5cf6"
            strokeWidth="2"
          />
          {/* Base */}
          <Path
            d="M15 65 L65 65 L65 60 L15 60 Z"
            fill="#8b5cf6"
            stroke="#7c3aed"
            strokeWidth="1"
          />
        </Svg>
      </Animated.View>

      {/* Glow */}
      <Animated.View style={glowStyle}>
        <View style={styles.structureGlow} />
      </Animated.View>
    </View>
  );
};

// Custom animated component for transformation and results - Simple Growth
const TransformationAnimation = () => {
  const seedOpacity = useSharedValue(1);
  const sproutOpacity = useSharedValue(0);
  const flowerOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  
  const seedScale = useSharedValue(1);
  const sproutScale = useSharedValue(0);
  const flowerScale = useSharedValue(0);
  const glowScale = useSharedValue(0);

  useEffect(() => {
    // Phase 1: Seed (0-2s)
    seedOpacity.value = 1;
    seedScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    
    // Phase 2: Seed transforms to sprout (2-4s)
    setTimeout(() => {
      seedOpacity.value = withTiming(0, { duration: 800 });
      sproutOpacity.value = withTiming(1, { duration: 800 });
      sproutScale.value = withTiming(1, { duration: 1000 });
    }, 2000);
    
    // Phase 3: Sprout grows to flower (4-6s)
    setTimeout(() => {
      sproutOpacity.value = withTiming(0, { duration: 800 });
      flowerOpacity.value = withTiming(1, { duration: 800 });
      flowerScale.value = withTiming(1, { duration: 1000 });
    }, 4000);
    
    // Phase 4: Flower glows (6-8s)
    setTimeout(() => {
      glowOpacity.value = withTiming(1, { duration: 1000 });
      glowScale.value = withTiming(1, { duration: 1000 });
    }, 6000);
    
    // Reset and loop infinitely (every 9s)
    const interval = setInterval(() => {
      // Reset all values
      seedOpacity.value = 1;
      sproutOpacity.value = 0;
      flowerOpacity.value = 0;
      glowOpacity.value = 0;
      seedScale.value = 1;
      sproutScale.value = 0;
      flowerScale.value = 0;
      glowScale.value = 0;
      
      // Restart sequence
      setTimeout(() => {
        seedOpacity.value = withTiming(0, { duration: 800 });
        sproutOpacity.value = withTiming(1, { duration: 800 });
        sproutScale.value = withTiming(1, { duration: 1000 });
      }, 2000);
      
      setTimeout(() => {
        sproutOpacity.value = withTiming(0, { duration: 800 });
        flowerOpacity.value = withTiming(1, { duration: 800 });
        flowerScale.value = withTiming(1, { duration: 1000 });
      }, 4000);
      
      setTimeout(() => {
        glowOpacity.value = withTiming(1, { duration: 1000 });
        glowScale.value = withTiming(1, { duration: 1000 });
      }, 6000);
    }, 9000);
    
    return () => clearInterval(interval);
  }, []);

  const seedStyle = useAnimatedStyle(() => ({
    opacity: seedOpacity.value,
    transform: [{ scale: seedScale.value }],
    position: 'absolute',
  }));

  const sproutStyle = useAnimatedStyle(() => ({
    opacity: sproutOpacity.value,
    transform: [{ scale: sproutScale.value }],
    position: 'absolute',
  }));

  const flowerStyle = useAnimatedStyle(() => ({
    opacity: flowerOpacity.value,
    transform: [{ scale: flowerScale.value }],
    position: 'absolute',
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
    position: 'absolute',
  }));

  return (
    <View style={styles.transformationContainer}>
      {/* Seed */}
      <Animated.View style={seedStyle}>
        <Svg width="40" height="40" viewBox="0 0 40 40">
          <Circle cx="20" cy="20" r="8" fill="#8b5cf6" />
          <Circle cx="20" cy="20" r="4" fill="#a78bfa" />
        </Svg>
      </Animated.View>

      {/* Sprout */}
      <Animated.View style={sproutStyle}>
        <Svg width="60" height="80" viewBox="0 0 60 80">
          {/* Stem */}
          <Path
            d="M30 60 L30 20"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Leaves */}
          <Path
            d="M30 40 Q20 35, 15 40 Q20 45, 30 40"
            stroke="#16a34a"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M30 50 Q40 45, 45 50 Q40 55, 30 50"
            stroke="#16a34a"
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Flower */}
      <Animated.View style={flowerStyle}>
        <Svg width="100" height="100" viewBox="0 0 100 100">
          {/* Stem */}
          <Path
            d="M50 80 L50 40"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Flower petals */}
          <Circle cx="50" cy="35" r="15" fill="#a78bfa" opacity="0.9" />
          <Circle cx="40" cy="30" r="12" fill="#a78bfa" opacity="0.8" />
          <Circle cx="60" cy="30" r="12" fill="#a78bfa" opacity="0.8" />
          <Circle cx="45" cy="45" r="12" fill="#a78bfa" opacity="0.8" />
          <Circle cx="55" cy="45" r="12" fill="#a78bfa" opacity="0.8" />
          {/* Flower center */}
          <Circle cx="50" cy="35" r="6" fill="#fbbf24" />
        </Svg>
      </Animated.View>

      {/* Glow */}
      <Animated.View style={glowStyle}>
        <View style={styles.flowerGlow} />
      </Animated.View>
    </View>
  );
};

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
  animationType: 'pulse' | 'wave' | 'lift';
}

const steps: Step[] = [
  {
    id: 1,
    title: "Master Your Inner Voice",
    description: "Most of your thoughts are inherited patterns. Mynd rewires them—using your own voice.\n\nRecord once, then listen daily to affirmations and belief-shifting audios crafted to transform your inner dialogue.",
    icon: "mic",
    animationType: "wave"
  },
  {
    id: 2,
    title: "Build Lasting Mental Strength", 
    description: "Growth isn't a hack—it's a habit.\n\nUnlock deeper self-awareness with AI-powered journaling and track your progress to uncover insights about your core beliefs. This is where you build the habit of reflection, one session at a time.",
    icon: "zap",
    animationType: "pulse"
  },
  {
    id: 3,
    title: "Rewire Your Beliefs for Good",
    description: "You're here to evolve, not scroll. Mynd is your private space for daily affirmations, belief-shifting audios, and motivational boosts that drive real, lasting change.",
    icon: "trending-up",
    animationType: "lift"
  }
];

interface WelcomeStepScreenProps {
  onComplete: () => void;
  onBack: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function WelcomeStepScreen({ onComplete, onBack, onSignIn, onSignUp }: WelcomeStepScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation values
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const waveOpacity = useSharedValue(0.3);
  const liftY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const step = steps[currentStep];
    
    // Reset animations
    iconScale.value = 1;
    iconRotate.value = 0;
    waveOpacity.value = 0.3;
    liftY.value = 0;
    pulseScale.value = 1;

    // Start step-specific animations
    if (step.animationType === 'wave') {
      // Mic to soundwave animation
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    } else if (step.animationType === 'pulse') {
      // Brain with pulsing waves
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
    } else if (step.animationType === 'lift') {
      // Lifting motion
      liftY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [currentStep]);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: iconScale.value },
        { scale: pulseScale.value },
        { translateY: liftY.value },
        { rotate: `${iconRotate.value}deg` }
      ],
    };
  });

  const waveAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: waveOpacity.value,
      transform: [{ scale: waveOpacity.value }],
    };
  });

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        await AsyncStorage.setItem('@welcome_completed', 'true');
        onSignUp();
      } catch (error) {
        // Silent fail for production - user can retry
        onSignUp();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const renderFormattedDescription = (description: string) => {
    const paragraphs = description.split('\n\n');
    
    return (
      <View style={styles.descriptionContainer}>
        {paragraphs.map((paragraph, index) => (
          <CustomText 
            key={index}
            style={[
              styles.stepDescription,
              index > 0 && styles.paragraphSpacing
            ]}
          >
            {paragraph}
          </CustomText>
        ))}
      </View>
    );
  };

  return (
    <ScreenWrapper
      useGradient
      statusBarColor="transparent"
      contentStyle={{
        paddingTop: foundations.spacing['4xl'],
        paddingBottom: foundations.spacing['3xl'],
        paddingHorizontal: 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Content */}
      <View style={styles.content}>
        {/* Animation Container */}
        <Animated.View 
          entering={ZoomIn.delay(200)}
          style={styles.animationContainer}
        >
          {currentStepData.animationType === 'wave' && (
            <MindTransformationAnimation />
          )}
          
          {currentStepData.animationType === 'pulse' && (
            <MentalStrengthAnimation />
          )}
          
          {currentStepData.animationType === 'lift' && (
            <TransformationAnimation />
          )}
        </Animated.View>

        {/* Text Content */}
        <Animated.View 
          entering={FadeInUp.delay(400)}
          style={styles.textContainer}
        >
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          {renderFormattedDescription(currentStepData.description)}
        </Animated.View>

        {/* Step Dots */}
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotCompleted
              ]}
            />
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Animated.View entering={FadeInUp.delay(800)} style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              utils.createButtonStyle('primary', 'lg'),
              pressed && components.button.states.pressed
            ]} 
            onPress={handleNext}
          >
            <LinearGradient
              colors={[...foundations.gradients.primaryButton.colors]}
              start={foundations.gradients.primaryButton.start}
              end={foundations.gradients.primaryButton.end}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[
              components.button.typography.lg,
              { color: foundations.colors.textLight }
            ]}>
              {isLastStep ? "Begin Your Journey" : "Continue"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: foundations.spacing.xl,
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: foundations.spacing['5xl'],
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: foundations.spacing['4xl'],
    width: '100%',
  },
  footer: {
    paddingTop: foundations.spacing.xl,
    paddingBottom: foundations.spacing['2xl'],
    paddingHorizontal: foundations.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    ...components.typography.display.small,
    textAlign: 'center',
    marginBottom: foundations.spacing.lg,
  },
  descriptionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepDescription: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    textAlign: 'center',
    color: foundations.colors.textPrimary,
    paddingHorizontal: foundations.spacing.lg,
    lineHeight: theme.foundations.fonts.sizes.base * 1.4,
    letterSpacing: 0.2,
  },
  standoutText: {
    ...components.typography.body.large,
    color: foundations.colors.primary,
    fontStyle: 'italic',
  },
  paragraphSpacing: {
    marginTop: foundations.spacing.base,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: foundations.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: foundations.spacing.lg,
    position: 'absolute',
    bottom: foundations.spacing['4xl'],
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    width: foundations.spacing.sm,
    height: foundations.spacing.sm,
    borderRadius: foundations.spacing.xs,
    backgroundColor: foundations.colors.border,
  },
  dotActive: {
    backgroundColor: foundations.colors.primary,
    width: foundations.spacing.xl,
  },
  dotCompleted: {
    backgroundColor: foundations.colors.primary,
  },
  // Mind transformation animation styles
  mindAnimationContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  soundWaveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundWave: {
    position: 'absolute',
    borderRadius: foundations.spacing.lg,
    backgroundColor: foundations.colors.primary,
    opacity: 0.6,
  },
  soundWave1: {
    width: 60,
    height: 12,
    top: -20,
  },
  soundWave2: {
    width: 45,
    height: 9,
    top: 0,
  },
  soundWave3: {
    width: 52,
    height: 10,
    top: 20,
  },
  particleContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  particle: {
    width: foundations.spacing.sm - foundations.spacing.xs,
    height: foundations.spacing.sm - foundations.spacing.xs,
    borderRadius: foundations.spacing.xs - 1,
    backgroundColor: foundations.colors.primary,
    position: 'absolute',
    shadowColor: foundations.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: foundations.spacing.sm - foundations.spacing.xs,
    elevation: 4,
  },
  // Mental strength animation styles
  mentalStrengthContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  checkmarkPosition: {
    position: 'absolute',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 80,
    gap: 8,
  },
  chartBar: {
    width: 15,
    backgroundColor: foundations.colors.primary,
    borderRadius: foundations.spacing.xs,
  },
  floatingIcon: {
    position: 'absolute',
    width: foundations.spacing['2xl'],
    height: foundations.spacing['2xl'],
    borderRadius: foundations.spacing.base,
    backgroundColor: foundations.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: foundations.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: foundations.spacing.xs,
    elevation: 3,
  },
  icon1Position: {
    top: -60,
    left: -50,
  },
  icon2Position: {
    top: -60,
    right: -50,
  },
  icon3Position: {
    bottom: -60,
    left: -50,
  },
  icon4Position: {
    bottom: -60,
    right: -50,
  },
  // Transformation animation styles
  transformationContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lightGlow: {
    backgroundColor: foundations.colors.warning,
    opacity: 0.3,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  meditatingPersonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  walkingPersonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowOutline: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: foundations.colors.primary,
    opacity: 0.6,
    backgroundColor: 'transparent',
  },
  
}); 