import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/base/Text';
import { theme } from '../constants'
const { colors } = theme.foundations;;
import Icon from '../components/LucideIcon';
import Svg, { Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

const timeFilters = [
  { id: 'anytime', label: 'Anytime' },
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'night', label: 'Night' },
];

// Mock data for stats
const statsData = {
  currentStreak: 5,
  longestStreak: 27,
  habitsCompleted: 18,
  completionRate: 88,
};

// Mock data for weekly performance
const weeklyPerformance = [
  { day: 'S', value: 45 },
  { day: 'M', value: 60 },
  { day: 'T', value: 52 },
  { day: 'W', value: 25 },
  { day: 'T', value: 75 },
  { day: 'F', value: 95 },
  { day: 'S', value: 68 },
];

// Components
interface TimeFilterTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TimeFilterTab = ({ label, isActive, onPress }: TimeFilterTabProps) => (
  <TouchableOpacity
    style={[styles.filterTab, isActive && styles.activeFilterTab]}
    onPress={onPress}
  >
    <Text 
      style={[
        styles.filterTabText, 
        isActive && styles.activeFilterTabText
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

interface StatCardProps {
  icon: any; // Using any for now to avoid icon type conflicts
  value: number;
  label: string;
  accentColor: string;
  hasPercent?: boolean;
}

const StatCard = ({ icon, value, label, accentColor, hasPercent = false }: StatCardProps) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={22} color={accentColor} style={styles.statIcon} />
    <Text style={styles.statValue}>
      {value}{hasPercent && '%'}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface BarChartData {
  day: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
}

const BarChart = ({ data }: BarChartProps) => {
  const maxValue = Math.max(...data.map((item: BarChartData) => item.value));
  const barWidth = (width - 60) / data.length - 10; // Account for padding and spacing

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((item: BarChartData, index: number) => {
          const barHeight = (item.value / maxValue) * 120; // 120 is max bar height
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: barHeight, 
                      backgroundColor: index % 2 === 0 ? colors.lightPink : colors.primary || '#8B5CF6' 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export function ProgressTabScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('anytime');

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time filter tabs */}
        <View style={styles.filterTabsContainer}>
          {timeFilters.map((filter) => (
            <TimeFilterTab
              key={filter.id}
              label={filter.label}
              isActive={activeFilter === filter.id}
              onPress={() => setActiveFilter(filter.id)}
            />
          ))}
        </View>

        {/* Stats grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="flame"
              value={statsData.currentStreak}
              label="Current streak"
              accentColor={colors.lightPink || '#FDA4AF'}
            />
            <StatCard
              icon="rocket"
              value={statsData.longestStreak}
              label="Longest streak"
              accentColor={colors.primary || '#8B5CF6'}
            />
          </View>
          
          <View style={styles.statsRow}>
            <StatCard
              icon="check"
              value={statsData.habitsCompleted}
              label="Habit completed"
              accentColor={colors.success || '#10B981'}
            />
            <StatCard
              icon="trending-up"
              value={statsData.completionRate}
              label="Completion rate"
              accentColor={colors.warning || '#F59E0B'}
              hasPercent
            />
          </View>
        </View>

        {/* Weekly performance chart */}
        <View style={styles.performanceContainer}>
          <Text style={styles.performanceTitle}>Average Performance</Text>
          <BarChart data={weeklyPerformance} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  
  // Filter tabs
  filterTabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: colors.backgroundLight || '#F3F4F6',
    borderRadius: 100,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 100,
  },
  activeFilterTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 14,
    color: colors.textSecondary || '#6B7280',
  },
  activeFilterTabText: {
    color: colors.textPrimary || '#1F2937',
    fontWeight: '500',
  },
  
  // Stats cards
  statsContainer: {
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary || '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary || '#6B7280',
  },
  
  // Performance chart
  performanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary || '#1F2937',
    marginBottom: 24,
  },
  chartContainer: {
    height: 180,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  barWrapper: {
    width: '60%',
    alignItems: 'center',
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 100,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary || '#6B7280',
  },
});

export default ProgressTabScreen; 