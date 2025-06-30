/*
  # Fix Day Streak Calculation and Leaderboard Entry Issues

  1. Changes
    - Improve day streak calculation to accurately track consecutive days of activity
    - Fix leaderboard entry upsert function to properly handle duplicate key constraints
    - Add function to recalculate all user streaks

  2. Details
    - The current day streak calculation doesn't properly track consecutive days
    - The leaderboard entry upsert function has issues with the unique constraint
    - This migration addresses both issues with improved functions
*/

-- Create function to calculate a user's current streak more accurately
CREATE OR REPLACE FUNCTION calculate_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  _current_streak INTEGER := 0;
  _last_activity_date DATE;
  _check_date DATE;
  _has_activity BOOLEAN;
  _yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  _today DATE := CURRENT_DATE;
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
  IF _last_activity_date < _yesterday THEN
    RETURN 0;
  END IF;
  
  -- Start checking from the most recent activity date
  _check_date := _last_activity_date;
  
  -- Count consecutive days with activity, going backwards
  LOOP
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

-- Update the update_study_stats function to use the improved calculation
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

  -- Calculate current streak using the improved function
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

-- Create function to update all users' streaks (can be run daily)
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

-- Improve the leaderboard entry upsert function to handle constraints better
CREATE OR REPLACE FUNCTION upsert_leaderboard_entry(
  user_uuid UUID,
  entry_category TEXT,
  points_earned INTEGER,
  period_start_date DATE DEFAULT NULL,
  period_end_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  entry_id UUID;
  calculated_period_start DATE;
  update_count INTEGER;
BEGIN
  -- Calculate period_start if not provided
  IF period_start_date IS NULL THEN
    CASE entry_category
      WHEN 'weekly' THEN
        calculated_period_start := date_trunc('week', CURRENT_DATE)::DATE;
      WHEN 'monthly' THEN
        calculated_period_start := date_trunc('month', CURRENT_DATE)::DATE;
      ELSE
        calculated_period_start := NULL;
    END CASE;
  ELSE
    calculated_period_start := period_start_date;
  END IF;

  -- Try to update existing entry first
  UPDATE leaderboard_entries
  SET 
    points = points + points_earned,
    updated_at = NOW()
  WHERE 
    user_id = user_uuid AND 
    category = entry_category AND
    (
      (calculated_period_start IS NULL AND period_start IS NULL) OR
      period_start = calculated_period_start
    )
  RETURNING id INTO entry_id;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;

  -- If no existing entry was updated, insert a new one
  IF update_count = 0 THEN
    BEGIN
      INSERT INTO leaderboard_entries (
        user_id,
        category,
        points,
        period_start,
        period_end,
        updated_at
      ) VALUES (
        user_uuid,
        entry_category,
        points_earned,
        calculated_period_start,
        period_end_date,
        NOW()
      )
      RETURNING id INTO entry_id;
    EXCEPTION WHEN unique_violation THEN
      -- If we hit a unique violation, try updating again (race condition)
      UPDATE leaderboard_entries
      SET 
        points = points + points_earned,
        updated_at = NOW()
      WHERE 
        user_id = user_uuid AND 
        category = entry_category AND
        (
          (calculated_period_start IS NULL AND period_start IS NULL) OR
          period_start = calculated_period_start
        )
      RETURNING id INTO entry_id;
    END;
  END IF;

  RETURN entry_id;
END;
$$ LANGUAGE plpgsql;

-- Update all users' streaks immediately to fix any incorrect values
SELECT update_all_user_streaks();