import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants';
const { foundations } = theme;
import type { BottomTabParamList, RootStackParamList } from '../types/navigation';
import { Text } from '../components/base/Text';
import BackgroundShape from '../components/BackgroundShape';
import StaggeredEntryContainer from '../components/StaggeredEntryContainer';
import Svg, { Circle } from 'react-native-svg';
import AffirmationCard from '../components/AffirmationCard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import StatsGrid from '../components/StatsGrid';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SemiCircularMoodSlider } from '../components/mood/MoodSlider';
import * as Haptics from 'expo-haptics';
import BeliefsScreen from '../screens/BeliefsScreen';
import Icon from '../components/LucideIcon';
import DreamscapeScreen from '../screens/DreamscapeScreen';
import HabitTrackerScreen from '../screens/HabitTrackerScreen';
import ProgressTabScreen from '../screens/ProgressTabScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AffirmationScreen from '../screens/AffirmationScreen';
import { supabase } from '../lib/supabase';


import { databaseService } from '../services/databaseService';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useAnimatedGestureHandler, runOnJS } from 'react-native-reanimated';

// Component wrappers to avoid inline functions
const HomeTabWrapper = () => (
  <View style={{ flex: 1, backgroundColor: foundations.colors.background }}>
    <HomeScreen />
  </View>
);

const AiJournalTabWrapper = () => (
  <View style={{ flex: 1, backgroundColor: foundations.colors.background }}>
            <DreamscapeScreen />
  </View>
);

const HabitTrackerTabWrapper = () => (
  <View style={{ flex: 1, backgroundColor: foundations.colors.background }}>
    <HabitTrackerScreen />
  </View>
);

const AffirmationsTabWrapper = () => (
  <View style={{ flex: 1 }}>
    <AffirmationScreen />
  </View>
);

const ProfileTabWrapper = () => (
  <View style={{ flex: 1, backgroundColor: foundations.colors.background }}>
    <ProfileScreen />
  </View>
);





const SPACING = 16;



// Define Stroke Widths First
const thickStrokeWidth = 8;
const mediumStrokeWidth = 4;
const progressStrokeWidth = 4;
const maxStrokeWidth = Math.max(thickStrokeWidth, mediumStrokeWidth, progressStrokeWidth);

// Define Radii based on equal VISUAL GAPS between stroke edges
const visualGap = 4; // Desired visual space between stroke edges
const baseRadius = 80; // Outermost circle center radius

// Middle Radius Calculation:
// Inner edge of outer circle = baseRadius - progressStrokeWidth / 2
// Outer edge of middle circle = (Inner edge of outer circle) - visualGap
// Center radius of middle circle (mediumRadius) = (Outer edge of middle circle) - mediumStrokeWidth / 2
const mediumRadius = baseRadius - (progressStrokeWidth / 2) - visualGap - (mediumStrokeWidth / 2);

// Small Radius Calculation:
// Inner edge of middle circle = mediumRadius - mediumStrokeWidth / 2
// Outer edge of inner circle = (Inner edge of middle circle) - visualGap
// Center radius of inner circle (smallRadius) = (Outer edge of inner circle) - thickStrokeWidth / 2
const smallRadius = mediumRadius - (mediumStrokeWidth / 2) - visualGap - (thickStrokeWidth / 2);

// Recalculate SVG size and center based on outermost radius and max stroke
const svgSize = baseRadius * 2 + maxStrokeWidth * 2;
const center = svgSize / 2;

// Faster animation configuration with shorter durations
const ANIMATION_OFFSET = 30;
const TITLE_DELAY = 50;
const BUTTONS_START_DELAY = 120;
const CARD_ANIMATION_DELAY = 80;
const PROGRESS_ANIMATION_DELAY = 200;
const MOOD_ANIMATION_BASE_DELAY = 50;

// Spring configuration for faster animations with less bounce
const springConfig = { 
  damping: 20, 
  stiffness: 150,
  mass: 0.7
};

// Define the layout animation for entering content - faster with no delay
const enteringAnimation = FadeInUp.duration(300).easing(Easing.out(Easing.cubic));

// --- Mood State Type and Data ---
// interface MoodState {
//   index: number;
//   label: string;
//   icon: keyof typeof MaterialCommunityIcons.glyphMap; // <-- Explicitly typed icon name
//   color: string;
// }
// const moodStates: MoodState[] = [ ... ];

// --- Integrated Components ---

// Update AffirmationProgress to accept isFirstAppLoad prop
interface AffirmationProgressProps {
  isFirstAppLoad: boolean;
}
const AffirmationProgress: React.FC<AffirmationProgressProps> = ({ isFirstAppLoad }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const affirmationToPractice = "Today, I choose joy and release negativity."; 

  // Define progress steps
  const currentStep = 2;
  const totalSteps = 3;
  const progressFraction = totalSteps > 0 ? currentStep / totalSteps : 0; // Calculate fraction (2/3)

  const circumference = 2 * Math.PI * baseRadius; 
  // Calculate offset based on the fraction
  const strokeDashoffset = circumference * (1 - progressFraction); 

  // Use the passed-in prop to control initial animation state
  const cardOpacity = useSharedValue(isFirstAppLoad ? 0 : 1);
  const cardScale = useSharedValue(isFirstAppLoad ? 0.9 : 1);
  const cardTranslateY = useSharedValue(isFirstAppLoad ? 20 : 0);
  
  // Trigger card animation on first mount only, based on prop
  useEffect(() => {
    if (isFirstAppLoad) {
      cardOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
      cardScale.value = withSpring(1, {
        damping: 20, 
        stiffness: 150,
        mass: 0.7
      });
      cardTranslateY.value = withSpring(0, {
        damping: 20, 
        stiffness: 150,
        mass: 0.7
      });
    }
    // Dependency array includes the prop to handle potential edge cases, though it shouldn't change after initial load.
  }, [isFirstAppLoad]);

  // Card animated styles - fixed TypeScript typing
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [
        { scale: cardScale.value },
        { translateY: cardTranslateY.value }
      ] as any
    };
  });

  const handleStartAffirmation = () => {
  };

  const handleNavigateToPlayer = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to affirmation text if no user
        navigation.navigate('SessionPlayer', { 
          affirmationText: affirmationToPractice
        });
        return;
      }

      // Try to get the latest transformation text
      const transformation = await databaseService.getLatestTransformation(user.id);
      
      if (transformation?.transformation_text) {
        navigation.navigate('SessionPlayer', { 
          transformationText: transformation.transformation_text
        });
      } else {
        // Fallback to affirmation text if no transformation found
        navigation.navigate('SessionPlayer', { 
          affirmationText: affirmationToPractice
        });
      }
    } catch (error) {
      console.error('Error fetching transformation text:', error);
      // Fallback to affirmation text on error
      navigation.navigate('SessionPlayer', { 
        affirmationText: affirmationToPractice
      });
    }
  };

  return (
    <View style={styles.progressContainer}>
      {/* Animate the card with our custom animation */}
      <Animated.View style={[styles.affirmationCardWrapper, cardAnimatedStyle]}>
        <AffirmationCard 
            affirmationText={affirmationToPractice}
            onStartPress={handleStartAffirmation} 
        />
      </Animated.View>
      
      {/* Apply staggered animation only on first app load based on prop */}
      {isFirstAppLoad ? (
        <StaggeredEntryContainer startDelay={PROGRESS_ANIMATION_DELAY} delayIncrement={100}>
          <View style={styles.circleContainer}>
            {/* Add Vertical Text Element */}
            <View style={styles.verticalTextContainer}>
              <View style={styles.verticalTextWrapper}>
                <Text style={styles.verticalText}>DAILY PRACTICE</Text>
              </View>
            </View>

            <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
              
              {/* Layer 1: Thickest Grey (Innermost) - Uses smallRadius */}
              <Circle
                cx={center}
                cy={center}
                r={smallRadius}
                stroke="#D3D3D3"
                strokeWidth={mediumStrokeWidth}
                fill="none"
              />

              {/* Layer 2: Medium Grey (Middle) - Uses mediumRadius */}
              <Circle
                cx={center}
                cy={center}
                r={mediumRadius}
                stroke="#E0E0E0"
                strokeWidth={thickStrokeWidth}
                fill="none"
              />
              
              {/* Layer 3: Purple Progress (Outermost) - Uses calculated offset */}
              <Circle
                cx={center}
                cy={center}
                r={baseRadius}
                stroke={foundations.colors.primary || '#8B5CF6'}
                strokeWidth={progressStrokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90, ${center}, ${center})`}
              />
            </Svg>
            
            {/* Percentage Text (positioned in the center) */}
            <View style={styles.percentageTextContainer}>
              <Text style={styles.percentageText}>
                {"2/3"}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.viewProgressButton} onPress={handleNavigateToPlayer}>
            <Text style={styles.viewProgressButtonText}>
              Start Rewiring
            </Text>
          </TouchableOpacity>
        </StaggeredEntryContainer>
      ) : (
        /* Render without animation when not first load */
        <>
          <View style={styles.circleContainer}>
            {/* Add Vertical Text Element */}
            <View style={styles.verticalTextContainer}>
              <View style={styles.verticalTextWrapper}>
                <Text style={styles.verticalText}>DAILY PRACTICE</Text>
              </View>
            </View>

            <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
              
              {/* Layer 1: Thickest Grey (Innermost) - Uses smallRadius */}
              <Circle
                cx={center}
                cy={center}
                r={smallRadius}
                stroke="#D3D3D3"
                strokeWidth={mediumStrokeWidth}
                fill="none"
              />

              {/* Layer 2: Medium Grey (Middle) - Uses mediumRadius */}
              <Circle
                cx={center}
                cy={center}
                r={mediumRadius}
                stroke="#E0E0E0"
                strokeWidth={thickStrokeWidth}
                fill="none"
              />
              
              {/* Layer 3: Purple Progress (Outermost) - Uses calculated offset */}
              <Circle
                cx={center}
                cy={center}
                r={baseRadius}
                stroke={foundations.colors.primary || '#8B5CF6'}
                strokeWidth={progressStrokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90, ${center}, ${center})`}
              />
            </Svg>
            
            {/* Percentage Text (positioned in the center) */}
            <View style={styles.percentageTextContainer}>
              <Text style={styles.percentageText}>
                {"2/3"}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.viewProgressButton} onPress={handleNavigateToPlayer}>
            <Text style={styles.viewProgressButtonText}>
              Start Rewiring
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// --- Placeholder Screen for other tabs ---
const PlaceholderScreen = ({ route }: { route: { name: string } }) => {
  return (
    <View style={styles.placeholderScreen}>
      <StatusBar style="light" />
      <Text style={[styles.placeholderText, { color: '#FFFFFF' }]}>
        {`${route.name} Screen`}
      </Text>
    </View>
  );
};

// Navigation Button Component
const NavigationButton = ({ 
  iconName, 
  label, 
  onPress,
  isActive = false
}: { 
  iconName: string, 
  label: string, 
  onPress: () => void,
  isActive?: boolean 
}) => (
  <TouchableOpacity 
    style={[
      styles.navButton, 
      isActive ? styles.activeNavButton : styles.inactiveNavButton
    ]} 
    onPress={onPress}
  >
    <View style={styles.navButtonIconContainer}>
      <Icon 
        name={iconName as any} 
        size={28} 
        color={isActive ? '#FFFFFF' : foundations.colors.textSecondary || '#64748B'} 
        strokeWidth={2}
      />
    </View>
    <Text 
      style={[
        styles.navButtonLabel,
        isActive ? styles.activeNavButtonLabel : styles.inactiveNavButtonLabel
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// --- Home Tab Screen ---
const HomeTabScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<string>('Rewire');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Check for focus events to set active tab to Beliefs when navigated from manage button
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check the global flag to see if we should navigate to Beliefs tab
      // Note: shouldNavigateToBeliefsTab variable removed as it's no longer needed
    });

    return unsubscribe;
  }, [navigation]);
  
  const isFirstAppLoadRef = React.useRef(true);

  // Animation for top elements
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(ANIMATION_OFFSET);
  const titleScale = useSharedValue(0.92);
  
  useEffect(() => {
    if (isFirstAppLoadRef.current) {
      // Title animations
      titleOpacity.value = withDelay(TITLE_DELAY, withTiming(1, { 
        duration: 400, 
        easing: Easing.out(Easing.cubic) 
      }));
      titleTranslateY.value = withDelay(TITLE_DELAY, withSpring(0, {
        damping: 18,
        stiffness: 150,
        mass: 0.7
      }));
      titleScale.value = withDelay(TITLE_DELAY, withSpring(1, {
        damping: 18,
        stiffness: 150,
        mass: 0.7
      }));
      
      setTimeout(() => {
        isFirstAppLoadRef.current = false;
      }, 800);

    }
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [
        { translateY: titleTranslateY.value }, 
        { scale: titleScale.value }
      ] as any
    };
  });
  
  // Function to render content based on active tab
  const renderActiveContent = () => {
    let content;
    const isFirst = isFirstAppLoadRef.current; 
    let requiresScrollView = true; // Default to true

    switch (activeTab) {
      case 'Rewire': 
        content = <AffirmationProgress key="rewire" isFirstAppLoad={isFirst} />;
        requiresScrollView = true; // This content might need parent scroll
        break;
      case 'Mood': // Beliefs Tab
        content = <BeliefsScreen key="beliefs" />;
        requiresScrollView = false; // BeliefsScreen has its own FlatList
        break;
      case 'Progress':
        content = <StatsGrid key="progress" />;
        requiresScrollView = true; // Assuming StatsGrid might need a ScrollView
        break;
      default:
        content = <AffirmationProgress key="default-rewire" isFirstAppLoad={isFirst} />;
        requiresScrollView = true;
    }
    
    if (requiresScrollView) {
      return (
        <ScrollView 
          style={styles.contentScrollView} 
          contentContainerStyle={styles.contentPanel} 
          showsVerticalScrollIndicator={false} 
        >
          <View style={styles.animatedContentWrapper}>{content}</View>
        </ScrollView>
      );
    }
    
    return (
      <View style={styles.nonScrollingContentWrapper}>
        {content}
      </View>
    );
  };

  return (
    <View style={styles.homeScreenContainer}>
      <StatusBar style="dark" />
      
      <BackgroundShape />
      
      <View style={[styles.contentArea, { paddingTop: insets.top + 10, zIndex: 1 }]}>
        {/* Apply animation to header wrapper */}
        <Animated.View style={[styles.fixedHeader, titleAnimatedStyle]}> 
          <Text variant="bold" style={styles.appNameTitle}>Mynd</Text>
        </Animated.View>

        {/* Spacer */}
        <View style={{ height: 65}} />
        
        {/* Top Navigation Buttons - Staggered animation only on first app load */}
        <View style={styles.navButtonsContainer}>
          {isFirstAppLoadRef.current ? (
            <StaggeredEntryContainer startDelay={BUTTONS_START_DELAY} delayIncrement={50}>
              <NavigationButton 
                iconName="brain"
                label="Rewire"
                isActive={activeTab === 'Rewire'}
                onPress={() => setActiveTab('Rewire')}
              />
              <NavigationButton 
                iconName="lightbulb"
                label="Beliefs"
                isActive={activeTab === 'Mood'}
                onPress={() => setActiveTab('Mood')}
              />
              <NavigationButton 
                iconName="activity"
                label="Progress"
                isActive={activeTab === 'Progress'}
                onPress={() => setActiveTab('Progress')}
              />
            </StaggeredEntryContainer>
          ) : (
            <>
              <NavigationButton 
                iconName="brain"
                label="Rewire"
                isActive={activeTab === 'Rewire'}
                onPress={() => setActiveTab('Rewire')}
              />
              <NavigationButton 
                iconName="lightbulb"
                label="Beliefs"
                isActive={activeTab === 'Mood'}
                onPress={() => setActiveTab('Mood')}
              />
              <NavigationButton 
                iconName="activity"
                label="Progress"
                isActive={activeTab === 'Progress'}
                onPress={() => setActiveTab('Progress')}
              />
            </>
          )}
        </View>
        
        {renderActiveContent()}

      </View>
    </View>
  );
};

// Custom TabBarButton component that disables the default press effect
const NoFeedbackTabBarButton = (props: any) => {
  // We remove the default android_ripple and style transformations on press
  return <Pressable {...props} style={({ pressed }) => [props.style]} />;
};

// --- Tab Navigator --- 
const Tab = createBottomTabNavigator<BottomTabParamList>();

const TabBarIcon = ({ routeName, focused }: { routeName: keyof BottomTabParamList, focused: boolean }) => {
  let iconName = '';
  let tabLabel = '';
  let useCustomIcon = false;
  // Use a more vibrant primary color for active tabs and a lighter gray for inactive
  const color = focused ? foundations.colors.primary || '#8B5CF6' : foundations.colors.tabInactive;
  const size = 20; // Smaller size for all icons
  
  // Map route names to more appropriate Lucide icon names and labels
  switch (routeName) {
    case 'HomeTab':
      iconName = 'home';
      tabLabel = 'Home';
      break;
    case 'AffirmationsTab':
      iconName = 'sparkles';
      tabLabel = 'Affirmations';
      break;
    case 'AiJournalTab':
      iconName = 'message-square';
      tabLabel = 'Dreamscape';
      break;
    case 'HabitTrackerTab':
      iconName = 'list';
      tabLabel = 'Habits';
      break;
    case 'ProfileTab':
      iconName = 'user';
      tabLabel = 'Profile';
      break;

    default:
      iconName = 'circle';
      tabLabel = 'Tab';
  }

  // Use Reanimated to animate the label appearance
  const labelOpacity = useSharedValue(focused ? 1 : 0);
  const labelScale = useSharedValue(focused ? 1 : 0.8);
  const labelY = useSharedValue(focused ? 0 : 10);
  
  // Icon animations
  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);

  // Update animation values when focused state changes
  useEffect(() => {
    // Label animations
    labelOpacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
    labelScale.value = withSpring(focused ? 1 : 0.8, { damping: 20, stiffness: 150 });
    labelY.value = withSpring(focused ? 0 : 10, { damping: 20, stiffness: 150 });
    
    // Icon animations when tab becomes active
    if (focused) {
      // Play a sequence of animations for the icon
      iconScale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      );
      
      // Add a slight rotation effect
      iconRotate.value = withSequence(
        withTiming(-0.1, { duration: 100 }),
        withTiming(0.1, { duration: 100 }),
        withSpring(0, { damping: 15, stiffness: 200 })
      );
    } else {
      // Reset icon animations when tab becomes inactive
      iconScale.value = withTiming(1, { duration: 150 });
      iconRotate.value = withTiming(0, { duration: 150 });
    }
  }, [focused]);

  // Animated style for the label
  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: labelOpacity.value,
      transform: [
        { translateY: labelY.value },
        { scale: labelScale.value }
      ] as any
    };
  });
  
  // Animated style for the icon
  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: iconScale.value },
        { rotate: `${iconRotate.value}rad` }
      ] as any
    };
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={iconAnimatedStyle}>
        <Icon
          name={iconName as any}
          size={size}
          color={color}
        />
      </Animated.View>
      
      {/* REMOVE Animated Tab Label
      <Animated.View style={labelAnimatedStyle}>
        <Text style={[styles.tabLabel, { color }]}>
          {tabLabel}
        </Text>
      </Animated.View>
      */}
    </View>
  );
};

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBarStyle, 
          { paddingBottom: insets.bottom > 0 ? insets.bottom - 5 : 10 }
        ],
        tabBarActiveTintColor: foundations.colors.primary || '#8B5CF6',
        tabBarInactiveTintColor: foundations.colors.tabInactive,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeTabWrapper}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon routeName="HomeTab" focused={focused} />,
          tabBarButton: NoFeedbackTabBarButton
        }}
      />
      <Tab.Screen 
        name="AffirmationsTab"
        component={AffirmationsTabWrapper}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon routeName="AffirmationsTab" focused={focused} />,
          tabBarButton: NoFeedbackTabBarButton,
        }}
      />
      <Tab.Screen 
        name="AiJournalTab"
        component={AiJournalTabWrapper}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon routeName="AiJournalTab" focused={focused} />,
          tabBarButton: NoFeedbackTabBarButton,
        }}
      />
      <Tab.Screen 
        name="HabitTrackerTab"
        component={HabitTrackerTabWrapper}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon routeName="HabitTrackerTab" focused={focused} />,
          tabBarButton: NoFeedbackTabBarButton,
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileTabWrapper}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon routeName="ProfileTab" focused={focused} />,
          tabBarButton: NoFeedbackTabBarButton,
        }}
      />
      

    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
   tabBarStyle: {
    backgroundColor: '#FFFFFF', // Light grey background changed to white
    borderTopWidth: 1, // Added a subtle top border
    borderTopColor: '#E5E7EB', // Border color
    paddingTop: 12,
    height: 75, // Increased height for the label
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: 60, // Increased width for the icon + label
    height: 56, // Increased height for the icon + label
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Make transparent to show gradient
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    borderBottomWidth: 0,
  },
  placeholderText: {
    color: '#FFFFFF', // White text for contrast on primary color
    fontSize: 18,
    fontWeight: '600',
  },
  affirmationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    maxWidth: '95%',
    minHeight: 120,
  },
  affirmationText: {
    color: '#FFFFFF',
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    textAlign: 'center',
    lineHeight: theme.foundations.fonts.sizes.xl * 1.4,
    letterSpacing: 0.3,
    marginVertical: 20,
    textTransform: 'uppercase',
  },
  affirmationQuote: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '300',
    opacity: 0.7,
    fontFamily: 'Georgia',
  },
  homeScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Ensured white background
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contentArea: {
    flex: 1,
    width: '100%',
  },
  fixedHeader: {
    paddingHorizontal: 15,
    paddingBottom: SPACING / 2,
    // Ensure no absolute positioning conflicts
  },
  appNameTitle: {
    fontSize: 32,
    color: foundations.colors.textPrimary || '#1F2937',
    textAlign: 'center',
    width: '100%',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 15,
    marginBottom: SPACING,
    width: '100%',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 16,
    width: 110,
    height: 110,
  },
  inactiveNavButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeNavButton: {
    backgroundColor: foundations.colors.primary,
    borderWidth: 0,
    elevation: 4,
    shadowColor: foundations.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  navButtonIconContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  inactiveNavButtonIconContainer: {
    backgroundColor: 'transparent',
  },
  activeNavButtonIconContainer: {
    backgroundColor: 'transparent',
  },
  navButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  inactiveNavButtonLabel: {
    color: foundations.colors.textPrimary || '#1F2937',
  },
  activeNavButtonLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  contentScrollView: {
    flex: 1, 
  },
  contentPanel: { // Styles the *content* inside ScrollView
    padding: 15,
    justifyContent: 'flex-start', 
    paddingTop: 20,
    paddingBottom: 40, 
    flexGrow: 1, // Ensure content can grow within scrollview
    alignItems: 'center', // Add this to center the content horizontally
  },
  progressContainer: {
    width: '100%', 
    maxWidth: 340,
    alignItems: 'center',
    alignSelf: 'center', // Add this to center the container itself
  },
  circleContainer: {
    position: 'relative',
    width: svgSize,
    height: svgSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  percentageTextContainer: {
    position: 'absolute',
  },
  percentageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
  },
  viewProgressButton: {
    backgroundColor: foundations.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '90%',
    alignItems: 'center',
    marginTop: 0, // Explicitly remove any potential top margin here 
  },
  viewProgressButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 20,
    minHeight: 300, // Give placeholders some min height for animation visibility
  },

  affirmationCardWrapper: {
    width: '100%',
    marginBottom: 30, // Adjusted space below card
    alignItems: 'center', // Center the card horizontally
    maxWidth: 340, // Limit the maximum width
    alignSelf: 'center', // Center the wrapper itself
  },
  animatedContentWrapper: {
    width: '100%', // Ensure wrapper takes width for layout animation
    alignItems: 'center', // Add this to center children
  },
  verticalTextContainer: {
    position: 'absolute',
    left: -150, 
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalTextWrapper: {
    transform: [{ rotate: '-90deg' }],
  },
  verticalText: {
    color: 'rgba(160, 160, 160, 0.5)', 
    fontSize: 20, 
    fontWeight: '500',
    letterSpacing: 1.5, 
    textTransform: 'uppercase',
  },
  nonScrollingContentWrapper: { // New style for content without ScrollView
    flex: 1, // Take up available space
    width: '100%',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    // marginTop: 4, // Remove margin as label is removed
  },
  affirmationCardStyle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Ensure card is transparent
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  swipeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  paginationContainer: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  paginationDot: {
    width: 2,
    height: 6,
    borderRadius: 1,
    marginVertical: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  paginationDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    width: 3,
    height: 8,
    borderRadius: 1.5,
  },
  paginationDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
}); 