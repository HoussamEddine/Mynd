import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../constants';

const { colors, spacing, radii } = theme.foundations;

interface HiddenBeliefCardProps {
  hiddenBelief: string;
  onAddToBeliefs: () => void;
  onDismiss: () => void;
}

const HiddenBeliefCard: React.FC<HiddenBeliefCardProps> = ({
  hiddenBelief,
  onAddToBeliefs,
  onDismiss,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Title */}
        <Text style={styles.title}>Hidden Belief Discovered</Text>
        
        {/* Hidden belief text under the title */}
        <View style={styles.beliefTextContainer}>
          <Text style={styles.beliefText}>" {hiddenBelief} "</Text>
        </View>
        
        {/* Description */}
        <Text style={styles.description}>
          This belief was uncovered from your latest journal entry. Would you like to work on transforming it?
        </Text>
        
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.addButton} onPress={onAddToBeliefs}>
            <Text style={styles.addButtonText}>Add to Beliefs</Text>
          </Pressable>
          
          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  title: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  beliefTextContainer: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  beliefText: {
    fontSize: theme.foundations.fonts.sizes['2xl'],
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: theme.foundations.fonts.sizes['2xl'] * 1.3,
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  description: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.regular,
    color: colors.textSecondary,
    lineHeight: theme.foundations.fonts.sizes.base * 1.4,
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addButtonText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.primary,
  },
  dismissButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dismissButtonText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.semiBold,
    color: colors.primary,
  },
});

export default HiddenBeliefCard; 