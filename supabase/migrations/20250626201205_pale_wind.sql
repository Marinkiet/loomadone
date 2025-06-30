/*
  # Add Learning Progress Tracking

  1. New Tables
    - `study_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `subject` (text)
      - `topic` (text)
      - `time_spent` (float) - time spent in hours
      - `date` (date)
      - `score` (integer) - performance score
      - `created_at` (timestamp)

  2. New Columns for users table
    - `looma_cells` (integer) - renamed from total_points for consistency
    - `total_study_time` (float) - total study time in hours
    - `day_streak` (integer) - renamed from current_streak for consistency

  3. Functions
    - `updateStudyStats` - Updates user stats after a study session
*/

-- Create study_log table
CREATE TABLE IF NOT EXISTS study_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  time_spent float DEFAULT 0.0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE study_log ENABLE ROW LEVEL SECURITY;

-- Create policies for study_log
CREATE POLICY "Users can view their own study logs"
  ON study_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study logs"
  ON study_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add new columns to users table if they don't exist
DO $$
BEGIN
  -- Rename total_points to looma_cells for consistency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'total_points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'looma_cells'
  ) THEN
    ALTER TABLE users RENAME COLUMN total_points TO looma_cells;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'looma_cells'
  ) THEN
    ALTER TABLE users ADD COLUMN looma_cells integer DEFAULT 0;
  END IF;

  -- Add total_study_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'total_study_time'
  ) THEN
    ALTER TABLE users ADD COLUMN total_study_time float DEFAULT 0.0;
  END IF;

  -- Rename current_streak to day_streak for consistency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'current_streak'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'day_streak'
  ) THEN
    ALTER TABLE users RENAME COLUMN current_streak TO day_streak;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'day_streak'
  ) THEN
    ALTER TABLE users ADD COLUMN day_streak integer DEFAULT 0;
  END IF;
END $$;

-- Create function to update user stats after a study session
CREATE OR REPLACE FUNCTION update_study_stats()
RETURNS TRIGGER AS $$
DECLARE
  yesterday_date date := CURRENT_DATE - INTERVAL '1 day';
  has_yesterday_activity boolean;
  rounded_time float;
BEGIN
  -- Round time to nearest 5 minutes (0.0833 hours)
  rounded_time := ROUND(NEW.time_spent / 0.0833) * 0.0833;

  -- Update user's total study time
  UPDATE users 
  SET total_study_time = total_study_time + rounded_time
  WHERE id = NEW.user_id;

  -- Update user's looma cells based on score
  UPDATE users 
  SET looma_cells = looma_cells + NEW.score
  WHERE id = NEW.user_id;

  -- Check if user studied yesterday to maintain streak
  SELECT EXISTS (
    SELECT 1 FROM study_log 
    WHERE user_id = NEW.user_id AND date = yesterday_date
  ) INTO has_yesterday_activity;

  -- Update streak
  IF has_yesterday_activity THEN
    -- Continue streak
    UPDATE users 
    SET day_streak = day_streak + 1
    WHERE id = NEW.user_id;
  ELSE
    -- Reset streak if no activity yesterday (unless this is the first day)
    UPDATE users 
    SET day_streak = 1
    WHERE id = NEW.user_id AND day_streak = 0;
  END IF;

  -- Update longest streak if current streak is longer
  UPDATE users 
  SET longest_streak = day_streak
  WHERE id = NEW.user_id AND day_streak > longest_streak;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user stats when a study log is added
CREATE TRIGGER update_study_stats_trigger
  AFTER INSERT ON study_log
  FOR EACH ROW
  EXECUTE FUNCTION update_study_stats();

-- Create function to sync study sessions to study log
CREATE OR REPLACE FUNCTION sync_study_sessions_to_log()
RETURNS TRIGGER AS $$
DECLARE
  topic_name text;
  subject_name text;
  hours_spent float;
BEGIN
  -- Get topic and subject names
  SELECT t.name, s.name 
  INTO topic_name, subject_name
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  WHERE t.id = NEW.topic_id;

  -- Convert minutes to hours
  hours_spent := NEW.duration_minutes / 60.0;

  -- Insert into study_log
  INSERT INTO study_log (
    user_id,
    subject,
    topic,
    time_spent,
    date,
    score
  ) VALUES (
    NEW.user_id,
    subject_name,
    topic_name,
    hours_spent,
    CURRENT_DATE,
    NEW.points_earned
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync completed study sessions to study log
CREATE TRIGGER sync_study_sessions_trigger
  AFTER UPDATE OF completed ON study_sessions
  FOR EACH ROW
  WHEN (NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL))
  EXECUTE FUNCTION sync_study_sessions_to_log();

-- Create function to sync game sessions to study log
CREATE OR REPLACE FUNCTION sync_game_sessions_to_log()
RETURNS TRIGGER AS $$
DECLARE
  hours_spent float;
BEGIN
  -- Convert seconds to hours
  hours_spent := NEW.duration_seconds / 3600.0;

  -- Insert into study_log
  INSERT INTO study_log (
    user_id,
    subject,
    topic,
    time_spent,
    date,
    score
  ) VALUES (
    NEW.user_id,
    NEW.subject,
    NEW.topic,
    hours_spent,
    CURRENT_DATE,
    NEW.points_earned
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync game sessions to study log
CREATE TRIGGER sync_game_sessions_trigger
  AFTER INSERT ON user_game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_game_sessions_to_log();

-- Create view for weekly study data
CREATE OR REPLACE VIEW user_weekly_study AS
WITH days AS (
  SELECT generate_series(
    date_trunc('week', CURRENT_DATE)::date,
    (date_trunc('week', CURRENT_DATE) + interval '6 days')::date,
    interval '1 day'
  )::date AS day
),
user_days AS (
  SELECT 
    u.id AS user_id,
    d.day
  FROM users u
  CROSS JOIN days d
)
SELECT 
  ud.user_id,
  ud.day,
  COALESCE(SUM(sl.time_spent), 0) AS study_hours,
  COALESCE(SUM(sl.score), 0) AS points_earned
FROM user_days ud
LEFT JOIN study_log sl ON sl.user_id = ud.user_id AND sl.date = ud.day
GROUP BY ud.user_id, ud.day
ORDER BY ud.user_id, ud.day;

-- Create function to get user's study graph data
CREATE OR REPLACE FUNCTION get_user_study_graph_data(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', to_char(day, 'Dy'),
      'date', to_char(day, 'YYYY-MM-DD'),
      'study_hours', study_hours,
      'points_earned', points_earned
    )
  ) INTO result
  FROM user_weekly_study
  WHERE user_id = user_uuid
  ORDER BY day;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's learning history
CREATE OR REPLACE FUNCTION get_user_learning_history(user_uuid uuid, limit_count integer DEFAULT 20)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'date', to_char(date, 'YYYY-MM-DD'),
      'subject', subject,
      'topic', topic,
      'time_spent', time_spent,
      'performance_score', score
    )
  ) INTO result
  FROM study_log
  WHERE user_id = user_uuid
  ORDER BY date DESC, created_at DESC
  LIMIT limit_count;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;