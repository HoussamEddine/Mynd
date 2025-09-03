import React from 'react';
import { View, StyleSheet } from 'react-native';
import BeliefInputBox from '../components/BeliefInputBox'; // Assuming path
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation'; // Assuming path
// import { BlurView } from 'expo-blur'; // Removed BlurView import
import { theme } from '../constants'
const { colors } = theme.foundations;; // Import Colors

// Define the props using the navigator types
type Props = NativeStackScreenProps<RootStackParamList, 'BeliefInput'>; // Use a new name 'BeliefInput' for this route

const BeliefInputScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Removed Blur overlay */}
      {/* Removed commented BlurView JSX */}
      {/* Removed Ripple background animation */}
      {/* Removed commented Ripple Animated.View JSX */}
      
      {/* BeliefInputBox component (renders on top) */}
      <BeliefInputBox navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Set background color directly to cover the whole area
    backgroundColor: '#FFFFFF', // Changed from colors.background
    // overflow: 'hidden', // Removed commented style
  },
  // Removed blurOverlay style
  /* Removed commented blurOverlay style block */
  // Removed rippleBackground style
  /* Removed commented rippleBackground style block */
  // BeliefInputBox itself will have its own zIndex via its internal styles
});

export default BeliefInputScreen; 