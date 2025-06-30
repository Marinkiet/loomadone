import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { LeaderboardEntry, User } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardUser extends User {
  rank?: number;
  points?: number;
}

interface LeaderboardContextType {
  weeklyLeaderboard: LeaderboardUser[];
  monthlyLeaderboard: LeaderboardUser[];
  allTimeLeaderboard: LeaderboardUser[];
  userRank: { weekly?: number; monthly?: number; allTime?: number };
  isLoading: boolean;
  error: string | null;
  fetchLeaderboards: () => Promise<void>;
  updateUserRank: (category: 'weekly' | 'monthly' | 'all_time', points: number) => Promise<void>;
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (context === undefined) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
}

export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardUser[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardUser[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<{ weekly?: number; monthly?: number; allTime?: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch leaderboards if user is available
    if (user) {
      fetchLeaderboards();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchLeaderboards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (testError) {
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }

      // Fetch weekly leaderboard
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          profile_image,
          school_name,
          looma_cells,
          day_streak,
          level,
          total_points
        `)
        .order('looma_cells', { ascending: false })
        .limit(50);

      if (weeklyError) {
        console.error('Weekly leaderboard error:', weeklyError);
        throw new Error(`Failed to fetch weekly leaderboard: ${weeklyError.message}`);
      }

      // Fetch monthly leaderboard
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          profile_image,
          school_name,
          looma_cells,
          day_streak,
          level,
          total_points
        `)
        .order('looma_cells', { ascending: false })
        .limit(50);

      if (monthlyError) {
        console.error('Monthly leaderboard error:', monthlyError);
        throw new Error(`Failed to fetch monthly leaderboard: ${monthlyError.message}`);
      }

      // Fetch all-time leaderboard
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          profile_image,
          school_name,
          looma_cells,
          day_streak,
          level,
          total_points
        `)
        .order('total_points', { ascending: false })
        .limit(50);

      if (allTimeError) {
        console.error('All-time leaderboard error:', allTimeError);
        throw new Error(`Failed to fetch all-time leaderboard: ${allTimeError.message}`);
      }

      // Add ranks to the data
      const addRanks = (data: any[]) => 
        data.map((user, index) => ({
          ...user,
          rank: index + 1,
          points: user.total_points || user.looma_cells || 0,
        }));

      setWeeklyLeaderboard(addRanks(weeklyData || []));
      setMonthlyLeaderboard(addRanks(monthlyData || []));
      setAllTimeLeaderboard(addRanks(allTimeData || []));

      // Calculate user ranks
      if (user) {
        const weeklyRank = weeklyData?.findIndex(u => u.id === user.id) + 1 || undefined;
        const monthlyRank = monthlyData?.findIndex(u => u.id === user.id) + 1 || undefined;
        const allTimeRank = allTimeData?.findIndex(u => u.id === user.id) + 1 || undefined;

        setUserRank({
          weekly: weeklyRank > 0 ? weeklyRank : undefined,
          monthly: monthlyRank > 0 ? monthlyRank : undefined,
          allTime: allTimeRank > 0 ? allTimeRank : undefined,
        });
      }
    } catch (error: any) {
      console.error('Error fetching leaderboards:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fetch leaderboards';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message?.includes('Supabase connection failed')) {
        errorMessage = 'Database connection failed. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRank = async (category: 'weekly' | 'monthly' | 'all_time', points: number) => {
    if (!user) return;
    
    try {
      // Call the upsert_leaderboard_entry function
      const { data, error } = await supabase.rpc('upsert_leaderboard_entry', {
        user_uuid: user.id,
        entry_category: category,
        points_earned: points
      });

      if (error) {
        console.error('Error updating rank:', error);
        throw error;
      } else {
        console.log(`Successfully updated rank for ${category}`);
      }

      // Refresh leaderboards
      await fetchLeaderboards();
    } catch (error: any) {
      console.error('Error updating user rank:', error);
      // Don't rethrow the error to prevent cascading failures
    }
  };

  return (
    <LeaderboardContext.Provider
      value={{
        weeklyLeaderboard,
        monthlyLeaderboard,
        allTimeLeaderboard,
        userRank,
        isLoading,
        error,
        fetchLeaderboards,
        updateUserRank,
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
}