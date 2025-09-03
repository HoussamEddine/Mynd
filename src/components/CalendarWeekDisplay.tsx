import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { format, addDays, startOfWeek, isSameDay, subDays, startOfDay, differenceInCalendarDays, max, differenceInDays } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../constants'
const { colors } = theme.foundations;;

// Define Props
interface CalendarWeekDisplayProps {
  streakDays: number;
  completedDates?: Date[]; // Array of dates when tasks were completed
  startDate?: Date; // Date when user started using the app
  dailyRepetitions?: { date: string; completed: number; total: number }[]; // Prop for daily repetitions
  onMessageGenerated?: (messages: string[]) => void; // Callback for generated messages
}

// Constants for layout calculation
const DAY_CONTAINER_WIDTH = 44 + 6 * 2 + 4 * 2; // minWidth + paddingHorizontal * 2 + marginHorizontal * 2
const CIRCLE_RADIUS = 16; // Radius of the progress circle
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // Circumference of the progress circle
const CIRCLE_STROKE_WIDTH = 2; // Stroke width of the progress circle

// Progress Circle Component - using SVG
const ProgressCircle: React.FC<{ progress: number }> = ({ progress }) => { // SVG component for daily progress
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - clampedProgress);

  // Use a safe background color - primary with opacity or a fallback
  const backgroundStrokeColor = colors.primary ? `${colors.primary}40` : 'rgba(156, 163, 175, 0.3)';

  return (
    <View style={styles.progressCircleContainer}>
      <Svg width={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH} height={CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH} viewBox={`0 0 ${CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH} ${CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH}`}>
       
        {/* Progress arc */}
        <Circle
          cx={(CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH) / 2}
          cy={(CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH) / 2}
          r={CIRCLE_RADIUS}
          stroke={colors.primary || '#6366F1'} // Use primary color or fallback
          strokeWidth={CIRCLE_STROKE_WIDTH}
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" // Make the ends rounded
          fill="transparent"
          transform={`rotate(-90 ${(CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH) / 2} ${(CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH) / 2})`} // Start from the top
        />
      </Svg>
    </View>
  );
};

const CalendarWeekDisplayComponent: React.FC<CalendarWeekDisplayProps> = ({
  streakDays,
  completedDates = [], // Default to empty array if not provided
  startDate,
  dailyRepetitions = [], // Default value for daily repetitions
  onMessageGenerated // Destructure callback
}) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const scrollViewRef = useRef<ScrollView>(null);

  const streakStartDate = useMemo(() => subDays(today, streakDays - 1), [today, streakDays]);
  
  // Convert completed dates to start of day for comparison
  const normalizedCompletedDates = useMemo(() => {
    return completedDates.map(date => startOfDay(date));
  }, [completedDates]);

  // Create a map of date strings to repetition progress for quick lookup
  const repetitionProgressMap = useMemo(() => { // Logic for mapping repetition progress
    const map = new Map<string, number>();

    // If no repetition data provided, add some test values
    if (dailyRepetitions.length === 0) {
      // Add test data for today and yesterday
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

      map.set(todayStr, 0.75); // 75% complete for today
      map.set(yesterdayStr, 0.5); // 50% complete for yesterday

      // Add some data for previous completed dates
      normalizedCompletedDates.forEach((date, index) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Alternate between different progress values
        const progress = [0.25, 0.5, 0.75, 1][index % 4];
        map.set(dateStr, progress);
      });
    } else {
      // Use the provided data
      dailyRepetitions.forEach(day => {
        // Calculate progress as a value between 0 and 1
        const progress = day.total > 0 ? day.completed / day.total : 0;
        map.set(day.date, progress);
      });
    }

    return map;
  }, [dailyRepetitions, today, normalizedCompletedDates]); // Update dependencies

  // Calculate the start date for the range - use either provided startDate or calculate based on today
  const rangeStartDate = useMemo(() => {
    // If startDate is provided, use it, otherwise calculate from today
    if (startDate) {
      const userStartDate = startOfDay(startDate);
      // Ensure we don't go too far back - limit to the user's start date
      return userStartDate;
    } else {
      // Fall back to previous calculation method if no start date
      const startOfTodaysWeek = startOfWeek(today, { weekStartsOn: 1 });
      return subDays(startOfTodaysWeek, 4 * 7); // Show 4 weeks prior by default
    }
  }, [today, startDate]);

  // Calculate all days from rangeStartDate up to today
  const allDaysInRange = useMemo(() => {
    const daysCount = differenceInCalendarDays(today, rangeStartDate) + 1;
    if (daysCount <= 0) return []; // Handle edge case if range start is somehow after today

    return Array.from({ length: daysCount }).map((_, index) => {
      const day = addDays(rangeStartDate, index);
      const isToday = isSameDay(day, today);
      const isFuture = false; // No future days rendered
      const isStreakDay = day >= streakStartDate && day <= today;
      
      // Check if this day has completed tasks
      const isCompleted = normalizedCompletedDates.some(completedDate => 
        isSameDay(completedDate, day)
      );

      // Get repetition progress for this day
      const dateString = format(day, 'yyyy-MM-dd');
      const repetitionProgress = repetitionProgressMap.get(dateString) || 0; // Get repetition progress

      return {
        date: day,
        dayOfMonth: format(day, 'd'),
        dayOfWeek: format(day, 'EEE'),
        isToday,
        isPast: !isToday && !isFuture, // Ensure isPast is accurate
        isFuture,
        isStreakDay,
        isCompleted,
        repetitionProgress, // Repetition progress for the day
        // For rendering the separator - don't show for last two dates (today and yesterday)
        showSeparator: index < daysCount - 2
      };
    });
  }, [rangeStartDate, today, streakStartDate, normalizedCompletedDates, repetitionProgressMap]); // Update dependencies

  // Effect to scroll to the end (today's date) initially
  useEffect(() => {
    if (allDaysInRange.length > 0 && scrollViewRef.current) {
      // Calculate the maximum possible scroll offset
      const contentWidth = allDaysInRange.length * DAY_CONTAINER_WIDTH;
      const screenWidth = Dimensions.get('window').width;
      const maxOffset = Math.max(0, contentWidth - screenWidth + 20); // +20 for padding

      // Use setTimeout to ensure layout is complete
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: maxOffset, animated: false });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [allDaysInRange]); // Re-run when the range changes (should only be on mount)

  // --- Motivational Text Logic --- 
  const motivationalMessages = useMemo(() => { // Renamed for clarity
    const messages: string[] = []; // Initialize empty array

    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    const todayProgress = repetitionProgressMap.get(todayStr) || 0;
    const yesterdayProgress = repetitionProgressMap.get(yesterdayStr) || 0;

    const todayInfo = allDaysInRange.find(d => isSameDay(d.date, today));
    const yesterdayInfo = allDaysInRange.find(d => isSameDay(d.date, subDays(today, 1)));

    const daysSinceStart = startDate ? differenceInDays(today, startOfDay(startDate)) : Infinity;

    // --- Check ALL applicable scenarios and add messages --- 

    // 1. Streak Messages (prioritized slightly)
    if (streakDays > 7) {
      messages.push(`Wow, ${streakDays} days in a row! Your consistency is inspiring!`);
    } else if (streakDays > 1) {
      messages.push(`${streakDays} days and going strong! Keep the momentum.`);
    } else if (streakDays === 1 && (todayInfo?.isCompleted || todayProgress > 0)) {
      // Only add new streak message if other streak messages weren't added
      messages.push("Great start! One day down, keep it rolling.");
    }

    // 2. Today's Progress/Completion
    if (todayInfo?.isCompleted || todayProgress === 1) {
       messages.push("Nailed it today! Keep that energy going.");
    } else if (todayProgress > 0.7) { // Check even if completed wasn't added
      messages.push("Fantastic progress today! Almost there!");
    }

    // 3. Yesterday's Progress/Completion (less priority than today)
    if (messages.length < 2) { // Avoid too many messages if today was also good
      if (yesterdayInfo?.isCompleted || yesterdayProgress === 1) {
        messages.push("Great job finishing yesterday's task!");
      } else if (yesterdayProgress > 0.7) {
        messages.push("Excellent effort yesterday!");
      }
    }

    // 4. Missed Yesterday Recovery
    const dayBeforeYesterdayInfo = allDaysInRange.find(d => isSameDay(d.date, subDays(today, 2)));
    if (streakDays === 0 && !yesterdayInfo?.isCompleted && yesterdayProgress === 0 && dayBeforeYesterdayInfo?.isCompleted) {
      messages.push("Don't worry about missing a day. Get back on track today!");
    }

    // 5. New User Welcome
    if (daysSinceStart <= 3) {
      messages.push("Welcome! Building habits takes time. You got this!");
    }

    // 6. Default encouragement if no other specific messages were added
    if (messages.length === 0) {
      messages.push("Ready for today? Let's make some progress!");
    }

    return messages; // Return the array of messages

  }, [streakDays, allDaysInRange, repetitionProgressMap, today, startDate]);

  // Call the callback when the messages array changes
  useEffect(() => {
    if (onMessageGenerated) {
      onMessageGenerated(motivationalMessages);
    }
    // console.log("Motivational Messages:", motivationalMessages); // REMOVE DEBUG LOG
  }, [motivationalMessages, onMessageGenerated]);

  // --- Rendering Logic ---
  return (
    <View style={styles.container}>
      <View style={styles.outerContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          snapToInterval={DAY_CONTAINER_WIDTH} // Snap to each day item
          decelerationRate="fast" // Make stopping quicker
        >
          {allDaysInRange.map((dayInfo, index) => {
            let textColor = colors.textPrimary;
            let dayOfWeekColor = colors.textSecondary;
            const isDimmed = dayInfo.isPast && !dayInfo.isCompleted;
            const hasProgress = dayInfo.repetitionProgress > 0;

            const dayContent = dayInfo.isToday ? (
              // Today's styling
              <View style={[styles.dayContainer, styles.todayHighlight]}>
                <Text style={[styles.dayOfWeekText, { color: dayOfWeekColor }]}>
                  {dayInfo.dayOfWeek.toUpperCase()}
                </Text>
                <View style={styles.dayNumberWrapper}>
                  {hasProgress && <ProgressCircle progress={dayInfo.repetitionProgress} />}
                  <Text style={[styles.dayOfMonthText, { color: textColor }]}>
                    {dayInfo.dayOfMonth}
                  </Text>
                </View>
              </View>
            ) : (
              // Past or future days
              <View style={[
                styles.dayContainer,
                dayInfo.isStreakDay ? styles.streakHighlight : null,
                isDimmed ? styles.dimmedDay : null,
              ]}>
                <Text style={[styles.dayOfWeekText, { color: dayOfWeekColor }]}>
                  {dayInfo.dayOfWeek.toUpperCase()}
                </Text>
                <View style={styles.dayNumberWrapper}>
                  {(hasProgress && !isDimmed) && <ProgressCircle progress={dayInfo.repetitionProgress} />}
                  <Text style={[styles.dayOfMonthText, { color: textColor }]}>
                    {dayInfo.dayOfMonth}
                  </Text>
                </View>
              </View>
            );

            return (
              <React.Fragment key={dayInfo.date.toISOString()}>
                <View style={styles.dateItemContainer}>
                  {dayContent}
                </View>
                {dayInfo.showSeparator && <View style={styles.separator} />}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: 0,
  },
  outerContainer: {
    height: 80,
    width: '100%',
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  dateItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginHorizontal: 4,
    borderRadius: 12,
    minWidth: 44,
    minHeight: 65,
    position: 'relative',
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  dayNumberWrapper: {
    position: 'relative',
    width: CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH,
    height: CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOfMonthText: {
    fontSize: 14,
    fontWeight: '600',
    zIndex: 1,
  },
  streakHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  todayHighlight: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    minWidth: 50,
    minHeight: 75,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  separator: {
    height: 26,
    width: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    marginHorizontal: 0,
  },
  dimmedDay: {
    opacity: 0.4,
  },
  progressCircleContainer: {
    position: 'absolute',
    width: CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH,
    height: CIRCLE_RADIUS * 2 + CIRCLE_STROKE_WIDTH,
    zIndex: 0,
  },
});

// Export the memoized component directly
export default React.memo(CalendarWeekDisplayComponent); 