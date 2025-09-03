import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../constants';
import { useCelebration } from '../hooks/useCelebration';

const { colors, spacing, radii } = theme.foundations;

// Example component showing how to use the celebration screen
const CelebrationExample: React.FC = () => {
  const { 
    celebrate, 
    celebrateAchievement, 
    celebrateMilestone, 
    celebrateBreakthrough, 
    celebrateStreak 
  } = useCelebration();

  const examples = [
    {
      title: 'Achievement',
      onPress: () => celebrateAchievement(
        "First Week Complete!",
        "You've successfully completed your first week of practice. This is just the beginning!"
      ),
    },
    {
      title: 'Milestone',
      onPress: () => celebrateMilestone(
        "100 Sessions Reached!",
        "You've completed 100 practice sessions. Your commitment is extraordinary!"
      ),
    },
    {
      title: 'Breakthrough',
      onPress: () => celebrateBreakthrough(
        "Hidden Belief Discovered!",
        "You've uncovered a limiting belief that was holding you back. This is a powerful moment of self-awareness!"
      ),
    },
    {
      title: 'Streak',
      onPress: () => celebrateStreak(30),
    },
    {
      title: 'Custom',
      onPress: () => celebrate({
        title: "You're Amazing!",
        subtitle: "Custom Celebration",
        description: "This is a custom celebration with your own message and styling!",
        celebrationType: 'achievement',
        onContinue: () => console.log('Custom celebration completed!'),
      }),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Celebration Examples</Text>
      <Text style={styles.subtitle}>Tap any button to see the celebration screen in action:</Text>
      
      <View style={styles.buttonsContainer}>
        {examples.map((example, index) => (
          <Pressable
            key={index}
            style={styles.button}
            onPress={example.onPress}
          >
            <Text style={styles.buttonText}>{example.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    margin: spacing.lg,
  },
  title: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buttonsContainer: {
    gap: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.semibold,
    color: colors.textLight,
  },
});

export default CelebrationExample;
