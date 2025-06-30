import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyStat, StudySession, UserAchievement, LeaderboardEntry } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';

interface StatsContextType {
  dailyStats: DailyStat[];
  studySessions: StudySession[];
  achievements: UserAchievement[];
  leaderboardEntries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  createStudySession: (topicId: string, sessionType: string) => Promise<StudySession | null>;
  completeStudySession: (sessionId: string, durationMinutes: number, pointsEarned: number) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  getTodayStats: () => DailyStat | null;
  getWeeklyStats: () => { totalMinutes: number; totalPoints: number; topicsCompleted: number };
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { updateUserRank } = useLeaderboard();
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch daily stats
      const { data: dailyStatsData, error: dailyStatsError } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30); // Last 30 days

      if (dailyStatsError) throw dailyStatsError;

      // Fetch study sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50); // Last 50 sessions

      if (sessionsError) throw sessionsError;

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Fetch leaderboard entries
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (leaderboardError) throw leaderboardError;

      setDailyStats(dailyStatsData || []);
      setStudySessions(sessionsData || []);
      setAchievements(achievementsData || []);
      setLeaderboardEntries(leaderboardData || []);
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      setError(error.message || 'Failed to fetch user stats');
    } finally {
      setIsLoading(false);
    }
  };

  const createStudySession = async (topicId: string, sessionType: string): Promise<StudySession | null> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          topic_id: topicId,
          session_type: sessionType,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setStudySessions(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Error creating study session:', error);
      throw error;
    }
  };

  const completeStudySession = async (sessionId: string, durationMinutes: number, pointsEarned: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({
          duration_minutes: durationMinutes,
          points_earned: pointsEarned,
          completed: true,
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Refresh stats after completing session
      await fetchUserStats();
      
      // Update leaderboard entries with the new points
      try {
        // Update weekly, monthly, and all-time leaderboards
        await updateUserRank('weekly', pointsEarned);
        await updateUserRank('monthly', pointsEarned);
        await updateUserRank('all_time', pointsEarned);
      } catch (leaderboardError) {
        console.error('Error updating leaderboard:', leaderboardError);
        // Don't throw here, as we still want to complete the session
      }
    } catch (error: any) {
      console.error('Error completing study session:', error);
      throw error;
    }
  };

  const getTodayStats = (): DailyStat | null => {
    const today = new Date().toISOString().split('T')[0];
    return dailyStats.find(stat => stat.date === today) || null;
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekAgoString = oneWeekAgo.toISOString().split('T')[0];

    const weeklyStats = dailyStats.filter(stat => stat.date >= weekAgoString);

    return {
      totalMinutes: weeklyStats.reduce((sum, stat) => sum + stat.total_study_minutes, 0),
      totalPoints: weeklyStats.reduce((sum, stat) => sum + stat.points_earned, 0),
      topicsCompleted: weeklyStats.reduce((sum, stat) => sum + stat.topics_completed, 0),
    };
  };

  return (
    <StatsContext.Provider
      value={{
        dailyStats,
        studySessions,
        achievements,
        leaderboardEntries,
        isLoading,
        error,
        createStudySession,
        completeStudySession,
        fetchUserStats,
        getTodayStats,
        getWeeklyStats,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
}