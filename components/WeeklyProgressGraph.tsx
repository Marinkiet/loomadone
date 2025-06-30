import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { theme } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

interface DayData {
  day: string;
  date: string;
  study_hours: number;
  points_earned: number;
}

interface WeeklyProgressGraphProps {
  showPoints?: boolean;
  height?: number;
  style?: any;
}

export default function WeeklyProgressGraph({ 
  showPoints = true, 
  height = 200,
  style = {}
}: WeeklyProgressGraphProps) {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxHours, setMaxHours] = useState(1); // Minimum 1 hour for scale
  const [maxPoints, setMaxPoints] = useState(100); // Minimum 100 points for scale

  useEffect(() => {
    if (user) {
      fetchWeeklyData();
    }
  }, [user]);

  const fetchWeeklyData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call the function to get user's study graph data
      const { data, error } = await supabase.rpc('get_user_study_graph_data', {
        user_uuid: user.id
      });

      if (error) throw error;

      // If no data, create empty week data
      if (!data || data.length === 0) {
        const emptyWeek = generateEmptyWeekData();
        setWeekData(emptyWeek);
        return;
      }

      setWeekData(data);

      // Calculate max values for scaling
      const maxStudyHours = Math.max(...data.map(d => d.study_hours), 1);
      const maxPointsEarned = Math.max(...data.map(d => d.points_earned), 100);
      
      setMaxHours(maxStudyHours);
      setMaxPoints(maxPointsEarned);
    } catch (error: any) {
      console.error('Error fetching weekly data:', error);
      setError(error.message || 'Failed to load weekly progress');
      
      // Set empty data on error
      setWeekData(generateEmptyWeekData());
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmptyWeekData = (): DayData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    return days.map((day, index) => {
      // Calculate the date for this day of the week
      const date = new Date(today);
      date.setDate(today.getDate() - dayOfWeek + (index === 6 ? 0 : index + 1));
      
      return {
        day,
        date: date.toISOString().split('T')[0],
        study_hours: 0,
        points_earned: 0
      };
    });
  };

  const formatHours = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    } else {
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { height }, style]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { height }, style]}>
        <Text style={styles.errorText}>Could not load progress data</Text>
      </View>
    );
  }

  const barWidth = (screenWidth - 64) / weekData.length - 8;

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={styles.graphContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>{formatHours(maxHours)}</Text>
          <Text style={styles.axisLabel}>{formatHours(maxHours / 2)}</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>
        
        {/* Bars */}
        <View style={styles.barsContainer}>
          {weekData.map((day, index) => {
            const heightPercentage = day.study_hours / maxHours;
            const barHeight = Math.max(heightPercentage * (height - 80), 2); // Minimum 2px height
            
            const isToday = day.date === new Date().toISOString().split('T')[0];
            
            return (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barLabelContainer}>
                  {showPoints && day.points_earned > 0 && (
                    <Text style={styles.pointsLabel}>+{day.points_earned}</Text>
                  )}
                </View>
                
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight,
                        backgroundColor: isToday ? theme.colors.primary : `${theme.colors.primary}80`,
                        width: barWidth
                      }
                    ]} 
                  />
                </View>
                
                <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                  {day.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
  },
  graphContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingVertical: 10,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barLabelContainer: {
    height: 20,
    justifyContent: 'flex-end',
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.secondary,
    marginTop: 4,
  },
  todayLabel: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.error,
    textAlign: 'center',
  },
});