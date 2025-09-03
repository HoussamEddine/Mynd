import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, TextStyle, TouchableOpacity, LayoutChangeEvent, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Import desired icon sets
import { Text } from '../components/base/Text'; // Re-added AppText import for chart
import { theme } from '../constants'
const { colors } = theme.foundations;; // Assuming Colors constant exists
import AnimatedNumberScroll from './AnimatedNumberScroll'; // <-- Re-add import
import { useNavigation } from '@react-navigation/native'; // <-- Import hook
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // <-- Import type
import { RootStackParamList } from '../types/navigation'; // <-- Import param list type
import { LineChart } from "react-native-chart-kit"; // <-- Import LineChart

interface StatCardProps {
  iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap; // Allow from multiple sets
  iconColor: string;
  iconBackgroundColor: string;
  label: string;
  value: number | string; // Allow string or number
  unit?: string; // Optional unit string
  iconSet?: 'Ionicons' | 'MaterialCommunityIcons'; // Specify icon set
  isMoodCard?: boolean; // Add flag for special styling
  numberAnimationDelay?: number; // <-- Add prop for number delay
}

const STAT_CARD_SLOT_HEIGHT = 18; // Define slot height for stat card numbers

// Sub-component for a single stat card
function StatCard({
  iconName,
  iconColor,
  iconBackgroundColor,
  label,
  value,
  unit, // Added unit prop
  iconSet = 'Ionicons', // Default to Ionicons
  isMoodCard = false,
  numberAnimationDelay = 0, // <-- Receive prop with default
}: StatCardProps) {
  const IconComponent = iconSet === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  
  // --- Style Merging --- 
  let cardStyle: ViewStyle = { ...styles.statCardContainer }; 
  let iconContainerStyle: ViewStyle = { ...styles.iconCircle, backgroundColor: iconBackgroundColor };
  let textContainerStyle: ViewStyle = { ...styles.textContainer };
  let labelStyle: TextStyle = { ...styles.label };
  // Use specific styles for value and unit again
  let valueStyle: TextStyle = { ...styles.valueText }; 
  let unitStyle: TextStyle = { ...styles.unitText }; 

  if (isMoodCard) {
    cardStyle = { ...cardStyle, ...styles.moodCardContainer };
    iconContainerStyle = { ...iconContainerStyle, ...styles.moodIconCircle };
    textContainerStyle = { ...textContainerStyle, ...styles.moodTextContainer };
    labelStyle = { ...labelStyle, ...styles.moodLabel };
    valueStyle = { ...valueStyle, ...styles.moodValueText }; 
    unitStyle = { ...unitStyle, ...styles.moodUnitText }; 
  }
  // --- End Style Merging ---

  // --- Reintroduce Conditional Rendering & Animation ---
  const renderValue = isMoodCard ? (
      // Mood value is just text
      <Text style={valueStyle}>{value}</Text>
  ) : (
      // Other values use animation + unit
      <View style={styles.valueContainer}> 
          <AnimatedNumberScroll 
              targetValue={value as number} // Value must be number here
              slotHeight={STAT_CARD_SLOT_HEIGHT}
              textStyle={valueStyle}
              delay={numberAnimationDelay} // <-- Use the passed delay
          />
          {unit && <Text style={unitStyle}> {unit}</Text>} 
      </View>
  );

  return (
    <View style={cardStyle}>
      <View style={iconContainerStyle}>
        <IconComponent name={iconName as any} size={isMoodCard ? 28 : 22} color={iconColor} />
      </View>
      <View style={textContainerStyle}>
        <Text style={labelStyle}>{label}</Text>
        {/* Use the conditional renderValue */}
        {renderValue} 
      </View>
    </View>
  );
}

interface StatsGridProps {
  statsData?: StatCardProps[]; // Make optional if using default
  animationStartDelay?: number; // <-- Accept optional delay from parent
}

// --- Reintroduce Timeframe type ---
type Timeframe = 'week' | 'month' | 'year';

const screenWidth = Dimensions.get("window").width; // <-- Get screen width for chart

export function StatsGrid({ statsData, animationStartDelay }: StatsGridProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('week');
  const timeframes: { label: string; value: Timeframe }[] = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
  ];

  const handleTimeframePress = (value: Timeframe) => {
    setActiveTimeframe(value);
    // Future: Trigger data refetching
  };

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // --- Mock Data Sets for Different Timeframes ---
  const weekStats: StatCardProps[] = [
    { iconName: 'headset-outline', iconColor: colors.primary || '#1D4ED8', iconBackgroundColor: colors.primaryLight || '#DBEAFE', label: 'Total Practice', value: 125, unit: 'min', iconSet: 'Ionicons' },
    { iconName: 'checkmark-done-outline', iconColor: colors.success || '#047857', iconBackgroundColor: colors.surfaceSubtle || '#D1FAE5', label: 'Sessions Done', value: 18, unit: 'times', iconSet: 'Ionicons' },
  ];

  const monthStats: StatCardProps[] = [
    { iconName: 'headset-outline', iconColor: colors.primary || '#1D4ED8', iconBackgroundColor: colors.primaryLight || '#DBEAFE', label: 'Total Practice', value: 580, unit: 'min', iconSet: 'Ionicons' },
    { iconName: 'checkmark-done-outline', iconColor: colors.success || '#047857', iconBackgroundColor: colors.surfaceSubtle || '#D1FAE5', label: 'Sessions Done', value: 75, unit: 'times', iconSet: 'Ionicons' },
  ];

  const yearStats: StatCardProps[] = [
    { iconName: 'headset-outline', iconColor: colors.primary || '#1D4ED8', iconBackgroundColor: colors.primaryLight || '#DBEAFE', label: 'Total Practice', value: 6960, unit: 'hr', iconSet: 'Ionicons' }, // Note: Unit change maybe?
    { iconName: 'checkmark-done-outline', iconColor: colors.success || '#047857', iconBackgroundColor: colors.surfaceSubtle || '#D1FAE5', label: 'Sessions Done', value: 912, unit: 'times', iconSet: 'Ionicons' },
  ];

  // --- End Mock Data Sets ---
  
  // --- Mock Data Sets for Chart ---
  const weekChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [20, 15, 25, 10, 30, 22, 18],
        color: (opacity = 1) => colors.primary || `rgba(134, 65, 244, ${opacity})`, 
        strokeWidth: 2 
      }
    ],
    // legend: ["Practice Minutes/Day"] // <-- Removed legend
  };
  const monthChartData = {
    labels: ["W1", "W2", "W3", "W4"],
    datasets: [
      { data: [125, 150, 130, 175],
        color: (opacity = 1) => colors.primary || `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2 } 
    ],
    // legend: ["Practice Minutes/Week"] // <-- Removed legend
  };
  const yearChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      { data: [580, 610, 550, 620, 600, 650, 680, 700, 660, 710, 690, 720],
        color: (opacity = 1) => colors.primary || `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2 } 
    ],
    // legend: ["Practice Minutes/Month"] // <-- Removed legend
  };
  // --- End Mock Chart Data ---

  // --- Mock Tip Data ---
  const quickTip = "Consistency is key! Even 5 minutes of daily practice builds momentum.";
  // --- End Mock Tip Data ---

  // --- Select Data Based on Timeframe using useMemo ---
  const currentDisplayStats = useMemo(() => {
    switch (activeTimeframe) {
      case 'month':
        return monthStats;
      case 'year':
        return yearStats;
      case 'week':
      default:
        return weekStats;
    }
  }, [activeTimeframe]);

  // Extract data for rendering
  const practiceData = currentDisplayStats[0]; 
  const sessionsData = currentDisplayStats[1]; 

  const currentChartData = useMemo(() => {
    switch (activeTimeframe) {
      case 'month':
        return monthChartData;
      case 'year':
        return yearChartData;
      case 'week':
      default:
        return weekChartData;
    }
  }, [activeTimeframe]);

  // --- Determine Chart Suffix based on Timeframe ---
  const yAxisSuffix = useMemo(() => {
      // Check if the 'year' data source uses 'hr'
      if (activeTimeframe === 'year' && yearStats[0]?.unit === 'hr') {
          return 'h';
      }
      return 'm'; // Default to minutes
  }, [activeTimeframe]);
  // --- End Chart Suffix Logic ---

  const NUMBER_ANIM_OFFSET = 300;
  const baseDelay = animationStartDelay ?? 0;

  return (
    <View>
      <View style={styles.navContainer}>
        {timeframes.map((item) => {
          const isActive = activeTimeframe === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => handleTimeframePress(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.leftColumn}>
          <StatCard {...practiceData} numberAnimationDelay={baseDelay + NUMBER_ANIM_OFFSET} />
          <StatCard {...sessionsData} numberAnimationDelay={baseDelay + NUMBER_ANIM_OFFSET} />
        </View>

        <View style={styles.rightColumn}> 
          <View style={styles.tipCardContainer}> 
             <View style={styles.tipCardIconContainer}>
                <Ionicons 
                    name="bulb-outline" 
                    size={24} // Slightly smaller icon
                    color={colors.primary || '#8B5CF6'} 
                />
             </View>
             <Text style={styles.tipCardText}>{quickTip}</Text>
          </View>
        </View>
      </View>
      
      {/* Practice Trend Chart */} 
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Practice Trend</Text>
        <LineChart
          data={currentChartData}
          width={screenWidth - 50} // Slightly wider chart
          height={220}
          yAxisSuffix={yAxisSuffix} // Use dynamic suffix
          yAxisInterval={1} // Show more labels if needed, adjust as necessary
          chartConfig={{
            backgroundColor: colors.chartContainerBg || "#FFFFFF", // Match container background
            backgroundGradientFrom: colors.chartContainerBg || "#FFFFFF",
            backgroundGradientTo: colors.chartContainerBg || "#FFFFFF",
            decimalPlaces: 0, 
            color: (opacity = 1) => colors.chartAxisColor || `rgba(180, 180, 180, ${opacity})`, // Lighter axis color
            labelColor: (opacity = 1) => colors.chartLabelColor || `rgba(150, 150, 150, ${opacity})`, // Lighter label color
            style: {},
            propsForDots: {
              r: "3", // Smaller dots
              strokeWidth: "1",
              stroke: colors.primary || "#8B5CF6" // Match line color
            },
          }}
          bezier // Keep smooth line
          style={styles.chartStyle}
          // Optional: Hide vertical labels
          // withVerticalLabels={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Reintroduce Nav styles ---
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background || '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 15, 
  },
  navItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: colors.primaryLight || '#EEDAFE',
  },
  navText: {
    fontSize: 13,
    color: colors.textSecondary || '#6B7280',
    fontWeight: '500',
  },
  navTextActive: {
    color: colors.primary || '#8B5CF6',
    fontWeight: '600',
  },
  // --- End Nav Styles --- 

  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 10, // Added back margin if needed
  },
  leftColumn: {
    width: '48%',
  },
  rightColumn: {
    width: '48%',
  },
  statCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    width: '100%', 
    marginBottom: 15,
    // Add shadow/elevation if needed
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconCircle: {
    width: 44, // Slightly larger icon circle
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // No margin here, margin will be on text container
  },
  textContainer: {
    flex: 1, // Take remaining space
    marginLeft: 12, // <<< Added margin for spacing
    justifyContent: 'center', // Center text vertically if needed
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary || '#6B7280',
    marginBottom: 2, // Small space between label and value
  },
  valueContainer: { // Container for value + unit
    flexDirection: 'row',
    alignItems: 'flex-end', // Align unit baseline with number
  },
  valueText: {
    fontSize: STAT_CARD_SLOT_HEIGHT, // Match slot height
    fontWeight: 'bold',
    color: colors.textPrimary || '#1F2937',
    lineHeight: STAT_CARD_SLOT_HEIGHT * 1.1, // Adjust line height for scroll
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary || '#1F2937',
    marginLeft: 2, // Small space before unit
    paddingBottom: 1, // Fine-tune baseline alignment
  },
  
  // Mood Card Overrides
  moodCardContainer: { 
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20, 
    paddingHorizontal: 20,
    minHeight: 150, // Keep minHeight
  },
  moodIconCircle: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
  },
  moodTextContainer: {
  },
  moodLabel: {
  },
  moodValueText: {
  },
  moodUnitText: { 
    display: 'none', 
  },
  
  // Chart Styles
  chartContainer: {
    marginTop: 25, 
    alignItems: 'center',
    backgroundColor: colors.chartContainerBg || '#FFFFFF', 
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 5, // Reduced horizontal padding slightly
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary || '#1F2937',
    marginBottom: 10,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },

  // Add Tip Card Styles
  tipCardContainer: {
    backgroundColor: colors.primaryLight || '#F3E8FF', // Light purple background
    borderRadius: 16,
    padding: 15, // Adjusted padding
    width: '100%', 
    height: 160, // Match previous card height
    flexDirection: 'column',
    justifyContent: 'center', // Center content
    alignItems: 'center', // Center content
    // Add shadow/elevation to match other cards
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tipCardIconContainer: {
    marginBottom: 12, // Space below icon
    // Optional background for icon:
    // backgroundColor: 'rgba(139, 92, 246, 0.1)', 
    // borderRadius: 20,
    // padding: 8,
  },
  tipCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary || '#1F2937',
    textAlign: 'center', 
    lineHeight: 20, // Improve readability
  },
});

export default StatsGrid; 