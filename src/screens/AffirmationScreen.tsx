import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from '../components/base/Text';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { theme } from '../constants';

const { colors } = theme.foundations;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type AffirmationScreenProps = NativeStackScreenProps<RootStackParamList, 'AffirmationScreen'>;

const AffirmationScreen: React.FC<AffirmationScreenProps> = ({ route, navigation }) => {
  const { selectedAffirmation, beliefId } = route.params;
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState(selectedAffirmation);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setMessage)('Started!');
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      runOnJS(setMessage)(`Moving: ${Math.round(event.translationX)}, ${Math.round(event.translationY)}`);
    },
    onEnd: () => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      runOnJS(setMessage)(selectedAffirmation);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ] as any,
    };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Affirmation</Text>
      </View>
      <Text style={styles.messageText}>{message}</Text>
      <GestureHandlerRootView style={styles.gestureContainer}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.box, animatedStyle]} />
        </PanGestureHandler>
      </GestureHandlerRootView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.primary,
  },
  title: {
    ...theme.components.typography.heading.h2,
    marginLeft: 16,
  },
  gestureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  messageText: {
    ...theme.components.typography.body.large,
    padding: 20,
    textAlign: 'center',
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary,
    borderRadius: theme.foundations.radii.lg,
  },
});

export default AffirmationScreen;