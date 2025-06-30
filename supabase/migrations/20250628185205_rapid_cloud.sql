/*
  # Add total_points column to users table

  1. Changes
    - Add total_points column to users table if it doesn't exist
    - Update functions to use both looma_cells and total_points
    - Ensure backward compatibility with existing code

  2. Details
    - This migration adds a total_points column to track user points separately from looma_cells
    - The column is initialized with the current looma_cells value for each user
    - Functions are updated to maintain both columns in sync
*/

-- Add total_points column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE users ADD COLUMN total_points integer DEFAULT 0;
    
    -- Initialize total_points with current looma_cells values
    UPDATE users SET total_points = COALESCE(looma_cells, 0);
  END IF;
END $$;

-- Update the update_user_stats_on_game_completion function to update both columns
CREATE OR REPLACE FUNCTION update_user_stats_on_game_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO user_stats (
    user_id,
    looma_cells,
    games_played,
    correct_ratio,
    total_time_spent
  )
  VALUES (
    NEW.user_id,
    NEW.points_earned,
    1,
    CASE WHEN NEW.questions_attempted > 0 
      THEN NEW.questions_correct::float / NEW.questions_attempted 
      ELSE 0 
    END,
    NEW.duration_seconds
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    looma_cells = user_stats.looma_cells + NEW.points_earned,
    games_played = user_stats.games_played + 1,
    correct_ratio = (
      (user_stats.correct_ratio * user_stats.games_played) + 
      (CASE WHEN NEW.questions_attempted > 0 
        THEN NEW.questions_correct::float / NEW.questions_attempted 
        ELSE 0 
      END)
    ) / (user_stats.games_played + 1),
    total_time_spent = user_stats.total_time_spent + NEW.duration_seconds;

  -- Update both looma_cells and total_points in the users table
  UPDATE users
  SET 
    looma_cells = COALESCE(looma_cells, 0) + NEW.points_earned,
    total_points = COALESCE(total_points, 0) + NEW.points_earned
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the update_study_stats function to update both columns
CREATE OR REPLACE FUNCTION update_study_stats()
RETURNS TRIGGER AS $$
DECLARE
  _yesterday_date date := CURRENT_DATE - INTERVAL '1 day';
  _has_yesterday_activity boolean;
  _rounded_time float;
BEGIN
  -- Round time to nearest 5 minutes (0.0833 hours)
  _rounded_time := ROUND(NEW.time_spent / 0.0833) * 0.0833;

  -- Update user's total study time
  UPDATE users 
  SET total_study_time = COALESCE(total_study_time, 0) + _rounded_time
  WHERE id = NEW.user_id;

  -- Update user's looma cells and total_points based on score
  UPDATE users 
  SET 
    looma_cells = COALESCE(looma_cells, 0) + NEW.score,
    total_points = COALESCE(total_points, 0) + NEW.score
  WHERE id = NEW.user_id;

  -- Check if user studied yesterday to maintain streak
  SELECT EXISTS (
    SELECT 1 FROM study_log 
    WHERE study_log.user_id = NEW.user_id AND study_log.date = _yesterday_date
  ) INTO _has_yesterday_activity;

  -- Update streak
  IF _has_yesterday_activity THEN
    -- Continue streak
    UPDATE users 
    SET day_streak = COALESCE(day_streak, 0) + 1
    WHERE id = NEW.user_id;
  ELSE
    -- Reset streak if no activity yesterday (unless this is the first day)
    UPDATE users 
    SET day_streak = 1
    WHERE id = NEW.user_id AND (day_streak = 0 OR day_streak IS NULL);
  END IF;

  -- Update longest streak if current streak is longer
  UPDATE users 
  SET longest_streak = day_streak
  WHERE id = NEW.user_id AND day_streak > COALESCE(longest_streak, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;