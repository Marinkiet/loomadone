/*
  # Enhance User Profile

  1. New Columns for users table
    - `total_points` (integer) - lifetime points earned
    - `current_streak` (integer) - current daily streak
    - `longest_streak` (integer) - longest streak achieved
    - `total_study_minutes` (integer) - lifetime study time
    - `level` (integer) - user level based on points
    - `bio` (text) - user bio/description
    - `school_name` (text) - school name
    - `privacy_settings` (jsonb) - privacy preferences

  2. Indexes
    - Add indexes for better query performance
*/

-- Add new columns to users table
DO $$
BEGIN
  -- Add total_points column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE users ADD COLUMN total_points integer DEFAULT 0;
  END IF;

  -- Add current_streak column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE users ADD COLUMN current_streak integer DEFAULT 0;
  END IF;

  -- Add longest_streak column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'longest_streak'
  ) THEN
    ALTER TABLE users ADD COLUMN longest_streak integer DEFAULT 0;
  END IF;

  -- Add total_study_minutes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'total_study_minutes'
  ) THEN
    ALTER TABLE users ADD COLUMN total_study_minutes integer DEFAULT 0;
  END IF;

  -- Add level column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'level'
  ) THEN
    ALTER TABLE users ADD COLUMN level integer DEFAULT 1;
  END IF;

  -- Add bio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio text;
  END IF;

  -- Add school_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'school_name'
  ) THEN
    ALTER TABLE users ADD COLUMN school_name text;
  END IF;

  -- Add privacy_settings column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'privacy_settings'
  ) THEN
    ALTER TABLE users ADD COLUMN privacy_settings jsonb DEFAULT '{"profile_visible": true, "show_progress": true, "show_streak": true}';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);
CREATE INDEX IF NOT EXISTS idx_users_grade ON users(grade);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_id ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic_id ON user_topic_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);

-- Function to calculate user level based on points
CREATE OR REPLACE FUNCTION calculate_user_level(points integer)
RETURNS integer AS $$
BEGIN
  -- Level calculation: every 1000 points = 1 level
  -- Level 1: 0-999 points
  -- Level 2: 1000-1999 points, etc.
  RETURN GREATEST(1, (points / 1000) + 1);
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's total points and level when daily stats change
  UPDATE users 
  SET 
    total_points = (
      SELECT COALESCE(SUM(points_earned), 0) 
      FROM daily_stats 
      WHERE user_id = NEW.user_id
    ),
    total_study_minutes = (
      SELECT COALESCE(SUM(total_study_minutes), 0) 
      FROM daily_stats 
      WHERE user_id = NEW.user_id
    )
  WHERE id = NEW.user_id;

  -- Update level based on new total points
  UPDATE users 
  SET level = calculate_user_level(total_points)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user stats when daily stats change
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT OR UPDATE ON daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();