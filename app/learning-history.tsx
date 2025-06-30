import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface LearningHistoryItem {
  id: string;
  date: string;
  subject: string;
  topic: string;
  time_spent: number;
  performance_score: number;
}

export default function LearningHistoryScreen() {
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<LearningHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchLearningHistory();
  }, [user]);

  const fetchLearningHistory = async () => {
    if (!user) return;

    try {
      setError(null);
      if (!isRefreshing) setIsLoading(true);

      // Get date range based on filter
      let dateFilter = '';
      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = `date >= '${weekAgo.toISOString().split('T')[0]}'`;
      } else if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        dateFilter = `date >= '${monthAgo.toISOString().split('T')[0]}'`;
      }

      // Fetch learning history from study_log table
      const query = supabase
        .from('study_log')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (dateFilter) {
        query.filter(dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format the data
      const formattedData = data.map(item => ({
        id: item.id,
        date: new Date(item.date).toLocaleDateString(),
        subject: item.subject,
        topic: item.topic,
        time_spent: item.time_spent,
        performance_score: item.score
      }));

      setHistoryData(formattedData);
    } catch (error: any) {
      
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLearningHistory();
  };

  const formatTimeSpent = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
  };

  const getSubjectColor = (subject: string) => {
    const colorMap: { [key: string]: string } = {
      'Mathematics': '#8B5CF6',
      'Mathematical Literacy': '#7C3AED',
      'Life Sciences': '#10B981',
      'Natural Sciences': '#10B981',
      'English Home Language': '#3B82F6',
      'Physical Sciences': '#F59E0B',
      'Afrikaans First Additional Language': '#F59E0B',
      'Business Studies': '#059669',
      'Life Orientation': '#DC2626',
      'Geography': '#059669',
      'History': '#6366F1',
      'Economics': '#0891B2',
      'Accounting': '#EF4444',
    };
    return colorMap[subject] || theme.colors.primary;
  };

  const renderHistoryItem = ({ item }: { item: LearningHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.subjectRow}>
          <View style={[styles.subjectBadge, { backgroundColor: `${getSubjectColor(item.subject)}15` }]}>
            <Text style={[styles.subjectText, { color: getSubjectColor(item.subject) }]}>
              {item.subject}
            </Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="time" size={14} color={theme.colors.secondary} />
              <Text style={styles.statText}>{formatTimeSpent(item.time_spent)}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="star" size={14} color={theme.colors.accent} />
              <Text style={styles.statText}>{item.performance_score} points</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.topicText} numberOfLines={1} ellipsizeMode="tail">{item.topic}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book" size={64} color={theme.colors.primary} />
      <Text style={styles.emptyStateTitle}>No learning history yet</Text>
      <Text style={styles.emptyStateText}>
        {filter !== 'all' 
          ? `You haven't completed any learning activities in the ${filter === 'week' ? 'past week' : 'past month'}.` 
          : 'Start learning to build your history!'}
      </Text>
      <TouchableOpacity 
        style={styles.startLearningButton}
        onPress={() => router.push('/game-map')}
        activeOpacity={0.8}
      >
        <Text style={styles.startLearningButtonText}>Start Learning</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📖 My Learning History</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All Time
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'month' && styles.activeFilterTab]}
          onPress={() => setFilter('month')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'month' && styles.activeFilterText]}>
            Past Month
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'week' && styles.activeFilterTab]}
          onPress={() => setFilter('week')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'week' && styles.activeFilterText]}>
            Past Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* History List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your learning history...</Text>
        </View>
      ) : (
        <FlatList
          data={historyData}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceLight}80`,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceLight}80`,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  activeFilterText: {
    color: theme.colors.primary,
    opacity: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    marginTop: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}15`,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.error,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  historyItem: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dateContainer: {
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.primary}20`,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  contentContainer: {
    padding: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  startLearningButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startLearningButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
});