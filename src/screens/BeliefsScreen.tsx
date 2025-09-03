import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Keyboard, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../constants'
const { colors } = theme.foundations;;
import BeliefCard from '../components/BeliefCard';
import { FlatList } from 'react-native-gesture-handler';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackNavigationProp } from '../types/navigation';
// import { navigate } from '../../App'; // Commented out to fix import error
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

// Renamed from Task to Belief
interface Belief {
  id: string;
  title: string;
  timeInfo: string;
  details: string;
  status: 'completed' | 'pending' | 'active';
  progress?: number;
  createdAt?: string; // When the belief was first added
  affirmationText?: string; // Associated affirmation text
}

// Type for the special input item marker
interface InputItem {
  id: '__INPUT__'; // Unique ID for the input row
  type: 'input';
}

// Combined type for FlatList data
type ListItem = Belief | InputItem;

// Sample affirmations to choose from
const sampleAffirmations = [
  "I am capable and competent in everything I do.",
  "I embrace challenges as opportunities for growth.",
  "I am worthy of love and respect from others.",
  "I believe in my ability to succeed.",
  "My potential is limitless and I can achieve anything I set my mind to."
];

// Updated to negative beliefs that users want to overcome
const dummyBeliefs: Belief[] = [
  // Active items first
  { 
    id: '3', 
    title: 'I\'m not good enough for this job', 
    timeInfo: 'Active belief', 
    details: '> Details', 
    status: 'active', 
    progress: 0.3,
    createdAt: 'Jan 15, 2023',
    affirmationText: 'I am qualified and bring unique value to my work.'
  },
  
  // Pending items next
  { 
    id: '4', 
    title: 'I always fail when I try new things', 
    timeInfo: 'Pending belief', 
    details: '> Details', 
    status: 'pending', 
    progress: 0.7,
    createdAt: 'Feb 23, 2023' 
  },
  { 
    id: '5', 
    title: 'People don\'t really like me', 
    timeInfo: 'Pending belief', 
    details: '> Details', 
    status: 'pending', 
    progress: 0.1,
    createdAt: 'Mar 10, 2023',
    affirmationText: 'I am likable and people enjoy my company.' 
  },
  { 
    id: '6', 
    title: 'I\'ll never be successful in life', 
    timeInfo: 'Pending belief', 
    details: '> Details', 
    status: 'pending', 
    progress: 0, 
    createdAt: 'Apr 5, 2023'
  },
  
  // Completed items last - limitations that have been overcome
  { 
    id: '1', 
    title: 'I\'m too shy to speak in public', 
    timeInfo: 'Overcome', 
    details: '> Details', 
    status: 'completed', 
    progress: 1,
    createdAt: 'Nov 3, 2022',
    affirmationText: 'I am confident and articulate when speaking to others.' 
  },
  { 
    id: '2', 
    title: 'I can\'t handle criticism well', 
    timeInfo: 'Overcome', 
    details: '> Details', 
    status: 'completed', 
    progress: 1,
    createdAt: 'Dec 12, 2022',
    affirmationText: 'I welcome feedback as an opportunity to grow.' 
  }
];

// Input item marker instance
const inputItemMarker: InputItem = { id: '__INPUT__', type: 'input' };

const BeliefsScreen = () => {
  const insets = useSafeAreaInsets();
  const [newBelief, setNewBelief] = useState('');
  const [beliefs, setBeliefs] = useState<Belief[]>(dummyBeliefs);
  const newBeliefRef = useRef<Belief | null>(null);
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute();
  const isFocused = useIsFocused();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(30);

  useEffect(() => {
    // Animate in when component mounts
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    listOpacity.value = withTiming(1, { duration: 800 });
    listTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));
  
  // Check for params when screen is focused or parent params change
  useEffect(() => {
    const checkParams = () => {
      // Check route params
      if (route.params) {
        const params = route.params as any;
        if (params.selectedAffirmation && params.beliefId) {
          // Update the belief with the selected affirmation
          setBeliefs(prevBeliefs => prevBeliefs.map(belief => 
            belief.id === params.beliefId 
              ? { ...belief, affirmationText: params.selectedAffirmation }
              : belief
          ));
          
          // Clear params after using them
          navigation.setParams({ selectedAffirmation: undefined, beliefId: undefined });
        }
      }
      
      // Check if parent route has passed parameters
      const parent = navigation.getParent();
      if (parent) {
        const parentState = parent.getState();
        const parentRoute = parentState.routes[parentState.index];
        const parentParams = parentRoute.params as any;
        
        if (parentParams?.selectedAffirmation && parentParams?.beliefId) {
          // Update the belief with the selected affirmation
          setBeliefs(prevBeliefs => prevBeliefs.map(belief => 
            belief.id === parentParams.beliefId 
              ? { ...belief, affirmationText: parentParams.selectedAffirmation }
              : belief
          ));
          
          // Clear params after using them
          parent.setParams({ 
            selectedAffirmation: undefined, 
            beliefId: undefined 
          });
        }
      }
    };
    
    if (isFocused) {
      checkParams();
    }
  }, [isFocused, route.params, navigation]);
  
  // Combined data with active/pending items that can be dragged, and completed items + input at the end
  const listData = useMemo(() => {
    // Separate active/pending from completed beliefs
    const activeAndPendingBeliefs = beliefs.filter(belief => belief.status !== 'completed');
    const completedBeliefs = beliefs.filter(belief => belief.status === 'completed');
    
    // Combine with input marker at the end
    return [...activeAndPendingBeliefs, ...completedBeliefs, inputItemMarker] as ListItem[];
  }, [beliefs]);

  const handleAddBelief = () => {
    if (newBelief.trim()) {
      // Format today's date
      const today = new Date();
      const createdAt = today.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // Create a new belief
      const newBeliefItem: Belief = {
        id: Date.now().toString(),
        title: newBelief,
        timeInfo: 'Pending belief',
        details: '> Details',
        status: 'pending',
        progress: 0,
        createdAt
      };
      
      // Add the new belief before completed beliefs but after active/pending ones
      const activeAndPendingBeliefs = beliefs.filter(belief => belief.status !== 'completed');
      const completedBeliefs = beliefs.filter(belief => belief.status === 'completed');
      
      // Place the new belief at the end of active/pending beliefs
      setBeliefs([...activeAndPendingBeliefs, newBeliefItem, ...completedBeliefs]);
      setNewBelief('');
      Keyboard.dismiss();
      
      // Navigate to AffirmationSelection instead of AffirmationScreen
              navigation.navigate('AffirmationSelection', { beliefId: newBeliefItem.id });
    }
  };
  
  // Update the handleSelectAffirmation function
  const handleSelectAffirmation = (beliefId: string) => {
    // Navigate to AffirmationSelection instead of AffirmationScreen
          navigation.navigate('AffirmationSelection', { beliefId });
  };
  
  // Move items for manual sorting
  const moveItem = (from: number, to: number) => {
    const newBeliefs = [...beliefs];
    const activeAndPendingBeliefs = newBeliefs.filter(belief => belief.status !== 'completed');
    const completedBeliefs = newBeliefs.filter(belief => belief.status === 'completed');
    
    // Only allow reordering active/pending items
    if (from < activeAndPendingBeliefs.length && to < activeAndPendingBeliefs.length) {
      const item = activeAndPendingBeliefs.splice(from, 1)[0];
      activeAndPendingBeliefs.splice(to, 0, item);
      
      // Update the beliefs list
      setBeliefs([...activeAndPendingBeliefs, ...completedBeliefs]);
    }
  };

  // Get belief counts for stats
  const beliefStats = useMemo(() => {
    const active = beliefs.filter(b => b.status === 'active').length;
    const pending = beliefs.filter(b => b.status === 'pending').length;
    const completed = beliefs.filter(b => b.status === 'completed').length;
    return { active, pending, completed };
  }, [beliefs]);

  // Render items
  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    // Handle input item
    if (item.id === '__INPUT__') {
      return (
        <View style={styles.inputRowOuterContainer}>
          <View style={styles.inputFieldWrapper}>
            <TextInput
              style={styles.input}
              placeholder="What limiting belief would you like to transform?"
              placeholderTextColor={colors.textSecondary || '#A0A0A0'}
              value={newBelief}
              onChangeText={setNewBelief}
              onSubmitEditing={handleAddBelief}
              returnKeyType="send"
              blurOnSubmit={false}
              multiline={false}
            />
            {newBelief.trim() && (
              <TouchableOpacity 
                style={styles.submitArrow}
                onPress={handleAddBelief}
              >
                <Ionicons 
                  name="arrow-forward-circle" 
                  size={28} 
                  color={colors.primary || '#8B5CF6'} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // Cast to Belief and check if it's completed
    const belief = item as Belief;
    
    return (
      <BeliefCard 
        belief={belief}
        isLast={index === listData.length - 2} // Check if it's the last belief before input
        onSelectAffirmation={handleSelectAffirmation}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Modern gradient background */}
      <LinearGradient
        colors={['#faf9ff', '#f3f1ff', '#eeeaff']}
        style={styles.gradientBackground}
      />

      {/* Header Section */}
      <Animated.View style={[styles.headerContainer, { paddingTop: insets.top }, headerAnimatedStyle]}>
        <View style={styles.headerContent}>
          {/* Back Arrow */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary || '#1F2937'} />
          </TouchableOpacity>
          
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Transform Your Beliefs</Text>
            <Text style={styles.screenSubtitle}>
              Identify and rewire limiting thoughts into empowering beliefs
            </Text>
          </View>
          
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.activeStatCard]}>
              <Text style={styles.statNumber}>{beliefStats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={[styles.statCard, styles.pendingStatCard]}>
              <Text style={styles.statNumber}>{beliefStats.pending}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={[styles.statCard, styles.completedStatCard]}>
              <Text style={styles.statNumber}>{beliefStats.completed}</Text>
              <Text style={styles.statLabel}>Transformed</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Beliefs List */}
      <Animated.View style={[styles.listContainer, listAnimatedStyle]}>
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9ff',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerContent: {
    paddingTop: 20,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    padding: 8,
  },
  titleSection: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary || '#1F2937',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 16,
    color: colors.textSecondary || '#6B7280',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activeStatCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  pendingStatCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  completedStatCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary || '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary || '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  inputRowOuterContainer: { 
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  inputFieldWrapper: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary || '#1F2937',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  submitArrow: {
    marginLeft: 12,
    padding: 4,
  },
});

export default BeliefsScreen; 