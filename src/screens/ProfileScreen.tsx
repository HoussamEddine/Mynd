import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants'
const { colors } = theme.foundations;;
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BottomTabParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'ProfileTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, signOut } = useAuth();

  const handleVoiceClonePress = () => {
    // Navigate to VoiceClone screen in the root stack
    navigation.navigate('VoiceClone');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#faf9ff', '#f3f1ff', '#eeeaff']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color={colors.primary} />
            </Pressable>
          </View>

          {/* User Info Section */}
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.userName}>{user?.user_metadata?.full_name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>Premium Member</Text>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎤 Voice Features</Text>
            
            {/* Voice Clone Testing Button */}
            <Pressable 
              style={styles.featureCard}
              onPress={handleVoiceClonePress}
            >
              <View style={styles.featureIconContainer}>
                <Ionicons name="mic" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Clone Your Voice</Text>
                <Text style={styles.featureDescription}>
                  Create personalized affirmations with your own voice
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>

            {/* Other Feature Cards */}
            <Pressable style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="library" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>My Affirmations</Text>
                <Text style={styles.featureDescription}>
                  Access your personal affirmation library
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>

            <Pressable style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="stats-chart" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Progress Analytics</Text>
                <Text style={styles.featureDescription}>
                  View your mindfulness journey insights
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Settings</Text>
            
            <Pressable style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="notifications" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Notifications</Text>
                <Text style={styles.featureDescription}>
                  Manage your reminder preferences
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>

            <Pressable style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Privacy & Security</Text>
                <Text style={styles.featureDescription}>
                  Control your data and privacy settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>

            <Pressable style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="help-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Help & Support</Text>
                <Text style={styles.featureDescription}>
                  Get help and contact support
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Account</Text>
            
            <Pressable style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="card" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Subscription</Text>
                <Text style={styles.featureDescription}>
                  Manage your premium subscription
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>

            <Pressable 
              style={[styles.featureCard, styles.logoutCard]}
              onPress={handleSignOut}
            >
              <View style={[styles.featureIconContainer, styles.logoutIconContainer]}>
                <Ionicons name="log-out" size={24} color="#e74c3c" />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, styles.logoutText]}>Sign Out</Text>
                <Text style={styles.featureDescription}>
                  Sign out of your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  subscriptionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  logoutCard: {
    borderColor: '#e74c3c20',
    borderWidth: 1,
  },
  logoutIconContainer: {
    backgroundColor: '#e74c3c15',
  },
  logoutText: {
    color: '#e74c3c',
  },
}); 