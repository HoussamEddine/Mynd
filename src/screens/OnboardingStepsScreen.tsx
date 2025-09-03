import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  FadeInUp,
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { theme, ScreenWrapper } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Text as CustomText } from '../components/base/Text';

const { foundations, components, utils } = theme;
const { width, height } = Dimensions.get('window');

// Custom animated component for the mind transformation
const MindTransformationAnimation = () => {
  // Initialize all values to ensure proper starting state - CRITICAL: set correct initial values
  const tangledOpacity = useSharedValue(1);
  const untangledOpacity = useSharedValue(0);
  const soundWaveOpacity = useSharedValue(0);
  const personOpacity = useSharedValue(0); // MUST start at 0 to prevent premature appearance
  const particleOpacity = useSharedValue(0); // MUST start at 0 to prevent premature appearance
  
  const wave1Scale = useSharedValue(1);
  const wave2Scale = useSharedValue(1);
  const wave3Scale = useSharedValue(1);
  const particleY = useSharedValue(0);
  
  // State to control when person should be rendered at all
  const [showPerson, setShowPerson] = useState(false);

  useEffect(() => {
    // Ensure initial state is set properly
    tangledOpacity.value = 1;
    untangledOpacity.value = 0;
    soundWaveOpacity.value = 0;
    personOpacity.value = 0;
    particleOpacity.value = 0;
    
    // Phase 1: Show tangled mind (0-2s)
    // Already visible from initial state
    
    // Phase 2: Untangle the mind (2-4s)
    setTimeout(() => {
      tangledOpacity.value = withTiming(0, { duration: 1000 });
      untangledOpacity.value = withTiming(1, { duration: 1000 });
    }, 2000);
    
    // Phase 3: Transform to sound waves (4-6s)
    setTimeout(() => {
      untangledOpacity.value = withTiming(0, { duration: 800 });
      soundWaveOpacity.value = withTiming(1, { duration: 800 });
      
      // Start sound wave animation
      wave1Scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
      wave2Scale.value = withDelay(200, withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      ));
      wave3Scale.value = withDelay(400, withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      ));
    }, 4000);
    
    // Phase 4: Show person silhouette (6-8s)
    setTimeout(() => {
      // Fade out sound waves first, then show person
      soundWaveOpacity.value = withTiming(0, { duration: 500 });
      setTimeout(() => {
        setShowPerson(true); // Enable person rendering
        personOpacity.value = withTiming(1, { duration: 1000 });
        particleOpacity.value = withTiming(1, { duration: 1000 });
        
        // Particle flow animation
        particleY.value = withRepeat(
          withSequence(
            withTiming(-20, { duration: 1500 }),
            withTiming(0, { duration: 1500 })
          ),
          -1,
          true
        );
      }, 500);
    }, 6000);
    
    // Reset and loop infinitely (every 9s)
    const interval = setInterval(() => {
      // Reset all values to initial state
      setShowPerson(false); // Hide person component completely
      tangledOpacity.value = 1;
      untangledOpacity.value = 0;
      soundWaveOpacity.value = 0;
      personOpacity.value = 0; // Ensure person is hidden on reset
      particleOpacity.value = 0; // Ensure particles are hidden on reset
      particleY.value = 0;
      
      // Restart the animation sequence
      setTimeout(() => {
        tangledOpacity.value = withTiming(0, { duration: 1000 });
        untangledOpacity.value = withTiming(1, { duration: 1000 });
      }, 2000);
      
      setTimeout(() => {
        untangledOpacity.value = withTiming(0, { duration: 800 });
        soundWaveOpacity.value = withTiming(1, { duration: 800 });
      }, 4000);
      
      setTimeout(() => {
        soundWaveOpacity.value = withTiming(0, { duration: 500 });
        setTimeout(() => {
          setShowPerson(true); // Enable person rendering
          personOpacity.value = withTiming(1, { duration: 1000 });
          particleOpacity.value = withTiming(1, { duration: 1000 });
        }, 500);
      }, 6000);
    }, 9000);
    
    return () => clearInterval(interval);
  }, []);

  const tangledStyle = useAnimatedStyle(() => ({
    opacity: tangledOpacity.value,
    position: 'absolute',
    zIndex: 3,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  const untangledStyle = useAnimatedStyle(() => ({
    opacity: untangledOpacity.value,
    position: 'absolute',
    zIndex: 3,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  const soundWaveStyle = useAnimatedStyle(() => ({
    opacity: soundWaveOpacity.value,
    position: 'absolute',
    zIndex: 3,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave1Scale.value }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave2Scale.value }],
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave3Scale.value }],
  }));

  const personStyle = useAnimatedStyle(() => ({
    opacity: personOpacity.value,
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [{ translateY: particleY.value }],
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  return (
    <View style={styles.mindAnimationContainer}>
      {/* Tangled Mind */}
      <Animated.View style={tangledStyle}>
        <Svg width="120" height="120" viewBox="0 0 80 80">
          <Path
            d="M40 10 C20 10, 10 20, 10 40 C10 60, 20 70, 40 70 C60 70, 70 60, 70 40 C70 20, 60 10, 40 10"
            stroke="#a78bfa"
            strokeWidth="2"
            fill="none"
          />
          {/* Tangled lines inside */}
          <Path
            d="M25 25 Q35 35, 45 25 Q55 35, 45 45 Q35 55, 25 45 Q15 35, 25 35"
            stroke="#8b5cf6"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M30 20 Q50 30, 30 50 Q50 60, 60 40"
            stroke="#7c3aed"
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Untangled Mind */}
      <Animated.View style={untangledStyle}>
        <Svg width="120" height="120" viewBox="0 0 80 80">
          <Path
            d="M40 10 C20 10, 10 20, 10 40 C10 60, 20 70, 40 70 C60 70, 70 60, 70 40 C70 20, 60 10, 40 10"
            stroke="#a78bfa"
            strokeWidth="2"
            fill="none"
          />
          {/* Smooth flowing lines */}
          <Path
            d="M20 40 Q30 30, 40 40 Q50 50, 60 40"
            stroke="#a78bfa"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M25 35 Q40 25, 55 35"
            stroke="#a78bfa"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M25 45 Q40 55, 55 45"
            stroke="#a78bfa"
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Sound Waves */}
      <Animated.View style={soundWaveStyle}>
        <View style={styles.soundWaveContainer}>
          <Animated.View style={[styles.soundWave, styles.soundWave1, wave1Style]} />
          <Animated.View style={[styles.soundWave, styles.soundWave2, wave2Style]} />
          <Animated.View style={[styles.soundWave, styles.soundWave3, wave3Style]} />
        </View>
      </Animated.View>

      {/* Person Silhouette - Only render when showPerson is true */}
      {showPerson && (
        <Animated.View style={personStyle}>
          <Svg width="120" height="120" viewBox="0 0 120 120">
            {/* Head */}
            <Circle cx="60" cy="40" r="15" fill="#6b7280" />
            {/* Body */}
            <Path
              d="M60 55 L50 70 L50 100 L70 100 L70 70 Z"
              fill="#6b7280"
            />
            {/* Arms */}
            <Path
              d="M50 65 L35 75 L35 85 L42 85 L50 75"
              fill="#6b7280"
            />
            <Path
              d="M70 65 L85 75 L85 85 L78 85 L70 75"
              fill="#6b7280"
            />
          </Svg>
        </Animated.View>
      )}

      {/* Glowing Particles - Only render when showPerson is true */}
      {showPerson && (
        <Animated.View style={particleStyle}>
          <View style={styles.particleContainer}>
            <View style={[styles.particle, { top: 10, left: 20 }]} />
            <View style={[styles.particle, { top: 15, left: 35 }]} />
            <View style={[styles.particle, { top: 20, left: 25 }]} />
            <View style={[styles.particle, { top: 25, left: 40 }]} />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Custom animated component for mental strength building
const MentalStrengthAnimation = () => {
  const calendarOpacity = useSharedValue(1);
  const chartOpacity = useSharedValue(0);
  const personOpacity = useSharedValue(0);
  const iconsOpacity = useSharedValue(0);
  
  const checkmark1 = useSharedValue(0);
  const checkmark2 = useSharedValue(0);
  const checkmark3 = useSharedValue(0);
  const checkmark4 = useSharedValue(0);
  
  const bar1Height = useSharedValue(0);
  const bar2Height = useSharedValue(0);
  const bar3Height = useSharedValue(0);
  const bar4Height = useSharedValue(0);
  
  const iconFloat1 = useSharedValue(0);
  const iconFloat2 = useSharedValue(0);
  const iconFloat3 = useSharedValue(0);
  const iconFloat4 = useSharedValue(0);
  
  const personScale = useSharedValue(0.8);

  useEffect(() => {
    // Phase 1: Calendar filling with checkmarks (0-3s)
    calendarOpacity.value = 1;
    
    // Animate checkmarks appearing one by one
    setTimeout(() => {
      checkmark1.value = withTiming(1, { duration: 300 });
    }, 500);
    setTimeout(() => {
      checkmark2.value = withTiming(1, { duration: 300 });
    }, 800);
    setTimeout(() => {
      checkmark3.value = withTiming(1, { duration: 300 });
    }, 1100);
    setTimeout(() => {
      checkmark4.value = withTiming(1, { duration: 300 });
    }, 1400);
    
    // Phase 2: Transform to bar chart (3-5s)
    setTimeout(() => {
      calendarOpacity.value = withTiming(0, { duration: 800 });
      chartOpacity.value = withTiming(1, { duration: 800 });
      
      // Bars rising gently
      bar1Height.value = withTiming(30, { duration: 600 });
      setTimeout(() => {
        bar2Height.value = withTiming(45, { duration: 600 });
      }, 200);
      setTimeout(() => {
        bar3Height.value = withTiming(35, { duration: 600 });
      }, 400);
      setTimeout(() => {
        bar4Height.value = withTiming(50, { duration: 600 });
      }, 600);
    }, 3000);
    
    // Phase 3: Morph to confident person (5-7s)
    setTimeout(() => {
      chartOpacity.value = withTiming(0, { duration: 1000 });
      personOpacity.value = withTiming(1, { duration: 1000 });
      personScale.value = withTiming(1, { duration: 1000 });
    }, 5000);
    
    // Phase 4: Floating icons appear (7-8s)
    setTimeout(() => {
      iconsOpacity.value = withTiming(1, { duration: 800 });
      
      // Start floating animations
      iconFloat1.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        true
      );
      iconFloat2.value = withRepeat(
        withSequence(
          withTiming(6, { duration: 1800 }),
          withTiming(0, { duration: 1800 })
        ),
        -1,
        true
      );
      iconFloat3.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 2200 }),
          withTiming(0, { duration: 2200 })
        ),
        -1,
        true
      );
      iconFloat4.value = withRepeat(
        withSequence(
          withTiming(7, { duration: 1900 }),
          withTiming(0, { duration: 1900 })
        ),
        -1,
        true
      );
    }, 7000);
    
    // Reset and loop infinitely (every 9s)
    const interval = setInterval(() => {
      // Reset all values
      calendarOpacity.value = 1;
      chartOpacity.value = 0;
      personOpacity.value = 0;
      iconsOpacity.value = 0;
      checkmark1.value = 0;
      checkmark2.value = 0;
      checkmark3.value = 0;
      checkmark4.value = 0;
      bar1Height.value = 0;
      bar2Height.value = 0;
      bar3Height.value = 0;
      bar4Height.value = 0;
      personScale.value = 0.8;
      
      // Restart sequence
      setTimeout(() => {
        checkmark1.value = withTiming(1, { duration: 300 });
      }, 500);
      setTimeout(() => {
        checkmark2.value = withTiming(1, { duration: 300 });
      }, 800);
      setTimeout(() => {
        checkmark3.value = withTiming(1, { duration: 300 });
      }, 1100);
      setTimeout(() => {
        checkmark4.value = withTiming(1, { duration: 300 });
      }, 1400);
      
      setTimeout(() => {
        calendarOpacity.value = withTiming(0, { duration: 800 });
        chartOpacity.value = withTiming(1, { duration: 800 });
        bar1Height.value = withTiming(30, { duration: 600 });
        setTimeout(() => {
          bar2Height.value = withTiming(45, { duration: 600 });
        }, 200);
        setTimeout(() => {
          bar3Height.value = withTiming(35, { duration: 600 });
        }, 400);
        setTimeout(() => {
          bar4Height.value = withTiming(50, { duration: 600 });
        }, 600);
      }, 3000);
      
      setTimeout(() => {
        chartOpacity.value = withTiming(0, { duration: 1000 });
        personOpacity.value = withTiming(1, { duration: 1000 });
        personScale.value = withTiming(1, { duration: 1000 });
      }, 5000);
      
      setTimeout(() => {
        iconsOpacity.value = withTiming(1, { duration: 800 });
      }, 7000);
    }, 9000);
    
    return () => clearInterval(interval);
  }, []);

  const calendarStyle = useAnimatedStyle(() => ({
    opacity: calendarOpacity.value,
    position: 'absolute',
    top: 70,
    left: 70,
    zIndex: 1,
  }));

  const chartStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
    position: 'absolute',
    top: 80,
    left: 70,
    zIndex: 1,
  }));

  const personStyle = useAnimatedStyle(() => ({
    opacity: personOpacity.value,
    transform: [{ scale: personScale.value }],
    position: 'absolute',
    top: 60,
    left: 60,
    zIndex: 2,
  }));

  const iconsStyle = useAnimatedStyle(() => ({
    opacity: iconsOpacity.value,
    position: 'absolute',
    top: 120,
    left: 120,
    zIndex: 3,
  }));

  const checkmark1Style = useAnimatedStyle(() => ({
    opacity: checkmark1.value,
    transform: [{ scale: checkmark1.value }],
  }));

  const checkmark2Style = useAnimatedStyle(() => ({
    opacity: checkmark2.value,
    transform: [{ scale: checkmark2.value }],
  }));

  const checkmark3Style = useAnimatedStyle(() => ({
    opacity: checkmark3.value,
    transform: [{ scale: checkmark3.value }],
  }));

  const checkmark4Style = useAnimatedStyle(() => ({
    opacity: checkmark4.value,
    transform: [{ scale: checkmark4.value }],
  }));

  const bar1Style = useAnimatedStyle(() => ({
    height: bar1Height.value,
  }));

  const bar2Style = useAnimatedStyle(() => ({
    height: bar2Height.value,
  }));

  const bar3Style = useAnimatedStyle(() => ({
    height: bar3Height.value,
  }));

  const bar4Style = useAnimatedStyle(() => ({
    height: bar4Height.value,
  }));

  const icon1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat1.value }],
  }));

  const icon2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat2.value }],
  }));

  const icon3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat3.value }],
  }));

  const icon4Style = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat4.value }],
  }));



  return (
    <View style={styles.mentalStrengthContainer}>
      {/* Calendar with checkmarks */}
      <Animated.View style={calendarStyle}>
        <Svg width="100" height="100" viewBox="0 0 100 100">
          {/* Calendar grid */}
          <Path
            d="M20 25 L80 25 L80 85 L20 85 Z"
            stroke="#a78bfa"
            strokeWidth="2"
            fill="#f6f3ff"
          />
          {/* Calendar header */}
          <Path
            d="M20 25 L80 25 L80 35 L20 35 Z"
            fill="#a78bfa"
          />
          {/* Grid lines */}
          <Path d="M35 35 L35 85" stroke="#e5e7eb" strokeWidth="1" />
          <Path d="M50 35 L50 85" stroke="#e5e7eb" strokeWidth="1" />
          <Path d="M65 35 L65 85" stroke="#e5e7eb" strokeWidth="1" />
          <Path d="M20 50 L80 50" stroke="#e5e7eb" strokeWidth="1" />
          <Path d="M20 65 L80 65" stroke="#e5e7eb" strokeWidth="1" />
        </Svg>
        
        {/* Checkmarks */}
        <Animated.View style={[styles.checkmarkPosition, { top: 42, left: 27 }, checkmark1Style]}>
          <Feather name="check" size={10} color="#22c55e" />
        </Animated.View>
        <Animated.View style={[styles.checkmarkPosition, { top: 42, left: 42 }, checkmark2Style]}>
          <Feather name="check" size={10} color="#22c55e" />
        </Animated.View>
        <Animated.View style={[styles.checkmarkPosition, { top: 57, left: 27 }, checkmark3Style]}>
          <Feather name="check" size={10} color="#22c55e" />
        </Animated.View>
        <Animated.View style={[styles.checkmarkPosition, { top: 57, left: 42 }, checkmark4Style]}>
          <Feather name="check" size={10} color="#22c55e" />
        </Animated.View>
      </Animated.View>

      {/* Bar Chart */}
      <Animated.View style={chartStyle}>
        <View style={styles.chartContainer}>
          <Animated.View style={[styles.chartBar, bar1Style]} />
          <Animated.View style={[styles.chartBar, bar2Style]} />
          <Animated.View style={[styles.chartBar, bar3Style]} />
          <Animated.View style={[styles.chartBar, bar4Style]} />
        </View>
      </Animated.View>

      {/* Confident Person - Same silhouette as step 1 */}
      <Animated.View style={personStyle}>
        <Svg width="120" height="120" viewBox="0 0 120 120">
          {/* Head */}
          <Circle cx="60" cy="40" r="15" fill="#6b7280" />
          {/* Body */}
          <Path
            d="M60 55 L50 75 L50 105 L70 105 L70 75 Z"
            fill="#6b7280"
          />
          {/* Arms */}
          <Path
            d="M50 65 L35 75 L35 85 L45 85 L50 75"
            fill="#6b7280"
          />
          <Path
            d="M70 65 L85 75 L85 85 L75 85 L70 75"
            fill="#6b7280"
          />
        </Svg>
      </Animated.View>

      {/* Floating Icons */}
      <Animated.View style={iconsStyle}>
        <Animated.View style={[styles.floatingIcon, styles.icon1Position, icon1Style]}>
          <Feather name="smile" size={20} color="#a78bfa" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.icon2Position, icon2Style]}>
          <Feather name="book-open" size={18} color="#a78bfa" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.icon3Position, icon3Style]}>
          <Feather name="zap" size={19} color="#a78bfa" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.icon4Position, icon4Style]}>
          <Feather name="trending-up" size={18} color="#a78bfa" />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// Custom animated component for transformation and results
const TransformationAnimation = () => {
  const seedOpacity = useSharedValue(1);
  const treeOpacity = useSharedValue(0);
  const meditatingPersonOpacity = useSharedValue(0);
  const walkingPersonOpacity = useSharedValue(0);
  const lightOpacity = useSharedValue(0);
  
  const treeScale = useSharedValue(0);
  const sparkOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const breathScale = useSharedValue(1);
  const walkingX = useSharedValue(0);
  const lightRadius = useSharedValue(0);

  useEffect(() => {
    // Phase 1: Seed (0-2s)
    seedOpacity.value = 1;
    
    // Phase 2: Seed transforms to tree (2-4s)
    setTimeout(() => {
      seedOpacity.value = withTiming(0, { duration: 800 });
      treeOpacity.value = withTiming(1, { duration: 800 });
      treeScale.value = withTiming(1, { duration: 1200 });
    }, 2000);
    
    // Phase 3: Tree morphs to meditating person with spark (4-6s)
    setTimeout(() => {
      treeOpacity.value = withTiming(0, { duration: 1000 });
      meditatingPersonOpacity.value = withTiming(1, { duration: 1000 });
      sparkOpacity.value = withTiming(1, { duration: 500 });
      
      // Spark creates glow
      setTimeout(() => {
        sparkOpacity.value = withTiming(0, { duration: 300 });
        glowOpacity.value = withTiming(1, { duration: 700 });
        
        // Start breathing animation
        breathScale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1500 }),
            withTiming(1, { duration: 1500 })
          ),
          -1,
          true
        );
      }, 500);
    }, 4000);
    
    // Phase 4: Person walks forward into light (7-9s)
    setTimeout(() => {
      meditatingPersonOpacity.value = withTiming(0, { duration: 800 });
      walkingPersonOpacity.value = withTiming(1, { duration: 800 });
      lightOpacity.value = withTiming(1, { duration: 1000 });
      
      // Walking animation
      walkingX.value = withTiming(30, { duration: 2000 });
      lightRadius.value = withTiming(100, { duration: 2000 });
    }, 7000);
    
    // Reset and loop infinitely (every 10s)
    const interval = setInterval(() => {
      // Reset all values
      seedOpacity.value = 1;
      treeOpacity.value = 0;
      meditatingPersonOpacity.value = 0;
      walkingPersonOpacity.value = 0;
      lightOpacity.value = 0;
      treeScale.value = 0;
      sparkOpacity.value = 0;
      glowOpacity.value = 0;
      breathScale.value = 1;
      walkingX.value = 0;
      lightRadius.value = 0;
      
      // Restart sequence
      setTimeout(() => {
        seedOpacity.value = withTiming(0, { duration: 800 });
        treeOpacity.value = withTiming(1, { duration: 800 });
        treeScale.value = withTiming(1, { duration: 1200 });
      }, 2000);
      
      setTimeout(() => {
        treeOpacity.value = withTiming(0, { duration: 1000 });
        meditatingPersonOpacity.value = withTiming(1, { duration: 1000 });
        sparkOpacity.value = withTiming(1, { duration: 500 });
        
        setTimeout(() => {
          sparkOpacity.value = withTiming(0, { duration: 300 });
          glowOpacity.value = withTiming(1, { duration: 700 });
        }, 500);
      }, 4000);
      
      setTimeout(() => {
        meditatingPersonOpacity.value = withTiming(0, { duration: 800 });
        walkingPersonOpacity.value = withTiming(1, { duration: 800 });
        lightOpacity.value = withTiming(1, { duration: 1000 });
        walkingX.value = withTiming(30, { duration: 2000 });
        lightRadius.value = withTiming(100, { duration: 2000 });
      }, 7000);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const seedStyle = useAnimatedStyle(() => ({
    opacity: seedOpacity.value,
    position: 'absolute',
  }));

  const treeStyle = useAnimatedStyle(() => ({
    opacity: treeOpacity.value,
    transform: [{ scale: treeScale.value }],
    position: 'absolute',
  }));

  const meditatingStyle = useAnimatedStyle(() => ({
    opacity: meditatingPersonOpacity.value,
    transform: [{ scale: breathScale.value }],
    position: 'absolute',
  }));

  const walkingStyle = useAnimatedStyle(() => ({
    opacity: walkingPersonOpacity.value,
    transform: [{ translateX: walkingX.value }],
    position: 'absolute',
  }));

  const sparkStyle = useAnimatedStyle(() => ({
    opacity: sparkOpacity.value,
    position: 'absolute',
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    position: 'absolute',
  }));

  const lightStyle = useAnimatedStyle(() => ({
    opacity: lightOpacity.value,
    position: 'absolute',
  }));

  const lightRadiusStyle = useAnimatedStyle(() => ({
    width: lightRadius.value,
    height: lightRadius.value,
    borderRadius: lightRadius.value / 2,
  }));

  return (
    <View style={styles.transformationContainer}>
      {/* Seed */}
      <Animated.View style={seedStyle}>
        <Svg width="20" height="30" viewBox="0 0 20 30">
          <Path
            d="M10 5 C8 5, 6 7, 6 10 C6 15, 8 20, 10 25 C12 20, 14 15, 14 10 C14 7, 12 5, 10 5"
            fill="#8b5cf6"
          />
          {/* Small root */}
          <Path
            d="M10 25 L10 28"
            stroke="#a78bfa"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      {/* Blooming Tree */}
      <Animated.View style={treeStyle}>
        <Svg width="100" height="120" viewBox="0 0 100 120">
          {/* Tree trunk */}
          <Path
            d="M45 80 L55 80 L55 110 L45 110 Z"
            fill="#8b5cf6"
          />
          {/* Tree crown */}
          <Circle cx="50" cy="60" r="25" fill="#a78bfa" opacity="0.8" />
          <Circle cx="40" cy="50" r="20" fill="#a78bfa" opacity="0.9" />
          <Circle cx="60" cy="50" r="20" fill="#a78bfa" opacity="0.9" />
          <Circle cx="50" cy="40" r="18" fill="#a78bfa" />
          {/* Blooming flowers */}
          <Circle cx="35" cy="45" r="3" fill="#d8b4fe" />
          <Circle cx="65" cy="45" r="3" fill="#d8b4fe" />
          <Circle cx="50" cy="35" r="3" fill="#d8b4fe" />
          <Circle cx="45" cy="55" r="3" fill="#d8b4fe" />
          <Circle cx="55" cy="55" r="3" fill="#d8b4fe" />
        </Svg>
      </Animated.View>

      {/* Spark */}
      <Animated.View style={sparkStyle}>
        <Svg width="20" height="20" viewBox="0 0 20 20">
          <Path
            d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8 Z"
            fill="#fbbf24"
          />
        </Svg>
      </Animated.View>

      {/* Meditating Person with Glow */}
      <Animated.View style={meditatingStyle}>
        {/* Person silhouette in meditation pose */}
        <View style={styles.meditatingPersonContainer}>
          <Svg width="100" height="100" viewBox="0 0 100 100">
            {/* Head */}
            <Circle cx="50" cy="25" r="12" fill="#6b7280" />
            {/* Body */}
            <Path
              d="M50 37 L42 50 L42 65 L58 65 L58 50 Z"
              fill="#6b7280"
            />
            {/* Crossed legs (meditation pose) */}
            <Path
              d="M30 65 L42 65 L50 72 L58 65 L70 65 L58 80 L42 80 Z"
              fill="#6b7280"
            />
            {/* Arms in meditation position - hands resting on knees */}
            <Path
              d="M42 48 L30 55 L30 62 L35 62 L42 58"
              fill="#6b7280"
            />
            <Path
              d="M58 48 L70 55 L70 62 L65 62 L58 58"
              fill="#6b7280"
            />
          </Svg>
          
          {/* Glow outline */}
          <Animated.View style={[styles.glowOutline, glowStyle]}>
            <View style={styles.breathingGlow} />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Walking Person */}
      <Animated.View style={walkingStyle}>
        <View style={styles.walkingPersonContainer}>
          <Svg width="100" height="100" viewBox="0 0 100 100">
            {/* Head */}
            <Circle cx="50" cy="20" r="12" fill="#6b7280" />
            {/* Body */}
            <Path
              d="M50 32 L44 48 L44 65 L56 65 L56 48 Z"
              fill="#6b7280"
            />
            {/* Walking legs - dynamic stride */}
            <Path
              d="M44 65 L44 85 L40 90"
              stroke="#6b7280"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <Path
              d="M56 65 L56 80 L65 85"
              stroke="#6b7280"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Walking arms - confident swing */}
            <Path
              d="M44 45 L35 55"
              stroke="#6b7280"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <Path
              d="M56 45 L65 35"
              stroke="#6b7280"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </Animated.View>

      {/* Light */}
      <Animated.View style={lightStyle}>
        <Animated.View style={[styles.lightGlow, lightRadiusStyle]} />
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
    title: "Take Control of Your Inner Dialogue",
    description: "Most of your thoughts aren't yours — they're patterns you've inherited.\nMynd helps you break the cycle and speak with intention.\n\nRecord your voice. Hear affirmations spoken in your own tone. Feel the shift.",
    icon: "mic",
    animationType: "wave"
  },
  {
    id: 2,
    title: "Build Lasting Mental Strength", 
    description: "Mental clarity isn't a luxury — it's a daily practice.\nTrack your moods, log your wins, and uncover the beliefs that hold you back.\n\nUse science-based tools that adapt to your emotional rhythm.",
    icon: "zap",
    animationType: "pulse"
  },
  {
    id: 3,
    title: "Achieve Real Results You Can Feel",
    description: "You're not here to scroll — you're here to evolve.\nMynd is your commitment device. A private space to grow, reflect, and stay accountable.\n\n21 days. That's all it takes to start reprogramming your subconscious.",
    icon: "trending-up",
    animationType: "lift"
  }
];

interface OnboardingStepsScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function OnboardingStepsScreen({ onComplete, onBack }: OnboardingStepsScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation values
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const waveOpacity = useSharedValue(0.3);
  const liftY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    console.log('[ONBOARDING_STEPS] Component mounted');
    return () => {
      console.log('[ONBOARDING_STEPS] Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[ONBOARDING_STEPS] Current step:', currentStep);
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
      ] as any,
    };
  });

  const waveAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: waveOpacity.value,
      transform: [{ scale: waveOpacity.value }],
    };
  });

  const handleNext = () => {
    console.log('[ONBOARDING_STEPS] handleNext called, current step:', currentStep);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log('[ONBOARDING_STEPS] Completing onboarding steps');
      onComplete();
    }
  };

  const handleBack = () => {
    console.log('[ONBOARDING_STEPS] handleBack called, current step:', currentStep);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      console.log('[ONBOARDING_STEPS] Going back to welcome screen');
      onBack();
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const renderFormattedDescription = (description: string) => {
    // Split the description into paragraphs
    const paragraphs = description.split('\n\n');
    
    return (
      <View style={styles.descriptionContainer}>
        {paragraphs.map((paragraph, index) => {
          // Check if this is a standout paragraph (the emphasized parts)
          const isStandout = paragraph.includes('Record your voice') || 
                           paragraph.includes('Use science-based tools') || 
                           paragraph.includes('21 days');
          
          return (
            <CustomText 
              key={index}
              style={[
                styles.stepDescription,
                isStandout && styles.standoutText,
                index > 0 && styles.paragraphSpacing
              ]}
            >
              {paragraph}
            </CustomText>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenWrapper
      contentStyle={{
        paddingTop: foundations.spacing['4xl'],
        paddingBottom: foundations.spacing['3xl'],
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={foundations.colors.surface} />

      {/* Content */}
      <View style={styles.content}>
        {/* Animation Container */}
        <Animated.View 
          key={currentStep}
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
          key={`text-${currentStep}`}
          entering={FadeInUp.delay(400)}
          style={styles.textContainer}
        >
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          {renderFormattedDescription(currentStepData.description)}
        </Animated.View>

        {/* Step Dots */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotCompleted
              ]}
            />
          ))}
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Animated.View entering={FadeInUp.delay(800)} style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              utils.createButtonStyle('primary', 'lg', {
                width: '100%',
              }),
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
            {isLastStep ? "Let's get started" : "Continue"}
          </Text>
            <Feather 
              name="arrow-right" 
              size={foundations.fonts.sizes.xl} 
              color={foundations.colors.textLight} 
            />
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
  },
  footer: {
    paddingTop: foundations.spacing.xl,
    paddingBottom: foundations.spacing['2xl'],
  },
  buttonContainer: {
    width: '100%',
  },
  stepTitle: {
    ...components.typography.display.small,
    textAlign: 'center',
    marginBottom: foundations.spacing.lg,
  },
  descriptionContainer: {
    alignItems: 'center',
    maxWidth: 340,
  },
  stepDescription: {
    ...components.typography.body.large,
    textAlign: 'center',
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