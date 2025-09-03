import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../constants';

const { colors, spacing, radii } = theme.foundations;
const { width, height } = Dimensions.get('window');

interface CelebrationScreenProps {
  title?: string;
  subtitle?: string;
  description?: string;
  onContinue?: () => void;
  celebrationType?: 'achievement' | 'milestone' | 'breakthrough' | 'streak';
}

const CelebrationScreen: React.FC<CelebrationScreenProps> = ({
  title = "Incredible Achievement!",
  subtitle = "You're doing amazing!",
  description = "Your dedication and consistency are paying off. Keep up the fantastic work!",
  onContinue,
  celebrationType = 'achievement'
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Animation values
  const titleScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(100);
  const backgroundOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);
  const badgeY = useSharedValue(50);

  // Fireworks particles
  const fireworksParticles = Array.from({ length: 100 }, (_, index) => ({
    id: index,
    x: useSharedValue(Math.random() * width),
    y: useSharedValue(height + 50),
    scale: useSharedValue(0.2 + Math.random() * 0.8),
    opacity: useSharedValue(0),
    rotation: useSharedValue(0),
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#EF4444', '#FF8C00', '#FF1493', '#00CED1', '#32CD32'][index % 12],
  }));

  useEffect(() => {
    // Background fade in
    backgroundOpacity.value = withTiming(1, { duration: 800 });

    // Badge animation
    badgeScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 100 }));
    badgeOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    badgeY.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 120 }));

    // Main title animation
    titleScale.value = withDelay(600, withSpring(1, { damping: 12, stiffness: 80 }));
    titleOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    titleY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));

    // Fireworks animation
    fireworksParticles.forEach((particle, index) => {
      const delay = 300 + index * 50;
      
      particle.y.value = withDelay(delay, withTiming(-100, { 
        duration: 3000 + Math.random() * 2000,
        easing: Easing.out(Easing.quad)
      }));
      
      particle.opacity.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) })
      ));
      
      particle.rotation.value = withRepeat(
        withTiming(360, { duration: 2000 + Math.random() * 1500, easing: Easing.linear }),
        -1,
        false
      );
    });

    // Auto navigate back after 4 seconds
    const timer = setTimeout(() => {
      if (onContinue) {
        onContinue();
      } else {
        navigation.goBack();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [onContinue, navigation]);

  // Animated styles
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: titleScale.value },
      { translateY: titleY.value }
    ],
    opacity: titleOpacity.value,
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { translateY: badgeY.value }
    ],
    opacity: badgeOpacity.value,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const getBackgroundColors = () => {
    return [colors.background, colors.background, colors.background];
  };

  const getTextColor = () => {
    switch (celebrationType) {
      case 'achievement':
        return '#A78BFA';
      case 'milestone':
        return '#FBBF24';
      case 'breakthrough':
        return '#34D399';
      case 'streak':
        return '#60A5FA';
      default:
        return '#A78BFA';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" style="light" />
      
      {/* Animated Background */}
      <Animated.View style={[StyleSheet.absoluteFill, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={getBackgroundColors()}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Fireworks Particles */}
      {fireworksParticles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.fireworksParticle,
            {
              left: particle.x.value,
              backgroundColor: particle.color,
            },
            useAnimatedStyle(() => ({
              transform: [
                { translateY: particle.y.value },
                { rotate: `${particle.rotation.value}deg` },
                { scale: particle.scale.value },
              ],
              opacity: particle.opacity.value,
            })),
          ]}
        />
      ))}

      {/* Main Content */}
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Badge */}
        <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
          <LinearGradient
            colors={[getTextColor(), getTextColor() + '80']}
            style={styles.badgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.badgeText}>🎉</Text>
          </LinearGradient>
        </Animated.View>

        {/* Main Title */}
        <Animated.Text style={[styles.title, titleAnimatedStyle, { color: getTextColor() }]}>
          {title}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: theme.foundations.fonts.sizes['5xl'],
    fontFamily: theme.foundations.fonts.families.bold,
    textAlign: 'center',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  fireworksParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default CelebrationScreen;
