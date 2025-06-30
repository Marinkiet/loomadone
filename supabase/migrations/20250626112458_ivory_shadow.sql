/*
  # Add Study Sessions and Analytics

  1. New Tables
    - `study_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `topic_id` (uuid, foreign key to topics)
      - `session_type` (text) - 'game', 'reading', 'practice'
      - `duration_minutes` (integer) - session duration
      - `points_earned` (integer) - points from session
      - `completed` (boolean) - session completed
      - `started_at` (timestamp)
      - `ended_at` (timestamp)
    
    - `daily_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `date` (date) - the date
      - `total_study_minutes` (integer)
      - `topics_completed` (integer)
      - `points_earned` (integer)
      - `streak_days` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own data
*/

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('game', 'reading', 'practice', 'quiz')),
  duration_minutes integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Create daily_stats table
CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_study_minutes integer DEFAULT 0,
  topics_completed integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Policies for study_sessions
CREATE POLICY "Users can manage their own study sessions"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for daily_stats
CREATE POLICY "Users can manage their own daily stats"
  ON daily_stats
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update daily stats when study session ends
CREATE OR REPLACE FUNCTION update_daily_stats_on_session_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if session is being marked as completed
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    INSERT INTO daily_stats (user_id, date, total_study_minutes, points_earned, topics_completed)
    VALUES (
      NEW.user_id,
      NEW.started_at::date,
      NEW.duration_minutes,
      NEW.points_earned,
      CASE WHEN NEW.session_type = 'game' AND NEW.completed THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      total_study_minutes = daily_stats.total_study_minutes + NEW.duration_minutes,
      points_earned = daily_stats.points_earned + NEW.points_earned,
      topics_completed = daily_stats.topics_completed + CASE WHEN NEW.session_type = 'game' AND NEW.completed THEN 1 ELSE 0 END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic daily stats updates
CREATE TRIGGER update_daily_stats_trigger
  AFTER UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats_on_session_end();