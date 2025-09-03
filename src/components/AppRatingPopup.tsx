import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AntDesign } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants';
import { NotificationBanner } from './NotificationBanner';

const { colors, spacing, radii } = theme.foundations;
const { width } = Dimensions.get('window');

interface AppRatingPopupProps {
  onClose: () => void;
  onRate: () => void;
}

const AppRatingPopup: React.FC<AppRatingPopupProps> = ({ onClose, onRate }) => {
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(100));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedRating, setSelectedRating] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Slide up animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStarPress = async (rating: number) => {
    if (isDisabled) return;

    setSelectedRating(rating);
    setIsDisabled(true);

    try {
      // Simple internal rating - no native dialog, no external redirects
      console.log(`User rated app: ${rating} stars`);
      
      // Show success notification immediately
      setShowNotification(true);
      
      // Close popup after a small delay to ensure banner shows
      setTimeout(() => {
        onRate();
      }, 100);
    } catch (error) {
      console.error('Error submitting rating:', error);
      onRate();
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <>
      <NotificationBanner
        message="Your rating has been submitted successfully!"
        type="success"
        visible={showNotification}
        onHide={() => setShowNotification(false)}
      />
      
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={styles.backdrop} />
        <Pressable style={styles.backdropPressable} onPress={handleClose} />
        <Animated.View 
          style={[
            styles.popup,
            {
              transform: [{ translateY: slideAnim }],
              bottom: insets.bottom,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Enjoying Mynd?</Text>
                <Pressable style={styles.closeButton} onPress={handleClose}>
                  <AntDesign name="close" size={16} color={colors.textLight} />
                </Pressable>
              </View>
              
              <Text style={styles.subtitle}>
                Tap a star to rate it on the App Store
              </Text>
              
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable 
                    key={star} 
                    onPress={() => handleStarPress(star)}
                    style={styles.starButton}
                    disabled={isDisabled}
                  >
                    <AntDesign 
                      name={star <= selectedRating ? "star" : "staro"} 
                      size={32} 
                      color={star <= selectedRating ? "#FFD700" : "rgba(255, 255, 255, 0.6)"} 
                      style={[styles.star, { marginHorizontal: 6 }]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popup: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    borderRadius: radii.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  star: {
    marginHorizontal: 6,
  },
  starButton: {
    padding: 4,
  },
});

export default AppRatingPopup;
