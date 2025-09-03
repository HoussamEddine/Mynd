import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { CircularProgress } from 'react-native-circular-progress';
import { theme } from '../constants';
import { statsService, StatsData, Achievement } from '../services/statsService';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import InfoCard from '../components/InfoCard';



const { colors, spacing, radii } = theme.foundations;



const StatsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<StatsData>({
    currentStreak: 0,
    longestStreak: 0,
    perfectDays: 0,
    weeklyCompletionRate: 0,
    totalSessions: 0,
    averageSessionDuration: 0,
    sessionsThisWeek: 0,
    sessionsLastWeek: 0,
    beliefStrength: 0,
    beliefTransformationProgress: 0,
    daysSinceStarted: 0,
    beliefAge: 0,
    affirmationsUsed: 0,
    boostsUsed: 0,
    daydreamsLogged: 0,
    daydreamsThisWeek: 0,
    daydreamsLastWeek: 0,
    mostUsedFeature: 'Daydreams',
    weeklyProgressRate: 0,
    breakthroughMoments: 0,
    accelerationScore: 0,
    moodImprovement: 0,
    stressReduction: 0,
    sleepQuality: 0,
    achievements: [],
    userRank: 0,
    topPercentage: 0,
    communityAverage: 0,
    beliefGrowth: 0,
    transformationSpeed: 0,
    hiddenBeliefsDetected: 0,
  });

  const [growthData, setGrowthData] = useState<number[]>(new Array(7).fill(0));
  const [speedData, setSpeedData] = useState<number[]>(new Array(7).fill(1));
  const [sessionData, setSessionData] = useState<number[]>(new Array(7).fill(0));
  const [daydreamData, setDaydreamData] = useState<number[]>(new Array(7).fill(0));
  const [lastWeekSessionData, setLastWeekSessionData] = useState<number[]>(new Array(7).fill(0));
  const [lastWeekDaydreamData, setLastWeekDaydreamData] = useState<number[]>(new Array(7).fill(0));
  const [sessionDurationData, setSessionDurationData] = useState<number[]>(new Array(7).fill(0));

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const stats = await statsService.getUserStats(currentUser.id);
        setStatsData(stats);
        
        // Load real chart data
        const growthChartData = await generateGrowthData(currentUser.id);
        const speedChartData = await generateSpeedData(currentUser.id);
        const sessionChartData = await generateSessionData(currentUser.id);
        const daydreamChartData = await generateDaydreamData(currentUser.id);
        const lastWeekSessionData = await generateLastWeekSessionData(currentUser.id);
        const lastWeekDaydreamData = await generateLastWeekDaydreamData(currentUser.id);
        const sessionDurationChartData = await generateSessionDurationData(currentUser.id);
        setGrowthData(growthChartData);
        setSpeedData(speedChartData);
        setSessionData(sessionChartData);
        setDaydreamData(daydreamChartData);
        setLastWeekSessionData(lastWeekSessionData);
        setLastWeekDaydreamData(lastWeekDaydreamData);
        setSessionDurationData(sessionDurationChartData);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const generateWeeklyData = (totalValue: number): number[] => {
    // Generate 7 days of data that sums to the total value
    const days = 7;
    const safeTotalValue = totalValue || 0;
    
    if (safeTotalValue === 0) return new Array(days).fill(0);
    
    // Distribute the total value across 7 days with some variation
    const baseValue = Math.floor(safeTotalValue / days);
    const remainder = safeTotalValue % days;
    
    const data = new Array(days).fill(baseValue);
    
    // Distribute remainder randomly
    for (let i = 0; i < remainder; i++) {
      const randomIndex = Math.floor(Math.random() * days);
      data[randomIndex]++;
    }
    
    // Add some realistic variation (0-2 extra per day)
    return data.map(value => {
      const variation = Math.floor(Math.random() * 3);
      return Math.max(0, value + variation - 1); // -1 to keep it balanced
    });
  };

  const generateGrowthData = async (userId: string): Promise<number[]> => {
    try {
      // Get real rating history from the last 7 days
      const { data: ratings, error } = await supabase
        .from('practice_sessions')
        .select('session_date, repetitions_completed')
        .eq('user_id', userId)
        .eq('session_type', 'rating')
        .not('repetitions_completed', 'is', null)
        .gte('session_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error || !ratings || ratings.length === 0) {
        return new Array(7).fill(0);
      }

      // Create a map of date to rating
      const ratingMap = new Map();
      ratings.forEach((rating: any) => {
        ratingMap.set(rating.session_date, rating.repetitions_completed);
      });

      // Generate 7 days of data
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        data.push(ratingMap.get(date) || 0);
      }

      return data;
    } catch (error) {
      console.error('Error generating growth data:', error);
      return new Array(7).fill(0);
    }
  };

  const generateSpeedData = async (userId: string): Promise<number[]> => {
    try {
      // Get real rating data from the last 7 days
      const { data: ratings, error } = await supabase
        .from('practice_sessions')
        .select('session_date, repetitions_completed')
        .eq('user_id', userId)
        .eq('session_type', 'rating')
        .not('repetitions_completed', 'is', null)
        .gte('session_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error || !ratings || ratings.length === 0) {
        return new Array(7).fill(0);
      }

      // Create a map of date to rating
      const ratingMap = new Map();
      ratings.forEach((rating: any) => {
        ratingMap.set(rating.session_date, rating.repetitions_completed);
      });

      // Generate 7 days of data - show actual rating values, 0 if no rating
      // Start from 7 days ago (oldest) to yesterday (newest)
      const data = [];
      for (let i = 0; i <= 6; i++) {
        const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const rating = ratingMap.get(date);
        // If no rating for this day, show 0 (no bar will be displayed)
        data.push(rating || 0);
      }

      return data;
    } catch (error) {
      console.error('Error generating speed data:', error);
      return new Array(7).fill(0);
    }
  };

  const generateSessionData = async (userId: string): Promise<number[]> => {
    try {
      // Get the same data that statsService uses
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('session_date, session_type')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('session_date', { ascending: true });

      if (error || !sessions || sessions.length === 0) {
        return new Array(7).fill(0);
      }

      // Filter to last 7 days like statsService does
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const last7DaysSessions = sessions.filter((session: any) => {
        const sessionDate = new Date(session.session_date);
        return sessionDate >= sevenDaysAgo && sessionDate <= today;
      });

      // Count sessions per day
      const sessionCounts = new Map();
      last7DaysSessions.forEach((session: any) => {
        const count = sessionCounts.get(session.session_date) || 0;
        sessionCounts.set(session.session_date, count + 1);
      });

      // Generate 7 days of data for the last 7 days (oldest to newest)
      const data = [];
      for (let i = 0; i <= 6; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const count = sessionCounts.get(dateString) || 0;
        data.push(count);
      }

      return data;
    } catch (error) {
      console.error('Error generating session data:', error);
      return new Array(7).fill(0);
    }
  };

  const generateDaydreamData = async (userId: string): Promise<number[]> => {
    try {
      // Get the same data that statsService uses
      const { data: daydreams, error } = await supabase
        .from('stories')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error || !daydreams || daydreams.length === 0) {
        return new Array(7).fill(0);
      }

      // Filter to last 7 days like statsService does
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const last7DaysDaydreams = daydreams.filter((daydream: any) => {
        const storyDate = new Date(daydream.created_at);
        return storyDate >= sevenDaysAgo && storyDate <= today;
      });

      // Count daydreams per day
      const daydreamCounts = new Map();
      last7DaysDaydreams.forEach((daydream: any) => {
        const date = new Date(daydream.created_at).toISOString().split('T')[0];
        const count = daydreamCounts.get(date) || 0;
        daydreamCounts.set(date, count + 1);
      });

      // Generate 7 days of data for the last 7 days (oldest to newest)
      const data = [];
      for (let i = 0; i <= 6; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const count = daydreamCounts.get(dateString) || 0;
        data.push(count);
      }

      return data;
    } catch (error) {
      console.error('Error generating daydream data:', error);
      return new Array(7).fill(0);
    }
  };

  const generateLastWeekSessionData = async (userId: string): Promise<number[]> => {
    try {
      // Get the same data that statsService uses
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('session_date, session_type')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('session_date', { ascending: true });

      if (error || !sessions || sessions.length === 0) {
        return new Array(7).fill(0);
      }

      // Filter to last week (days 8-14 ago) like statsService does
      const fourteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const lastWeekSessions = sessions.filter((session: any) => {
        const sessionDate = new Date(session.session_date);
        return sessionDate >= fourteenDaysAgo && sessionDate <= sevenDaysAgo;
      });

      // Count sessions per day
      const sessionCounts = new Map();
      lastWeekSessions.forEach((session: any) => {
        const count = sessionCounts.get(session.session_date) || 0;
        sessionCounts.set(session.session_date, count + 1);
      });

      // Generate 7 days of data for last week (oldest to newest)
      const data = [];
      for (let i = 0; i <= 6; i++) {
        const date = new Date(fourteenDaysAgo);
        date.setDate(fourteenDaysAgo.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const count = sessionCounts.get(dateString) || 0;
        data.push(count);
      }

      return data;
    } catch (error) {
      console.error('Error generating last week session data:', error);
      return new Array(7).fill(0);
    }
  };

  const generateLastWeekDaydreamData = async (userId: string): Promise<number[]> => {
    try {
      // Get the same data that statsService uses
      const { data: daydreams, error } = await supabase
        .from('stories')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error || !daydreams || daydreams.length === 0) {
        return new Array(7).fill(0);
      }

      // Filter to last week (days 8-14 ago) like statsService does
      const fourteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const lastWeekDaydreams = daydreams.filter((daydream: any) => {
        const storyDate = new Date(daydream.created_at);
        return storyDate >= fourteenDaysAgo && storyDate <= sevenDaysAgo;
      });

      // Count daydreams per day
      const daydreamCounts = new Map();
      lastWeekDaydreams.forEach((daydream: any) => {
        const date = new Date(daydream.created_at).toISOString().split('T')[0];
        const count = daydreamCounts.get(date) || 0;
        daydreamCounts.set(date, count + 1);
      });

      // Generate 7 days of data for last week (oldest to newest)
      const data = [];
      for (let i = 0; i <= 6; i++) {
        const date = new Date(fourteenDaysAgo);
        date.setDate(fourteenDaysAgo.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        const count = daydreamCounts.get(dateString) || 0;
        data.push(count);
      }

      return data;
    } catch (error) {
      console.error('Error generating last week daydream data:', error);
      return new Array(7).fill(0);
    }
  };

  const generateSessionDurationData = async (userId: string): Promise<number[]> => {
    try {
      // Get session duration data from the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const today = new Date();
      
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('session_date, duration_minutes')
        .eq('user_id', userId)
        .eq('completed', true)
        .not('duration_minutes', 'is', null)
        .gte('session_date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('session_date', today.toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error || !sessions || sessions.length === 0) {
        return new Array(7).fill(0);
      }

      // Calculate average duration per day
      const durationByDay = new Map();
      const countByDay = new Map();
      
      sessions.forEach((session: any) => {
        const date = session.session_date;
        const duration = session.duration_minutes || 0;
        
        const currentTotal = durationByDay.get(date) || 0;
        const currentCount = countByDay.get(date) || 0;
        
        durationByDay.set(date, currentTotal + duration);
        countByDay.set(date, currentCount + 1);
      });

      // Generate 7 days of data for the last 7 days (oldest to newest)
      const data = [];
      for (let i = 0; i <= 6; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const totalDuration = durationByDay.get(dateString) || 0;
        const count = countByDay.get(dateString) || 0;
        const averageDuration = count > 0 ? totalDuration / count : 0;
        
        data.push(Math.round(averageDuration));
      }

      return data;
    } catch (error) {
      console.error('Error generating session duration data:', error);
      return new Array(7).fill(0);
    }
  };

  useEffect(() => {
    if (activeTooltip) {
      const timer = setTimeout(() => setActiveTooltip(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeTooltip]);

  const getLatestAchievement = () => {
    if (!statsData) return null;
    return statsData.achievements
      .filter(a => a.isUnlocked)
      .sort((a, b) => new Date(b.unlockDate || '').getTime() - new Date(a.unlockDate || '').getTime())[0];
  };

  const getNextAchievement = () => {
    if (!statsData) return null;
    return statsData.achievements
      .filter(a => !a.isUnlocked)
      .sort((a, b) => (a.progress || 0) / (a.maxProgress || 1) - (b.progress || 0) / (b.maxProgress || 1))[0];
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  // Chart components for different stat types
  const renderStreakCalendar = (currentStreak: number) => (
    <View style={styles.streakCalendar}>
      {Array.from({ length: 7 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.calendarDay,
            { backgroundColor: index < (currentStreak || 0) ? colors.primary : colors.border }
          ]}
        />
      ))}
    </View>
  );

  const renderHighlightedTimeline = (days: number) => (
    <View style={styles.highlightedTimeline}>
      <View style={styles.timelineBackground}>
        <View 
          style={[
            styles.timelineHighlight, 
            { width: `${Math.min(((days || 0) / 30) * 100, 100)}%` }
          ]} 
        />
      </View>
    </View>
  );

  const renderSegmentedProgress = (completed: number, total: number) => (
    <View style={styles.segmentedProgress}>
      {Array.from({ length: total || 0 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            { backgroundColor: index < (completed || 0) ? colors.primary : colors.border }
          ]}
        />
      ))}
    </View>
  );

  const renderProgressRing = (percentage: number, color: string) => (
    <View style={styles.progressRingContainer}>
      <View style={[styles.progressRing, { borderColor: color }]}>
        <View 
          style={[
            styles.progressRingFill, 
            { 
              borderColor: color,
              transform: [{ rotate: `${((percentage || 0) / 100) * 360}deg` }]
            }
          ]} 
        />
        <Text style={[styles.ringText, { color }]}>{percentage || 0}%</Text>
      </View>
    </View>
  );

  const renderSparkline = (data: number[]) => {
    if (!data || data.length === 0) return <View style={styles.sparkline} />;
    
    return (
      <View style={styles.sparkline}>
        {data.map((value, index) => {
          const maxValue = Math.max(...data);
          const height = maxValue > 0 ? (value / maxValue) * 16 : 2;
          return (
            <View
              key={index}
              style={[
                styles.sparklinePoint,
                { height: Math.max(2, height) }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderMicroBars = (data: number[]) => {
    if (!data || data.length === 0) return <View style={styles.microBars} />;
    
    return (
      <View style={styles.microBars}>
        {data.map((value, index) => (
          <View
            key={index}
            style={[
              styles.microBar,
              { 
                height: Math.max(2, (value / Math.max(...data)) * 12),
                backgroundColor: colors.primary
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const renderWeeklyBars = (data: number[]) => {
    if (!data || data.length === 0) return <View style={styles.weeklyBars} />;
    
    // Find the maximum value for scaling
    const maxValue = Math.max(...data);
    const minBarHeight = 12; // Minimum visible bar height
    
    return (
      <View style={styles.weeklyBars}>
        {data.map((value, index) => {
          // Don't show bar if value is 0 (no activity for that day)
          if (value === 0) {
            return <View key={index} style={[styles.weeklyBar, { height: 0, backgroundColor: 'transparent' }]} />;
          }
          
          // Calculate bar height with minimum visibility
          const barHeight = maxValue > 0 ? Math.max(minBarHeight, (value / maxValue) * 32) : minBarHeight;
          
          return (
            <View
              key={index}
              style={[
                styles.weeklyBar,
                { 
                  height: barHeight,
                  backgroundColor: colors.primary
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderComparisonBars = (current: number, previous: number) => (
    <View style={styles.comparisonBars}>
      <View style={styles.comparisonBar}>
        <Text style={styles.comparisonLabel}>Last</Text>
        <View 
          style={[
            styles.comparisonFill, 
            { 
              height: Math.max(2, ((previous || 0) / Math.max(current || 0, previous || 0)) * 16),
              backgroundColor: colors.textSecondary
            }
          ]} 
        />
      </View>
      <View style={styles.comparisonBar}>
        <Text style={styles.comparisonLabel}>This</Text>
        <View 
          style={[
            styles.comparisonFill, 
            { 
              height: Math.max(2, ((current || 0) / Math.max(current || 0, previous || 0)) * 16),
              backgroundColor: colors.primary
            }
          ]} 
        />
      </View>
    </View>
  );

  const renderProgressBar = (percentage: number) => (
    <View style={styles.progressBar}>
      <View 
        style={[
          styles.progressFill, 
          { width: `${percentage || 0}%` }
        ]} 
      />
    </View>
  );

  const renderComparisonChart = (currentWeek: number[], lastWeek: number[]) => {
    if (!currentWeek || !lastWeek || currentWeek.length === 0 || lastWeek.length === 0) {
      return <View style={styles.comparisonChart} />;
    }
    
    const maxValue = Math.max(...lastWeek, ...currentWeek);
    
    return (
      <View style={styles.comparisonChart}>
        {currentWeek.map((currentValue, index) => {
          const lastValue = lastWeek[index] || 0;
          const currentHeight = Math.max(2, ((currentValue || 0) / maxValue) * 16);
          const lastHeight = Math.max(2, (lastValue / maxValue) * 16);
          
          return (
            <View key={index} style={styles.comparisonChartDay}>
              <View style={styles.comparisonChartBars}>
                <View 
                  style={[
                    styles.comparisonChartBar, 
                    { 
                      height: currentHeight,
                      backgroundColor: colors.primary
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.comparisonChartBar, 
                    { 
                      height: lastHeight,
                      backgroundColor: colors.textSecondary
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderStatCard = (value: string | number, label: string, subtitle?: string, chartType?: string, chartData?: any, tooltip?: string, tooltipId?: string) => {
    const isTooltipActive = activeTooltip === tooltipId;

    return (
      <Pressable 
        style={styles.statCard}
        onPress={() => {
          if (activeTooltip && activeTooltip !== tooltipId) {
            setActiveTooltip(null);
          }
        }}
      >
        <View style={styles.statHeader}>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{value || 0}</Text>
      <Text style={styles.statLabel}>{label || ''}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
          {tooltip && (
            <Pressable 
              style={styles.infoButton}
              onPress={(e) => {
                e.stopPropagation();
                setActiveTooltip(isTooltipActive ? null : tooltipId || '');
              }}
            >
              <Feather name="info" size={14} color={colors.textSecondary} />
              {isTooltipActive && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{tooltip}</Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
        
        {chartType === 'streakCalendar' && chartData !== undefined && renderStreakCalendar(chartData)}
        {chartType === 'segmentedProgress' && chartData && renderSegmentedProgress(chartData.completed, chartData.total)}
        {chartType === 'progressBar' && chartData && renderProgressBar(chartData.percentage)}
        {chartType === 'sparkline' && chartData && renderSparkline(chartData)}
        {chartType === 'microBars' && chartData && renderMicroBars(chartData)}
        {chartType === 'weeklyBars' && chartData && renderWeeklyBars(chartData)}
        {chartType === 'comparisonBars' && chartData && renderComparisonBars(chartData.current, chartData.previous)}
        {chartType === 'comparisonChart' && chartData && renderComparisonChart(chartData.currentWeek, chartData.lastWeek)}
      </Pressable>
    );
  };

  const renderAchievement = (achievement: Achievement) => (
    <View key={achievement.id || `achievement-${Math.random()}`} style={[
      styles.achievementCard,
      achievement.isUnlocked ? styles.achievementUnlocked : styles.achievementLocked
    ]}>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{achievement.title || 'Achievement'}</Text>
        <Text style={styles.achievementDescription}>{achievement.description || 'No description available'}</Text>
        {achievement.isUnlocked && achievement.unlockDate && (
          <Text style={styles.achievementDate}>Unlocked {achievement.unlockDate}</Text>
        )}
        {!achievement.isUnlocked && achievement.progress !== undefined && achievement.maxProgress !== undefined && (
          <View style={styles.achievementProgressContainer}>
            <View style={styles.achievementProgressBar}>
              <View 
                style={[
                  styles.achievementProgressFill, 
                  { width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.achievementProgressText}>
              {achievement.progress || 0}/{achievement.maxProgress || 1}
            </Text>
          </View>
        )}
      </View>
    </View>
  );



  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" style="dark" />
      
      {/* Status bar blur overlay */}
      <BlurView intensity={20} style={[styles.statusBarBlur, { height: insets.top * 0.6 }]} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setActiveTooltip(null)}
        style={{ backgroundColor: '#000000' }}
        bounces={false}
      >
        {/* Community Ranking with Header */}
        <View style={styles.communityCardWrapper} >
          <InfoCard
            title=""
            gradientColors={[colors.background, colors.background]}
            noPadding={true}
            noMargin={true}
          >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
              <View style={styles.headerTopRow}>
                <Pressable 
                  style={styles.backButton} 
                  onPress={() => navigation.goBack()}
                >
                  <Feather name="arrow-left" size={24} color={colors.textPrimary} />
                </Pressable>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Your Journey Stats</Text>
                  <Text style={styles.headerSubtitle}>A look at your transformation</Text>
                </View>
              </View>
            </View>

            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.communityContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.communityTitle}>Community Leader</Text>
              <Text style={styles.communityRank}>#{statsData.userRank || 0}</Text>
              <Text style={styles.communityPercentage}>Top {statsData.topPercentage || 0}%</Text>
              <Text style={styles.communityAverage}>
                You're inspiring others! Your dedication places you among the top {statsData.topPercentage || 0}% of users.
              </Text>
            </LinearGradient>
          </InfoCard>
        </View>

        {/* Belief Transformation Journey */}
        <View style={styles.beliefCardWrapper}>
          <InfoCard
            title=""
            gradientColors={[colors.background, colors.background]}
            noMargin={true}
          >
            {renderSection('Your Belief Transformation Journey', (
              <View style={styles.beliefEvolutionContainer}>
                <View style={styles.circularProgressContainer}>
                  <View style={styles.circularProgressWrapper}>
                    <CircularProgress
                      size={120}
                      width={8}
                      fill={statsData.beliefTransformationProgress || 0}
                      tintColor={colors.primary}
                      backgroundColor="rgba(229, 231, 235, 0.2)"
                      rotation={0}
                      lineCap="round"
                      arcSweepAngle={360}
                    />
                    <View style={styles.circularProgressTextContainer}>
                      <Text style={styles.circularProgressText}>
                        {statsData.beliefTransformationProgress || 0}%
                      </Text>
                      <Text style={styles.circularProgressLabel}>
                        Transformed
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Progress Explanation Text */}
                <View style={styles.progressExplanationContainer}>
                  <Text style={styles.helpText}>
                    Your journey from your first rating to your highest achievement
                  </Text>
                </View>
                
                <View style={styles.statsGrid}>
                  {renderStatCard(`${statsData.beliefStrength || 0}/10`, 'Current Rating', 'belief strength', undefined, undefined, 'Your most recent belief strength rating (1-10 scale).', 'beliefStrengthTooltip')}
                  {renderStatCard(`${statsData.beliefGrowth >= 0 ? '+' : ''}${statsData.beliefGrowth || 0}`, 'Belief Growth', 'from start', undefined, undefined, 'Your belief strength improvement over time.', 'beliefGrowthTooltip')}
                  {renderStatCard(`${statsData.transformationSpeed || 1}x`, 'Transformation Speed', 'vs average', 'weeklyBars', speedData, 'How quickly you\'re progressing compared to average users.', 'transformationSpeedTooltip')}
                </View>
              </View>
            ))}
          </InfoCard>
        </View>

            {/* Daily Streak & Consistency */}
            <View style={styles.sectionCardWrapper}>
              <InfoCard
                title=""
                gradientColors={[colors.background, colors.background]}
                noMargin={true}
              >
                {renderSection('Your Daily Streak', (
                  <View style={styles.statsGrid}>
                    {renderStatCard(statsData.currentStreak || 0, 'Current Streak', 'days', 'streakCalendar', statsData.currentStreak || 0, 'Your current streak of daily practice.', 'currentStreakTooltip')}
                    {renderStatCard(statsData.longestStreak || 0, 'Longest Streak', 'days', undefined, undefined, 'Your longest streak of consecutive days.', 'longestStreakTooltip')}
                    {renderStatCard(statsData.perfectDays || 0, 'Perfect Days', 'this week', 'segmentedProgress', { completed: statsData.perfectDays || 0, total: 7 }, 'Days where you completed all scheduled sessions.', 'perfectDaysTooltip')}
                    {renderStatCard(`${statsData.weeklyCompletionRate || 0}%`, 'Completion Rate', 'this week', 'progressBar', { percentage: statsData.weeklyCompletionRate || 0 }, 'Percentage of scheduled sessions completed this week.', 'weeklyCompletionRateTooltip')}
                  </View>
                ))}
              </InfoCard>
            </View>

            {/* Session Performance */}
            <View style={styles.sectionCardWrapper}>
              <InfoCard
                title=""
                gradientColors={[colors.background, colors.background]}
                noMargin={true}
              >
                {renderSection('Session Milestones', (
                  <View style={styles.statsGrid}>
                    {renderStatCard(statsData.totalSessions || 0, 'Total Sessions', 'completed', undefined, undefined, 'Your total number of sessions completed.', 'totalSessionsTooltip')}
                    {renderStatCard(`${statsData.averageSessionDuration || 0}m`, 'Avg Duration', 'per session', 'weeklyBars', sessionDurationData, 'Your session duration over the last 7 days.', 'averageSessionDurationTooltip')}
                    {renderStatCard(statsData.sessionsThisWeek || 0, 'Sessions This Week', 'sessions', undefined, undefined, 'Sessions completed this week.', 'sessionsThisWeekTooltip')}
                    {renderStatCard(statsData.sessionsLastWeek || 0, 'This Week vs Last Week', 'sessions', 'comparisonChart', { currentWeek: sessionData, lastWeek: lastWeekSessionData }, 'Comparison of sessions this week vs last week.', 'sessionsLastWeekTooltip')}
                  </View>
                ))}
              </InfoCard>
            </View>

            {/* Daydream Journey */}
            <View style={[styles.sectionCardWrapper, styles.lastCardWrapper]}>
              <InfoCard
                title=""
                gradientColors={[colors.background, colors.background]}
                noMargin={true}
              >
                {renderSection('Your Daydream Journey', (
                  <View style={styles.daydreamStatsContainer}>
                    <View style={styles.statsGrid}>
                      {renderStatCard(statsData.daydreamsLogged || 0, 'Daydreams', 'explored', undefined, undefined, 'Your daydream activity over the past week.', 'daydreamsLoggedTooltip')}
                      {renderStatCard(statsData.daydreamsThisWeek || 0, 'This Week', 'daydreams', undefined, undefined, 'Daydreams logged this week.', 'daydreamsThisWeekTooltip')}
                      {renderStatCard(statsData.daydreamsLastWeek || 0, 'Last Week', 'daydreams', undefined, undefined, 'Daydreams logged last week.', 'daydreamsLastWeekTooltip')}
                      {renderStatCard(statsData.hiddenBeliefsDetected || 0, 'Hidden Beliefs', 'detected', undefined, undefined, 'Number of hidden beliefs discovered through daydreaming.', 'hiddenBeliefsDetectedTooltip')}
                    </View>
                  </View>
                ))}
              </InfoCard>
            </View>




      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    position: 'relative',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: spacing.sm,
    top: -spacing.sm,
    padding: spacing.sm,
    zIndex: 1,
  },
  headerTextContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: theme.foundations.fonts.sizes.xxl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  communityCardWrapper: {
    marginBottom: spacing.xs,
    
   
  },
  sectionCardWrapper: {
    marginBottom: spacing.xs,
  },
  lastCardWrapper: {
    marginBottom: spacing.md,
  },

  beliefCardWrapper: {
    marginBottom: spacing.xs,
  },
  communityContent: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.lg,
    margin: spacing.lg,
  },
  communityTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  communityRank: {
    fontSize: theme.foundations.fonts.sizes['3xl'],
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textLight,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  communityPercentage: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  communityAverage: {
    fontSize: theme.foundations.fonts.sizes.base,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
    opacity: 0.95,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'flex-start',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xs,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.foundations.fonts.sizes.xxl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.regular,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  infoButton: {
    position: 'relative',
    padding: spacing.xs,
    borderRadius: radii.sm,
  },
  tooltip: {
    position: 'absolute',
    bottom: 25,
    right: -5,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 180,
    minWidth: 120,
    zIndex: 1000,
  },
  tooltipText: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textLight,
    lineHeight: theme.foundations.fonts.sizes.xs * 1.3,
  },
  beliefStatCard: {
    width: '32%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  beliefEvolutionContainer: {
    alignItems: 'center',
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  circularProgressWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  circularProgressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressText: {
    fontSize: theme.foundations.fonts.sizes.xl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  circularProgressLabel: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  beliefStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.sm,
  },
  featureEngagementContainer: {
    alignItems: 'center',
  },
  mostUsedFeature: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  mostUsedTitle: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  mostUsedFeatureName: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.primary,
  },
  achievementsContainer: {
    gap: spacing.sm,
  },
  achievementCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementUnlocked: {
    opacity: 1,
    borderColor: colors.primary,
  },
  achievementLocked: {
    opacity: 0.7,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  achievementDate: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  achievementProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  achievementProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  velocityContainer: {
    alignItems: 'center',
  },
  velocityCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  velocityTitle: {
    fontSize: theme.foundations.fonts.sizes.lg,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  velocityValue: {
    fontSize: theme.foundations.fonts.sizes.xxl,
    fontFamily: theme.foundations.fonts.families.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  velocityDescription: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  daydreamStatsContainer: {
    marginTop: spacing.lg,
  },
  statusBarBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  streakCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.sm,
    height: 20,
  },
  calendarDay: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highlightedTimeline: {
    width: '100%',
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  timelineBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  timelineHighlight: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  segmentedProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.sm,
    height: 12,
    gap: 1,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  progressRingContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  progressRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRingFill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: colors.primary,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ringText: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.bold,
  },
  sparkline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: spacing.sm,
    height: 16,
    gap: 1,
  },
  sparklinePoint: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 1,
    minHeight: 2,
  },
  microBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: spacing.sm,
    height: 12,
    gap: 2,
  },
  microBar: {
    flex: 1,
    borderRadius: 1,
    minHeight: 2,
  },
  weeklyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: spacing.sm,
    height: 32,
    gap: 2,
  },
  weeklyBar: {
    flex: 1,
    borderRadius: 1,
    minHeight: 2,
  },
  comparisonBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.sm,
    height: 20,
    gap: spacing.sm,
  },
  comparisonBar: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  comparisonLabel: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  comparisonChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
    height: 20,
    alignItems: 'flex-end',
  },
  comparisonChartDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 20,
  },
  comparisonChartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    height: 16,
    gap: 1,
    transform: [{ scaleY: -1 }],
  },
  comparisonChartBar: {
    flex: 1,
    borderRadius: 1,
    minHeight: 2,
  },
  achievementsMotivation: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.5,
  },
  progressExplanationContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    width: '100%',
  },
  helpText: {
    fontSize: theme.foundations.fonts.sizes.sm,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textPrimary,
    lineHeight: theme.foundations.fonts.sizes.sm * 1.4,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  ratingScaleText: {
    fontSize: theme.foundations.fonts.sizes.xs,
    fontFamily: theme.foundations.fonts.families.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
    textAlign: 'center',
  },

});

export default StatsScreen;
