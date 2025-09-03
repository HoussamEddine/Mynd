import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/base/Text';
import { theme } from '../constants'
const { colors } = theme.foundations;;
import AnimatedNumberScroll from './AnimatedNumberScroll';

interface ProgressTrackerProps {
  streakDays: number;
}

const SLOT_HEIGHT = 28; // Keep slot height defined here or pass as prop

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ streakDays }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="flame" size={24} color={colors.warning} />
      </View>
      <View style={styles.textContainer}>
        <AnimatedNumberScroll
          targetValue={streakDays}
          slotHeight={SLOT_HEIGHT}
          textStyle={styles.streakText}
          duration={1200}
        />
        <Text style={styles.label}>Day Streak</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 15,
    width: '95%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
    borderRadius: 50,
    padding: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: SLOT_HEIGHT,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginRight: 6,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default ProgressTracker; 