/*
  # Fix Day Streak Calculation

  1. Changes
    - Create a new function to properly calculate user day streaks
    - Update the update_study_stats function to use the new calculation
    - Add a daily function to update all users' streaks

  2. Details
    - The current implementation doesn't properly track consecutive days
    - This migration adds a more accurate streak calculation based on daily activity
    - It also adds a function to update streaks for all users that can be called daily
*/

-- Create function to calculate a user's current streak
CREATE OR REPLACE FUNCTION calculate_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  _current_streak INTEGER := 0;
  _last_activity_date DATE;
  _check_date DATE := CURRENT_DATE;
  _has_activity BOOLEAN;
BEGIN
  -- Get the most recent activity date
  SELECT MAX(date) INTO _last_activity_date
  FROM study_log
  WHERE user_id = user_uuid;
  
  -- If no activity found, return 0
  IF _last_activity_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- If the most recent activity is not today or yesterday, reset streak
  IF _last_activity_date < (CURRENT_DATE - INTERVAL '1 day') THEN
    RETURN 0;
  END IF;
  
  -- Count consecutive days with activity, starting from the most recent day
  WHILE _check_date >= (_last_activity_date - INTERVAL '30 days') LOOP
    -- Check if there's activity on this date
    SELECT EXISTS (
      SELECT 1 FROM study_log 
      WHERE user_id = user_uuid AND date = _check_date
    ) INTO _has_activity;
    
    -- If there's activity, increment streak
    IF _has_activity THEN
      _current_streak := _current_streak + 1;
      _check_date := _check_date - INTERVAL '1 day';
    ELSE
      -- Break the loop if we find a day without activity
      EXIT;
    END IF;
  END LOOP;
  
  RETURN _current_streak;
END;
$$ LANGUAGE plpgsql;

-- Update the update_study_stats function to use the new calculation
CREATE OR REPLACE FUNCTION update_study_stats()
RETURNS TRIGGER AS $$
DECLARE
  _rounded_time FLOAT;
  _current_streak INTEGER;
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

  -- Calculate current streak
  _current_streak := calculate_user_streak(NEW.user_id);
  
  -- Update user's streak
  UPDATE users 
  SET day_streak = _current_streak
  WHERE id = NEW.user_id;

  -- Update longest streak if current streak is longer
  UPDATE users 
  SET longest_streak = GREATEST(COALESCE(longest_streak, 0), _current_streak)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update all users' streaks (can be called daily)
CREATE OR REPLACE FUNCTION update_all_user_streaks()
RETURNS VOID AS $$
DECLARE
  _user_record RECORD;
  _current_streak INTEGER;
BEGIN
  -- Loop through all users
  FOR _user_record IN SELECT id FROM users LOOP
    -- Calculate current streak
    _current_streak := calculate_user_streak(_user_record.id);
    
    -- Update user's streak
    UPDATE users 
    SET 
      day_streak = _current_streak,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), _current_streak)
    WHERE id = _user_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update all users' streaks immediately
SELECT update_all_user_streaks();