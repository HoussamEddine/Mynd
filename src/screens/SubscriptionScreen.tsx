import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Image } from 'react-native';
import { theme } from '../constants';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { colors, spacing, radii, fonts } = theme.foundations;
const { width: screenWidth } = Dimensions.get('window');

interface SubscriptionScreenProps {
  navigation: any;
}

export default function SubscriptionScreen({ navigation }: SubscriptionScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [unlockTrial, setUnlockTrial] = useState(true);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSubscribe = () => {
    // TODO: Implement subscription logic
    console.log('Subscribe to plan:', selectedPlan);
  };

  const handleToggleTrial = () => {
    setUnlockTrial(!unlockTrial);
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.background]}
      style={styles.container}
    >
      {/* X Button - Absolute positioned */}
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Feather name="x" size={20} color={colors.textLight} />
      </Pressable>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
                tintColor={colors.primary}
              />
            </View>
            <Text style={styles.title}>Unlock a New Reality</Text>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Feather name="check" size={18} color={colors.primary} style={styles.checkIcon} />
            <Text style={styles.benefitText}>Fast-track your transformation with AI-powered sessions.</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Feather name="check" size={18} color={colors.primary} style={styles.checkIcon} />
            <Text style={styles.benefitText}>Personalised affirmations and audio in your own voice.</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Feather name="check" size={18} color={colors.primary} style={styles.checkIcon} />
            <Text style={styles.benefitText}>Uncover the beliefs holding you back.</Text>
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.plansContainer}>
          {/* Monthly Plan */}
          <Pressable 
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.selectedPlanCard
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planContent}>
              <Text style={styles.planTitle}>1 Month</Text>
            </View>
            <View style={styles.planRight}>
              <Text style={styles.planPrice}>9,99 $ / Month</Text>
            </View>
          </Pressable>

          {/* Yearly Plan */}
          <Pressable 
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.selectedPlanCard
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 50%</Text>
            </View>
            <View style={styles.planContent}>
              <Text style={styles.planTitle}>12 Months</Text>
            </View>
            <View style={styles.planRight}>
              <View style={styles.priceContainer}>
                <Text style={styles.originalPrice}>119,88 $</Text>
                <Text style={styles.planPrice}>59,99 $</Text>
              </View>
              <Text style={styles.monthlyPrice}>4,99 $ / Month</Text>
            </View>
          </Pressable>
        </View>

        {/* Toggle Section */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Unlock your 3-Day Free Trial today • Cancel anytime</Text>
            <Pressable 
              style={[
                styles.toggleSwitch,
                unlockTrial && styles.toggleSwitchActive
              ]} 
              onPress={handleToggleTrial}
            >
              <View style={[
                styles.toggleThumb,
                unlockTrial && styles.toggleThumbActive
              ]} />
            </Pressable>
          </View>
        </View>

        {/* Subscribe Button */}
        <Pressable style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.subscribeButtonText}>Start My Transformation</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing['5xl'],
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginTop: -spacing.lg,
  },
  logoContainer: {
    position: 'relative',
    width: 160,
    height: 160,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  benefitsContainer: {
    marginBottom: spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  checkIcon: {
    marginRight: spacing.sm,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: fonts.families.medium,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  plansContainer: {
    marginBottom: spacing.xl,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPlanCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    left: spacing.md,
    backgroundColor: '#F59E0B',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  saveBadgeText: {
    fontSize: 11,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
  },
  planContent: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planRight: {
    alignItems: 'flex-end',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    fontFamily: fonts.families.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  planPrice: {
    fontSize: 20,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
  },
  monthlyPrice: {
    fontSize: 14,
    fontFamily: fonts.families.regular,
    color: colors.textSecondary,
  },
  toggleContainer: {
    marginBottom: spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.textPrimary,
    flex: 1,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  subscribeButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  subscribeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: fonts.families.semiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
}); 