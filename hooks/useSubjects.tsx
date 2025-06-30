import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Subject, Topic, UserTopicProgress } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface SubjectsContextType {
  subjects: Subject[];
  topics: Record<string, Topic[]>;
  userProgress: UserTopicProgress[];
  isLoading: boolean;
  error: string | null;
  fetchSubjects: () => Promise<void>;
  fetchTopicsForSubject: (subjectId: string) => Promise<Topic[]>;
  updateTopicProgress: (topicId: string, status: string, progressPercentage: number) => Promise<void>;
  markTopicComplete: (topicId: string) => Promise<void>;
}

const SubjectsContext = createContext<SubjectsContextType | undefined>(undefined);

export function useSubjects() {
  const context = useContext(SubjectsContext);
  if (context === undefined) {
    throw new Error('useSubjects must be used within a SubjectsProvider');
  }
  return context;
}

export function SubjectsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [userProgress, setUserProgress] = useState<UserTopicProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubjects();
      fetchUserProgress();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;

      setSubjects(data || []);

      // Fetch topics for each subject
      const topicsMap: Record<string, Topic[]> = {};
      for (const subject of data || []) {
        const topics = await fetchTopicsForSubject(subject.id);
        topicsMap[subject.id] = topics;
      }

      setTopics(topicsMap);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      setError(error.message || 'Failed to fetch subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopicsForSubject = async (subjectId: string): Promise<Topic[]> => {
    try {
      console.log(`Fetching topics for subject: ${subjectId}`);
      
      // Add retry logic for network failures
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('topics')
            .select('*')
            .eq('subject_id', subjectId)
            .order('position_y');

          if (error) {
            console.error(`Supabase error for subject ${subjectId} (attempt ${retryCount + 1}):`, {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            
            // If it's a network error, retry
            if (error.message?.includes('Network request failed') && retryCount < maxRetries - 1) {
              retryCount++;
              console.log(`Retrying in ${retryCount * 1000}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
              continue;
            }
            
            throw error;
          }

          console.log(`Successfully fetched ${data?.length || 0} topics for subject ${subjectId}`);
          return data || [];
        } catch (networkError: any) {
          if (networkError.message?.includes('Network request failed') && retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`Network error, retrying in ${retryCount * 1000}ms... (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
            continue;
          }
          throw networkError;
        }
      }
      
      return [];
    } catch (error: any) {
      console.error(`Error fetching topics for subject ${subjectId}:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        hasNetwork: navigator.onLine !== false
      });
      // Set a more user-friendly error message
      if (error.message?.includes('Network request failed')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(`Failed to load topics: ${error.message}`);
      }
      
      return [];
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setUserProgress(data || []);
    } catch (error: any) {
      console.error('Error fetching user progress:', error);
    }
  };

  const updateTopicProgress = async (topicId: string, status: string, progressPercentage: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('user_topic_progress')
        .upsert({
          user_id: user.id,
          topic_id: topicId,
          status,
          progress_percentage: progressPercentage,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        });

      if (error) throw error;

      // Refresh user progress
      await fetchUserProgress();
    } catch (error: any) {
      console.error('Error updating topic progress:', error);
      throw error;
    }
  };

  const markTopicComplete = async (topicId: string) => {
    await updateTopicProgress(topicId, 'completed', 100);
  };

  return (
    <SubjectsContext.Provider
      value={{
        subjects,
        topics,
        userProgress,
        isLoading,
        error,
        fetchSubjects,
        fetchTopicsForSubject,
        updateTopicProgress,
        markTopicComplete,
      }}
    >
      {children}
    </SubjectsContext.Provider>
  );
}