import React, { useState, useRef, useEffect, createRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Pressable, StatusBar, Platform, ScrollView, TextInput, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent, Modal, TouchableOpacity, Easing, Keyboard, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { DailyRitualsService, DailyRitual } from '../services/dailyRitualsService';
const { colors, spacing, radii, fonts } = theme.foundations;

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

interface DayData {
  day: string;
  date: string;
  goals: DailyRitual[];
  isExpanded: boolean;
}

export default function HabitTrackerScreen() {
  const [currentDay, setCurrentDay] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentVisible, setContentVisible] = useState(false);
  const [daysData, setDaysData] = useState<DayData[]>([
    {
      day: 'MONDAY',
      date: 'April 14, 2025',
      isExpanded: false,
      goals: []
    },
    {
      day: 'TUESDAY',
      date: 'April 15, 2025',
      isExpanded: false,
      goals: []
    },
    {
      day: 'WEDNESDAY',
      date: 'April 16, 2025',
      isExpanded: false,
      goals: []
    },
    {
      day: 'THURSDAY',
      date: 'April 17, 2025',
      isExpanded: false,
      goals: []
    },
    {
      day: 'FRIDAY',
      date: 'April 18, 2025',
      isExpanded: false,
      goals: []
    },
    {
      day: 'SATURDAY',
      date: 'April 19, 2025',
      isExpanded: false,
      goals: []
    },
    {
      day: 'SUNDAY',
      date: 'April 20, 2025',
      isExpanded: false,
      goals: []
    }
  ]);

  const [newTaskTexts, setNewTaskTexts] = useState<string[]>(daysData.map(() => ''));
  const [isAddingTask, setIsAddingTask] = useState(true);

  // Animation values
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;
  const dayScales = useRef(daysData.map(() => new Animated.Value(1))).current;
  const dayRotations = useRef(daysData.map(() => new Animated.Value(0))).current;

  // Entry animation values
  const [hasAnimated, setHasAnimated] = useState(false);
  const weekHeaderOpacity = useRef(new Animated.Value(0)).current;
  const weekHeaderTranslateY = useRef(new Animated.Value(-30)).current;
  const weekNavLeftOpacity = useRef(new Animated.Value(0)).current;
  const weekNavLeftScale = useRef(new Animated.Value(0.8)).current;
  const weekNavRightOpacity = useRef(new Animated.Value(0)).current;
  const weekNavRightScale = useRef(new Animated.Value(0.8)).current;
  const dayOpacities = useRef(daysData.map(() => new Animated.Value(0))).current;
  const dayTranslateYs = useRef(daysData.map(() => new Animated.Value(50))).current;
  const dayScalesEntry = useRef(daysData.map(() => new Animated.Value(0.9))).current;

  // Performance optimization: Use simpler animations
  const isAndroid = Platform.OS === 'android';
  const animationDuration = isAndroid ? 300 : 400;
  const dayDelay = isAndroid ? 30 : 50;

  // Custom scroll bar state
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);

  // Calendar visibility state
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  // Keyboard overlay state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [overlayText, setOverlayText] = useState('');

  // Refs for each day's ScrollView
  const scrollRefs = useRef(daysData.map(() => createRef<ScrollView>()));

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setOverlayText('');
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Sync overlay text with input text
  useEffect(() => {
    if (isKeyboardVisible && selectedDay !== null) {
      setOverlayText(newTaskTexts[selectedDay]);
    }
  }, [newTaskTexts, isKeyboardVisible, selectedDay]);

  // Load rituals for the selected week
  const loadRitualsForWeek = async (weekDate: Date) => {
    try {
      const weekStartDate = DailyRitualsService.getWeekStartDate(weekDate);
      const rituals = await DailyRitualsService.getRitualsForWeek(weekStartDate);
      
      // Group rituals by day of week
      const ritualsByDay: DailyRitual[][] = Array.from({ length: 7 }, () => []);
      rituals.forEach(ritual => {
        ritualsByDay[ritual.day_of_week].push(ritual);
      });
      
      // Update daysData with rituals
      setDaysData(prevData => 
        prevData.map((day, index) => ({
        ...day,
          goals: ritualsByDay[index] || []
        }))
      );
    } catch (error) {
      console.error('Error loading rituals:', error);
      Alert.alert('Error', 'Failed to load rituals. Please try again.');
    }
  };

  // Load rituals when week changes
  useEffect(() => {
    loadRitualsForWeek(selectedWeek);
  }, [selectedWeek]);

  // Reset animation values
  const resetAnimationValues = () => {
    weekHeaderOpacity.setValue(0);
    weekHeaderTranslateY.setValue(-30);
    weekNavLeftOpacity.setValue(0);
    weekNavLeftScale.setValue(0.8);
    weekNavRightOpacity.setValue(0);
    weekNavRightScale.setValue(0.8);
    dayOpacities.forEach(opacity => opacity.setValue(0));
    dayTranslateYs.forEach(translateY => translateY.setValue(50));
    dayScalesEntry.forEach(scale => scale.setValue(0.9));
  };

  // Entry animation effect - triggers each time screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Reset animation values
      resetAnimationValues();
      
      // Use requestAnimationFrame to ensure screen is ready
      requestAnimationFrame(() => {
        // Week header and navigation buttons - single parallel animation
        Animated.parallel([
          Animated.timing(weekHeaderOpacity, {
          toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(weekHeaderTranslateY, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(weekNavLeftOpacity, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(weekNavLeftScale, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(weekNavRightOpacity, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          }),
          Animated.timing(weekNavRightScale, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
          })
        ]).start();

        // Days animation - staggered but optimized
        const dayAnimations = daysData.map((_, index) => 
          Animated.sequence([
            Animated.delay(150 + (index * dayDelay)),
            Animated.parallel([
              Animated.timing(dayOpacities[index], {
                toValue: 1,
                duration: animationDuration,
                useNativeDriver: true,
              }),
              Animated.timing(dayTranslateYs[index], {
                toValue: 0,
                duration: animationDuration,
                useNativeDriver: true,
              }),
              Animated.timing(dayScalesEntry[index], {
                toValue: 1,
                duration: animationDuration,
                useNativeDriver: true,
              })
            ])
          ])
        );

        // Start all day animations in parallel for better performance
        Animated.parallel(dayAnimations).start();

        // After all animations complete, automatically open current day
        const totalAnimationTime = 150 + (daysData.length * dayDelay) + animationDuration;
        setTimeout(() => {
          const today = new Date();
          const dayOfWeek = today.getDay();
          const currentDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6
          selectDay(currentDayIndex);
        }, totalAnimationTime + 100);
      });

      return () => {
        // Cleanup function - reset values when screen loses focus
        resetAnimationValues();
      };
    }, [])
  );

  // Memoized day heights for performance
  const dayHeights = useMemo(() => {
    if (!containerHeight) return daysData.map(() => containerHeight / 7 || 100);
    
    const dayHeight = containerHeight / 7;
    
    if (selectedDay === null) {
      return daysData.map(() => dayHeight);
    } else {
      const selectedDayData = daysData[selectedDay];
      const visibleGoals = Math.min(selectedDayData.goals.length, 3);
      const goalContentHeight = visibleGoals === 0 ? 120 : (visibleGoals * 60) + 80 + 32;
      const compressedHeight = (containerHeight - goalContentHeight) / 7;
      
      return daysData.map((_, index) => 
        selectedDay === index ? compressedHeight + goalContentHeight : compressedHeight
      );
    }
  }, [containerHeight, selectedDay, daysData]);

  // Calculate dynamic heights - optimized for performance
  const getDayHeight = (index: number) => {
    return dayHeights[index];
  };

  const getDayPadding = (index: number) => {
    if (selectedDay === null) {
      return spacing.md; // Normal padding when no day is selected
    } else {
      return spacing.xs; // Minimal padding for all days when one is selected
    }
  };

  const selectDay = (index: number) => {
    const newSelectedDay = selectedDay === index ? null : index;
    setSelectedDay(newSelectedDay);

    // Optimized chevron rotation animation for Android
    dayRotations.forEach((rotation, i) => {
      if (isAndroid) {
        // Use timing for Android - more reliable
        Animated.timing(rotation, {
          toValue: (newSelectedDay !== null && i === newSelectedDay) ? 1 : 0,
            duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // Use spring for iOS - smoother
        Animated.spring(rotation, {
          toValue: (newSelectedDay !== null && i === newSelectedDay) ? 1 : 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
          }).start();
        }
      });
      
    if (newSelectedDay !== null) {
      setContentVisible(true);
      
      // Optimized content expansion for Android
      if (isAndroid) {
        // Use timing for Android - more reliable
        Animated.parallel([
          Animated.timing(contentOpacity, {
          toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(contentScale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          })
        ]).start();
      } else {
        // Use spring for iOS - smoother
        Animated.parallel([
          Animated.spring(contentOpacity, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }),
          Animated.spring(contentScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          })
        ]).start();
      }

      // Optimized scale animation for selected day
      if (isAndroid) {
        Animated.timing(dayScales[index], {
          toValue: 1.01, // Smaller scale for Android
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(dayScales[index], {
          toValue: 1.02,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }).start();
      }

      // Restore scroll position and scroll bar state
      if (scrollRefs.current[newSelectedDay]?.current) {
        scrollRefs.current[newSelectedDay].current.scrollTo({ y: 0, animated: false });
      }
      setScrollY(0);
    } else {
      // Optimized content collapse for Android
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: isAndroid ? 150 : 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(contentScale, {
          toValue: 0.95,
          duration: isAndroid ? 150 : 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        })
      ]).start(() => {
        setContentVisible(false);
      });

      // Reset scale for previously selected day
      if (isAndroid) {
        Animated.timing(dayScales[selectedDay!], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(dayScales[selectedDay!], {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }).start();
      }
    }
  };

  const toggleGoal = async (dayIndex: number, goalId: string) => {
    try {
      const updatedRitual = await DailyRitualsService.toggleRitualCompletion(goalId);
      
      // Update local state
    const newDaysData = [...daysData];
      const goalIndex = newDaysData[dayIndex].goals.findIndex(g => g.id === goalId);
      if (goalIndex !== -1) {
        newDaysData[dayIndex].goals[goalIndex] = updatedRitual;
      setDaysData(newDaysData);
      }
    } catch (error) {
      console.error('Error toggling ritual completion:', error);
      Alert.alert('Error', 'Failed to update ritual. Please try again.');
    }
  };

  const addNewGoal = async (dayIndex: number) => {
    if (newTaskTexts[dayIndex].trim()) {
      try {
        const weekStartDate = DailyRitualsService.getWeekStartDate(selectedWeek);
        const dayOfWeek = DailyRitualsService.getDayOfWeek(selectedWeek);
        
        const newRitual = await DailyRitualsService.createRitual({
          name: newTaskTexts[dayIndex].trim(),
          color: colors.primary,
          time: getCurrentTime(),
          duration: '30 min',
          day_of_week: dayOfWeek,
          week_start_date: weekStartDate,
        });

        // Update local state
        const newDaysData = [...daysData];
        newDaysData[dayIndex].goals.push(newRitual);
        setDaysData(newDaysData);
        
        // Clear only the specific day's input
        setNewTaskTexts(prev => {
          const newTexts = [...prev];
          newTexts[dayIndex] = '';
          return newTexts;
        });
      } catch (error) {
        console.error('Error creating ritual:', error);
        Alert.alert('Error', 'Failed to create ritual. Please try again.');
      }
    }
  };

  const startAddingTask = () => {
    setIsAddingTask(true);
  };

  const cancelAddingTask = () => {
    setIsAddingTask(false);
    // Clear all input texts
    setNewTaskTexts(daysData.map(() => ''));
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
  };

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(currentDate);
    }
    return weekDates;
  };

  const formatWeekRange = (date: Date) => {
    const weekDates = getWeekDates(date);
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setSelectedWeek(newDate);
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const weekDates = getWeekDates(selectedWeek);
    const startOfWeek = weekDates[0];
    const endOfWeek = weekDates[6];
    return today >= startOfWeek && today <= endOfWeek;
  };

  const isCurrentDay = (dayIndex: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6
    return dayIndex === currentDayIndex;
  };

  const [selectedMonth, setSelectedMonth] = useState(selectedWeek.getMonth());
  const [selectedYear, setSelectedYear] = useState(selectedWeek.getFullYear());

  // Add month and year arrays
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

  return (
    <View style={styles.container}>
      {/* Main Content Card */}
      <View style={styles.mainCard}>
        <View style={styles.contentContainer}>
          {/* Week Selection Header */}
          <Animated.View
            style={{
              opacity: weekHeaderOpacity,
              transform: [{ translateY: weekHeaderTranslateY }]
            }}
          >
            <Pressable onPress={() => setCalendarVisible(true)}>
          <View style={styles.weekSelectionHeader}>
                <View style={styles.weekNavContainer}>
                  <Animated.View
                    style={{
                      opacity: weekNavLeftOpacity,
                      transform: [{ scale: weekNavLeftScale }]
                    }}
                  >
            <Pressable 
              style={styles.weekNavButton}
              onPress={() => navigateWeek('prev')}
            >
                      <Feather name="chevron-left" size={20} color={colors.textSecondary} />
            </Pressable>
                  </Animated.View>
            <View style={styles.weekInfoContainer}>
              <Text style={styles.weekRangeText}>{formatWeekRange(selectedWeek)}</Text>
                </View>
                  <Animated.View
                    style={{
                      opacity: weekNavRightOpacity,
                      transform: [{ scale: weekNavRightScale }]
                    }}
                  >
              <Pressable 
                style={styles.weekNavButton}
                onPress={() => navigateWeek('next')}
              >
                      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
              </Pressable>
                  </Animated.View>
            </View>
          </View>
            </Pressable>
          </Animated.View>

          {/* Days Container */}
          <View 
            style={styles.daysContainer}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setContainerHeight(height);
            }}
          >
            {daysData.map((dayData, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.daySection,
                  {
                    height: getDayHeight(index),
                    paddingVertical: getDayPadding(index),
                    opacity: dayOpacities[index],
                    transform: [
                      { scale: Animated.multiply(dayScales[index], dayScalesEntry[index]) },
                      { translateY: dayTranslateYs[index] }
                    ]
                  }
                ]}
              >
                {/* Day Header */}
                <Pressable 
                  style={[
                    styles.dayHeader,
                    isCurrentDay(index) && styles.currentDayHeader
                  ]}
                    onPress={() => selectDay(index)}
                >
                  <View style={styles.dayHeaderContent}>
                    <Text style={[
                      styles.dayTitle,
                      selectedDay === index && styles.selectedDayTitle
                    ]}>
                      {dayData.day}
                    </Text>
                  </View>
                  <Animated.View
                    style={{
                      transform: [{
                        rotate: dayRotations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '90deg']
                        })
                      }]
                    }}
                  >
                  <Feather 
                      name="chevron-right" 
                    size={20} 
                      color={selectedDay === index ? colors.primary : colors.textPrimary} 
                  />
                  </Animated.View>
                </Pressable>

                {/* Expanded Content */}
                {selectedDay === index && contentVisible && (
                <Animated.View 
                  style={[
                    styles.expandedContent,
                    {
                        opacity: contentOpacity,
                        transform: [{ scale: contentScale }]
                      }
                    ]}
                  >
                    {/* Scrollable Habits List - Dynamic height based on content */}
                    <View style={{flex: 1, position: 'relative'}}>
                      <ScrollView
                        ref={scrollRefs.current[index]}
                        style={[
                          styles.habitsScrollView,
                          {
                            maxHeight: (() => {
                              const goalItemHeight = 60;
                              const compactGoalItemHeight = 50;
                              const goalSeparatorHeight = 8;
                              const visibleGoals = Math.min(dayData.goals.length, 3);
                              if (visibleGoals === 0) {
                                return 40; // Minimal height when no goals
                              }
                              const useCompactHeight = visibleGoals <= 3;
                              const currentGoalHeight = useCompactHeight ? compactGoalItemHeight : goalItemHeight;
                              return (visibleGoals * currentGoalHeight) + 
                                     (visibleGoals > 1 ? (visibleGoals - 1) * goalSeparatorHeight : 0);
                            })()
                          }
                        ]}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.habitsScrollContent}
                        onScroll={e => setScrollY(e.nativeEvent.contentOffset.y)}
                        onContentSizeChange={(_, h) => setContentHeight(h)}
                        onLayout={e => setVisibleHeight(e.nativeEvent.layout.height)}
                        scrollEventThrottle={16}
                      >
                        {dayData.goals.length === 0 ? (
                          <Animated.View
                            style={{
                              opacity: contentOpacity,
                              transform: [
                                {
                                  translateX: contentOpacity.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0]
                                  })
                                }
                              ]
                            }}
                          >
                            <View style={styles.habitItem}>
                              <View style={styles.habitContent}>
                                <Text style={styles.placeholderHabitText}>
                                  No Goals yet.{'\n'}Create one to begin your mindful journey.
                                </Text>
                              </View>
                            </View>
                          </Animated.View>
                                                ) : (
                          dayData.goals.map((goal, goalIndex) => (
                            <Animated.View
                        key={goal.id}
                              style={{
                                opacity: contentOpacity,
                                transform: [
                                  {
                                    translateX: contentOpacity.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [20, 0]
                                    })
                                  }
                                ]
                              }}
                            >
                      <Pressable
                        style={styles.habitItem}
                                onPress={() => toggleGoal(index, goal.id)}
                      >
                        <View style={[
                          styles.checkbox,
                                  goal.completed && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}>
                                  {goal.completed && (
                            <Feather name="check" size={14} color="#fff" />
                          )}
                        </View>
                                <View style={styles.habitContent}>
                        <Text style={[
                          styles.habitText,
                                    goal.completed && styles.completedHabitText
                        ]}>
                                    {goal.name}
                        </Text>
                                  <View style={styles.habitDetails}>
                                    <View style={styles.habitTimeContainer}>
                                      <Feather name="clock" size={12} color={colors.textSecondary} />
                                      <Text style={styles.habitTimeText}>{goal.time}</Text>
                  </View>
                                    <View style={styles.habitDurationContainer}>
                                      <Feather name="activity" size={12} color={colors.textSecondary} />
                                      <Text style={styles.habitTimeText}>{goal.duration}</Text>
                  </View>
              </View>
            </View>
                              </Pressable>
                              {/* Purple separator between goals */}
                              {goalIndex < dayData.goals.length - 1 && (
                                <View style={styles.habitSeparator} />
                              )}
                            </Animated.View>
                          ))
                        )}
                      </ScrollView>
                      {/* Custom purple scroll bar */}
                      {contentHeight > visibleHeight && dayData.goals.length > 3 && (
                        <View style={styles.customScrollBarTrack} pointerEvents="none">
              <Animated.View 
                style={[
                              styles.customScrollBarThumb,
                              {
                                height: Math.max((visibleHeight / contentHeight) * visibleHeight, 24),
                                transform: [{
                                  translateY: scrollY * (visibleHeight - Math.max((visibleHeight / contentHeight) * visibleHeight, 24)) / (contentHeight - visibleHeight)
                                }]
                              }
                            ]}
                          />
                        </View>
                    )}
                  </View>

                    {/* Add Task Input - Always visible at bottom */}
                  <Animated.View 
                    style={[
                        styles.addTaskContainer,
                        {
                          opacity: contentOpacity,
                          transform: [
                            {
                              translateX: contentOpacity.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                              })
                            }
                          ]
                        }
                      ]}
                    >
                      <View style={styles.addTaskInputContainer}>
                        <TextInput
                          style={styles.addTaskInput}
                          placeholder="Enter goal name..."
                          placeholderTextColor={colors.textSecondary}
                          value={newTaskTexts[index]}
                          onChangeText={(text) => {
                            setNewTaskTexts(prev => {
                              const newTexts = [...prev];
                              newTexts[index] = text;
                              return newTexts;
                            });
                          }}
                          onSubmitEditing={() => addNewGoal(index)}
                          returnKeyType="done"
                          autoFocus={false}
                        />
                        <Pressable
                          style={styles.addTaskButton}
                          onPress={() => addNewGoal(index)}
                        >
                          <Feather name="plus" size={18} color="#fff" />
                        </Pressable>
                      </View>
                    </Animated.View>
                  </Animated.View>
                )}
              </Animated.View>
            ))}
                          </View>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setCalendarVisible(false)}
      >
        <TouchableOpacity
          style={styles.calendarModalBackdrop}
          activeOpacity={1}
          onPress={() => setCalendarVisible(false)}
        >
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Week</Text>
              <View style={styles.calendarIcon}>
                <Feather name="calendar" size={24} color="#fff" />
              </View>
            </View>
            
            <View style={styles.monthYearSelector}>
              <View style={styles.monthYearContainer}>
                <Pressable 
                  style={styles.arrowButton}
                  onPress={() => {
                    const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
                    const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
                    setSelectedMonth(newMonth);
                    setSelectedYear(newYear);
                    const newDate = new Date(selectedWeek);
                    newDate.setMonth(newMonth);
                    newDate.setFullYear(newYear);
                    setSelectedWeek(newDate);
                  }}
                >
                  <Feather name="chevron-left" size={20} color={colors.textSecondary} />
                </Pressable>
                <Text style={styles.monthYearText}>{months[selectedMonth]} {selectedYear}</Text>
                <Pressable 
                  style={styles.arrowButton}
                  onPress={() => {
                    const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
                    const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
                    setSelectedMonth(newMonth);
                    setSelectedYear(newYear);
                    const newDate = new Date(selectedWeek);
                    newDate.setMonth(newMonth);
                    newDate.setFullYear(newYear);
                    setSelectedWeek(newDate);
                  }}
                >
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.weeksContainer}>
              {Array.from({ length: 4 }, (_, index) => {
                // Calculate weeks starting from Monday
                const weekStart = new Date(selectedWeek);
                const dayOfWeek = weekStart.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
                weekStart.setDate(selectedWeek.getDate() + mondayOffset + (index * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                const isSelected = index === selectedWeekIndex;
                
                return (
                  <React.Fragment key={index}>
                    <Pressable
                      style={[
                        styles.weekButton,
                        isSelected && styles.selectedWeekButton
                      ]}
                      onPress={() => {
                        setSelectedWeekIndex(index);
                        // Update selectedWeek to the start of the selected week
                        setSelectedWeek(weekStart);
                      }}
                    >
                          <Text style={[
                        styles.weekNumber,
                        isSelected && styles.selectedWeekNumber
                      ]}>
                        Week {index + 1}
                      </Text>
                      <Text style={[
                        styles.weekDates,
                        isSelected && styles.selectedWeekDates
                      ]}>
                        {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </Pressable>
                    {index < 3 && <View style={styles.weekDivider} />}
                  </React.Fragment>
                );
              })}
                    </View>

            <Pressable 
              style={styles.confirmButton}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </Pressable>
                    </View>
        </TouchableOpacity>
      </Modal>

      {/* Keyboard Overlay */}
      {isKeyboardVisible && overlayText && (
        <TouchableOpacity 
          style={styles.keyboardOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setIsKeyboardVisible(false);
            setOverlayText('');
          }}
        >
          <View style={styles.overlayContainer}>
            <Text style={styles.overlayText}>{overlayText}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: STATUSBAR_HEIGHT,
  },
  mainCard: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  weekSelectionHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weekNavButton: {
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekInfoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  weekRangeText: {
    fontSize: 20,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  currentWeekBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  currentWeekText: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  weekNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  todayButton: {
    backgroundColor: colors.primary + '08',
    borderWidth: 1,
    borderColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
  },
  todayButtonText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  daysContainer: {
    flex: 1,
  },
  daySection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
    minHeight: 40, // Reduced minimum height for better compression
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    minHeight: 60, // Increased to accommodate larger text
    overflow: 'hidden',
  },
  selectedDayHeader: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  currentDayHeader: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  dayHeaderContent: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 18,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  selectedDayTitle: {
    color: colors.primary,
  },
  dayDate: {
    fontSize: 9,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  expandedContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    flex: 1,
  },
  habitsScrollView: {
    flex: 1,
  },
  habitsScrollContent: {
    paddingBottom: spacing.sm,
  },
  habitsList: {
    marginBottom: spacing.lg,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  habitContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  habitDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  habitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  habitTimeText: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  habitDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  habitDurationText: {
    fontSize: 12,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  completedHabitText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  habitSeparator: {
    height: 1,
    backgroundColor: colors.primary + '20',
    marginVertical: spacing.xs,
    marginLeft: 32, // Align with the text (checkbox width + marginRight)
  },
  placeholderCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border + '40',
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  placeholderHabitText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
    fontStyle: 'italic',
  },
  addTaskContainer: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  addTaskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addTaskInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontFamily: fonts.families.medium,
    color: colors.textPrimary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addTaskButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  addTaskButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelTaskButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    minWidth: 40,
    justifyContent: 'center',
  },
  addTaskText: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.primary,
    fontWeight: '500',
  },
  customScrollBarTrack: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  customScrollBarThumb: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  calendarModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 280,
    maxWidth: 320,
    alignSelf: 'center',
  },
  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  calendarTitle: {
    fontSize: 20,
    fontFamily: fonts.families.bold,
    color: '#fff',
    fontWeight: '700',
  },
  calendarIcon: {
    padding: spacing.sm,
    backgroundColor: colors.primary + '20',
    borderRadius: radii.full,
  },
  monthYearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  monthYearText: {
    fontSize: 18,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  arrowButton: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmButtonText: {
    fontSize: 18,
    fontFamily: fonts.families.bold,
    color: '#fff',
    fontWeight: '700',
  },
  weeksContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
    gap: 0,
  },
  weekButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectedWeekButton: {
    backgroundColor: colors.primary + '10',
  },
  weekNumber: {
    fontSize: 18,
    fontFamily: fonts.families.bold,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  selectedWeekNumber: {
    color: colors.primary,
  },
  weekDates: {
    fontSize: 14,
    fontFamily: fonts.families.medium,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedWeekDates: {
    color: colors.primary,
    fontWeight: '600',
  },
  weekDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
  },
  keyboardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SCREEN_WIDTH * 0.9,
  },
  overlayText: {
    fontSize: 32,
    fontFamily: fonts.families.medium,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
}); 