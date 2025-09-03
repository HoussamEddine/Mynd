import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants'
const { colors } = theme.foundations;;
import type { BottomTabParamList } from '../types/navigation';
import { Text } from '../components/base/Text';

// TODO: Verify if this file (BottomNavigation.tsx) and its components are still in use.
// It appears to define a separate BottomTabNavigator that might conflict with AppTabs.tsx.

// Placeholder Screens - Names might mismatch updated Tab names
const HomeActualScreen = () => <View style={styles.placeholderScreen}><Text>Home Tab Content</Text></View>;
const StatsScreen = () => <View style={styles.placeholderScreen}><Text>Stats Screen</Text></View>;
const DiscoverScreen = () => <View style={styles.placeholderScreen}><Text>Discover Screen</Text></View>;
const SettingsScreen = () => <View style={styles.placeholderScreen}><Text>Settings Screen</Text></View>;
// Add placeholders for other screens if needed
const PlaceholderScreen = ({ routeName }: { routeName: string }) => <View style={styles.placeholderScreen}><Text>{routeName} Content</Text></View>;


const Tab = createBottomTabNavigator<BottomTabParamList>();

// Function to get Ionicons name based on route
function getIconName(routeName: keyof BottomTabParamList, focused: boolean): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case 'HomeTab': return focused ? 'home' : 'home-outline';
    // case 'SearchTab': return focused ? 'search' : 'search-outline'; // Commented out due to likely missing type
    // case 'LikesTab': return focused ? 'heart' : 'heart-outline'; // Commented out due to likely missing type
    // case 'NotificationsTab': return focused ? 'notifications' : 'notifications-outline'; // Commented out due to likely missing type
    case 'ProfileTab': return focused ? 'person' : 'person-outline';
    // Add cases for 'ExploreTab', 'AddTab', 'CalendarTab' if this component is intended to be used and aligned with AppTabs.tsx
    default: return 'help-circle-outline'; // Default icon
  }
}

export default function HomeTabs() { // Renamed component for clarity, was conflicting
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBarStyle,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getIconName(route.name, focused);
          const iconColor = focused ? colors.textPrimary : colors.textSecondary;
          const iconSize = 26;
          return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
      })}
    >
      {/* Use names from BottomTabParamList */}
      <Tab.Screen name="HomeTab" component={HomeActualScreen} /> 
      {/* <Tab.Screen name="SearchTab" component={() => <PlaceholderScreen routeName="SearchTab" />} /> // Commented out due to likely missing type */}
      {/* <Tab.Screen name="LikesTab" component={() => <PlaceholderScreen routeName="LikesTab" />} /> // Commented out due to likely missing type */}
      {/* <Tab.Screen name="NotificationsTab" component={() => <PlaceholderScreen routeName="NotificationsTab" />} /> // Commented out due to likely missing type */}
      <Tab.Screen name="ProfileTab" component={() => <PlaceholderScreen routeName="ProfileTab" />} /> 
      {/* Removed old screens: Stats, Discover, Settings */}
      {/* Add screens for 'ExploreTab', 'AddTab', 'CalendarTab' if needed */}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
   tabBarStyle: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    elevation: 0,
    backgroundColor: colors.tabBarBackground || '#ffffff',
    borderRadius: 15,
    height: 70,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background || '#FFFFFF',
  },
});