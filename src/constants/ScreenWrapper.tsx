import React from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from './theme';

const { foundations } = theme;

interface ScreenWrapperProps {
  children: React.ReactNode;
  useGradient?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenWrapper({ 
  children, 
  useGradient = true, 
  style,
  contentStyle,
  edges = ['left', 'right'], // Default: no top/bottom safe area
}: ScreenWrapperProps) {
  const renderContent = () => (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  if (useGradient) {
    return (
      <SafeAreaView style={styles.container} edges={edges}>
        <LinearGradient
          colors={foundations.gradients.welcomeScreen.colors}
          start={foundations.gradients.welcomeScreen.start}
          end={foundations.gradients.welcomeScreen.end}
          style={[styles.gradient, style]}
        >
          {renderContent()}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, styles.gradient, style]} edges={edges}>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: foundations.spacing.xl,
  },
}); 