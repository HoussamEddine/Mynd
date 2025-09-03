import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/base/Text';
import { theme } from '../constants'
const { colors } = theme.foundations;;
import Icon from '../components/LucideIcon'; // Assuming you have a LucideIcon component

const TABS = ['Activity', 'Mood', 'Food', 'Sleep'];

const MOOD_HISTORY_DATA = [
  { day: 'Mon', mood: 'angry', color: '#F87171', icon: 'frown' }, // Example icon
  { day: 'Tue', mood: 'shy', color: '#FBCFE8', icon: 'smile' },   // Example icon
  { day: 'Wed', mood: 'annoyed', color: '#93C5FD', icon: 'meh' },  // Example icon
  { day: 'Thr', mood: 'anxious', color: '#FBCFE8', icon: 'meh' }, // Example icon (using pink again)
  { day: 'Fri', mood: 'happy', color: '#86EFAC', icon: 'smile-plus' }, // Example icon
];

export function AiJournalScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Activity');

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={'#FFFFFF'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Top Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.activeTabButtonText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mood History Card */}
        <View style={styles.moodHistoryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mood History</Text>
            <Icon name="settings" size={24} color={colors.textSecondary || '#6B7280'} />
          </View>

          <View style={styles.moodsRow}>
            {MOOD_HISTORY_DATA.map((item) => (
              <View key={item.day} style={styles.moodItem}>
                <View style={[styles.moodIconContainer, { backgroundColor: item.color }]}>
                  {/* Placeholder for actual emoji/icon. Using Lucide icons for now */}
                  <Icon name={item.icon as any} size={28} color={'#FFFFFF'} />
                </View>
                <Text style={styles.moodDayText}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Add more content here based on activeTab if needed */}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0, // Remove border if present
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40, // Extra padding at the bottom
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16, // Rounded corners for individual tab buttons
    backgroundColor: 'transparent', // Default is transparent
  },
  activeTabButton: {
    backgroundColor: colors.primaryLight || '#E0E7FF', // Light primary color for active tab (adjust as needed)
    borderColor: colors.primary || '#6366F1',
    borderWidth: 1.5,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary || '#6B7280',
  },
  activeTabButtonText: {
    color: colors.primary || '#4338CA', // Darker primary color for active text
    fontWeight: '600',
  },
  moodHistoryCard: {
    backgroundColor: colors.surface || '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary || '#1F2937',
  },
  moodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  moodItem: {
    alignItems: 'center',
    width: 56, // Fixed width for each mood item
  },
  moodIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16, // Rounded squares for emojis
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodDayText: {
    fontSize: 13,
    color: colors.textSecondary || '#6B7280',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 20,
    color: '#333333',
  },
});

export default AiJournalScreen; 