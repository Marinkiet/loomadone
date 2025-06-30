import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Alert } from 'react-native';

interface GameQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: { id: string; text: string }[] | null;
  correct_answer: string;
  type: 'multiple_choice' | 'true_false';
  created_by: string;
  created_at: string;
}

interface GameSession {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  points_earned: number;
  questions_attempted: number;
  questions_correct: number;
  questions_wrong: number;
  duration_seconds: number;
  completed_at: string;
}

interface UserStats {
  id: string;
  user_id: string;
  looma_cells: number;
  games_played: number;
  correct_ratio: number;
  total_time_spent: number;
}

interface GameContextType {
  questions: GameQuestion[];
  sessions: GameSession[];
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  fetchQuestions: (subject: string, topic: string) => Promise<GameQuestion[]>;
  generateQuestions: (subject: string, topic: string, grade?: string) => Promise<GameQuestion[]>;
  saveGameSession: (sessionData: Omit<GameSession, 'id' | 'user_id' | 'completed_at'>) => Promise<void>;
  fetchUserStats: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGameQuestions() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameQuestions must be used within a GameProvider');
  }
  return context;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { updateUserRank } = useLeaderboard();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchUserSessions();
    }
  }, [user]);

  const fetchUserSessions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching user game sessions:', error);
      setError(error.message || 'Failed to fetch game sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserStats(data || null);
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      setError(error.message || 'Failed to fetch user stats');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (subject: string, topic: string): Promise<GameQuestion[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('ai_game_questions')
        .select('*')
        .eq('subject', subject)
        .eq('topic', topic)
        .limit(15);

      if (error) throw error;

      setQuestions(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      setError(error.message || 'Failed to fetch questions');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestions = async (subject: string, topic: string, grade?: string): Promise<GameQuestion[]> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`Generating questions for: ${subject} - ${topic} (Grade: ${grade || 'Not specified'})`);

      // First check if we already have questions
      const existingQuestions = await fetchQuestions(subject, topic);
      if (existingQuestions.length >= 10) {
        console.log(`Found ${existingQuestions.length} existing questions, using those`);
        return existingQuestions;
      }

      console.log('Calling generate-questions edge function...');

      // Check if we have the required environment variables
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Call the Supabase Edge Function to generate questions
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: { subject, topic, grade, count: 15 },
      });

      if (error) {
        console.error('Edge function error details:', {
          message: error.message,
          context: error.context,
          details: error.details,
          name: error.name,
          status: error.status || 'unknown'
        });
        
        // Provide more specific error messages
        if (error.message?.includes('Edge Function returned a non-2xx status code') || 
            error.message?.includes('FunctionsHttpError')) {
          throw new Error('Question generation service is currently unavailable. Please check that the OPENAI_API_KEY is set in your Supabase Edge Function environment variables.');
        } else if (error.message?.includes('Network request failed')) {
          throw new Error('Unable to connect to the question generation service. Please check your internet connection.');
        } else {
          throw new Error(`Question generation failed: ${error.message}`);
        }
      }

      if (data.error) {
        console.error('Edge function returned error:', data.error);
        throw new Error(`Question generation service error: ${data.error}`);
      }

      console.log('Edge function response:', data);

      // Fetch the newly generated questions
      const newQuestions = await fetchQuestions(subject, topic);
      console.log(`Successfully generated and fetched ${newQuestions.length} new questions`);
      return newQuestions;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate questions';
      console.error('Error generating questions:', {
        message: errorMessage,
        stack: error.stack,
        name: error.name || 'Unknown',
        cause: error.cause || 'Unknown',
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        hasNetwork: typeof navigator !== 'undefined' ? navigator.onLine !== false : 'Unknown'
      });
      setError(errorMessage);
      
      Alert.alert(
        'Error Generating Questions',
        `${errorMessage}\n\nPlease check your internet connection and try again. If the problem persists, please ensure the OPENAI_API_KEY is set in your Supabase Edge Function environment variables.`,
        [{ text: 'OK' }]
      );
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const saveGameSession = async (sessionData: Omit<GameSession, 'id' | 'user_id' | 'completed_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('user_game_sessions')
        .insert({
          user_id: user.id,
          ...sessionData,
        });

      if (error) throw error;

      // Refresh sessions and stats
      await fetchUserSessions();
      await fetchUserStats();
      
      // Update leaderboard entries with the new points
      try {
        // Update weekly, monthly, and all-time leaderboards
        await updateUserRank('weekly', sessionData.points_earned);
        await updateUserRank('monthly', sessionData.points_earned);
        await updateUserRank('all_time', sessionData.points_earned);
      } catch (leaderboardError) {
        console.error('Error updating leaderboard:', leaderboardError);
        // Don't throw here, as we still want to save the session
      }
    } catch (error: any) {
      console.error('Error saving game session:', error);
      setError(error.message || 'Failed to save game session');
      
      Alert.alert(
        'Error Saving Progress',
        'There was a problem saving your game progress. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GameContext.Provider
      value={{
        questions,
        sessions,
        userStats,
        isLoading,
        error,
        fetchQuestions,
        generateQuestions,
        saveGameSession,
        fetchUserStats,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}