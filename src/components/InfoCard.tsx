import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants';

const { colors, spacing, radii } = theme.foundations;

interface InfoCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  gradientColors?: string[];
  children?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  description,
  gradientColors = [colors.primary, colors.primaryDark],
  children
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: theme.foundations.fonts.sizes.xxl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
    opacity: 0.9,
    textAlign: 'center',
  },
});

export default InfoCard;
