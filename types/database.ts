export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          grade: string | null;
          subjects: string[] | null;
          profile_image: string | null;
          created_at: string;
          updated_at: string;
          looma_cells: number;
          day_streak: number;
          longest_streak: number;
          total_study_minutes: number;
          level: number;
          bio: string | null;
          school_name: string | null;
          privacy_settings: any;
          total_study_time: number;
          total_points: number;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          grade?: string | null;
          subjects?: string[] | null;
          profile_image?: string | null;
          created_at?: string;
          updated_at?: string;
          looma_cells?: number;
          day_streak?: number;
          longest_streak?: number;
          total_study_minutes?: number;
          level?: number;
          bio?: string | null;
          school_name?: string | null;
          privacy_settings?: any;
          total_study_time?: number;
          total_points?: number;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          grade?: string | null;
          subjects?: string[] | null;
          profile_image?: string | null;
          created_at?: string;
          updated_at?: string;
          looma_cells?: number;
          day_streak?: number;
          longest_streak?: number;
          total_study_minutes?: number;
          level?: number;
          bio?: string | null;
          school_name?: string | null;
          privacy_settings?: any;
          total_study_time?: number;
          total_points?: number;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      topics: {
        Row: {
          id: string;
          subject_id: string;
          title: string;
          name: string;
          description: string | null;
          status: string;
          position_x: number;
          position_y: number;
          subtopic_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          title: string;
          name: string;
          description?: string | null;
          status?: string;
          position_x: number;
          position_y: number;
          subtopic_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          title?: string;
          name?: string;
          description?: string | null;
          status?: string;
          position_x?: number;
          position_y?: number;
          subtopic_key?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_topic_progress: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          status: string;
          progress_percentage: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          status?: string;
          progress_percentage?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string;
          status?: string;
          progress_percentage?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_timetables: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          type: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      timetable_slots: {
        Row: {
          id: string;
          timetable_id: string;
          day: string;
          time_slot: string;
          subject_name: string;
          teacher_name: string | null;
          room: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          timetable_id: string;
          day: string;
          time_slot: string;
          subject_name: string;
          teacher_name?: string | null;
          room?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          timetable_id?: string;
          day?: string;
          time_slot?: string;
          subject_name?: string;
          teacher_name?: string | null;
          room?: string | null;
          created_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string | null;
          session_type: string;
          duration_minutes: number;
          points_earned: number;
          completed: boolean;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id?: string | null;
          session_type: string;
          duration_minutes?: number;
          points_earned?: number;
          completed?: boolean;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string | null;
          session_type?: string;
          duration_minutes?: number;
          points_earned?: number;
          completed?: boolean;
          started_at?: string;
          ended_at?: string | null;
        };
      };
      daily_stats: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          total_study_minutes: number;
          topics_completed: number;
          points_earned: number;
          streak_days: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          total_study_minutes?: number;
          topics_completed?: number;
          points_earned?: number;
          streak_days?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          total_study_minutes?: number;
          topics_completed?: number;
          points_earned?: number;
          streak_days?: number;
          created_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          achievement_data: any;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_type: string;
          achievement_data?: any;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_type?: string;
          achievement_data?: any;
          earned_at?: string;
        };
      };
      leaderboard_entries: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          points: number;
          rank: number | null;
          period_start: string | null;
          period_end: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          points?: number;
          rank?: number | null;
          period_start?: string | null;
          period_end?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          points?: number;
          rank?: number | null;
          period_start?: string | null;
          period_end?: string | null;
          updated_at?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          looma_cells: number;
          games_played: number;
          correct_ratio: number;
          total_time_spent: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          looma_cells?: number;
          games_played?: number;
          correct_ratio?: number;
          total_time_spent?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          looma_cells?: number;
          games_played?: number;
          correct_ratio?: number;
          total_time_spent?: number;
        };
      };
      user_content: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: string;
          subject: string;
          description: string | null;
          file_url: string;
          thumbnail_url: string | null;
          file_size: string;
          upload_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type: string;
          subject: string;
          description?: string | null;
          file_url: string;
          thumbnail_url?: string | null;
          file_size: string;
          upload_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: string;
          subject?: string;
          description?: string | null;
          file_url?: string;
          thumbnail_url?: string | null;
          file_size?: string;
          upload_date?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      user_weekly_study: {
        Row: {
          user_id: string | null;
          day: string | null;
          study_hours: number | null;
          points_earned: number | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Subject = Database['public']['Tables']['subjects']['Row'];
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert'];
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update'];

export type Topic = Database['public']['Tables']['topics']['Row'];
export type TopicInsert = Database['public']['Tables']['topics']['Insert'];
export type TopicUpdate = Database['public']['Tables']['topics']['Update'];

export type UserTopicProgress = Database['public']['Tables']['user_topic_progress']['Row'];
export type UserTopicProgressInsert = Database['public']['Tables']['user_topic_progress']['Insert'];
export type UserTopicProgressUpdate = Database['public']['Tables']['user_topic_progress']['Update'];

export type UserTimetable = Database['public']['Tables']['user_timetables']['Row'];
export type TimetableSlot = Database['public']['Tables']['timetable_slots']['Row'];
export type StudySession = Database['public']['Tables']['study_sessions']['Row'];
export type DailyStat = Database['public']['Tables']['daily_stats']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];
export type LeaderboardEntry = Database['public']['Tables']['leaderboard_entries']['Row'];
export type UserStats = Database['public']['Tables']['user_stats']['Row'];
export type UserContent = Database['public']['Tables']['user_content']['Row'];