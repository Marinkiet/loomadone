/*
  # Fix Leaderboard Entry Duplicate Key Error

  1. Changes
    - Create a robust upsert_leaderboard_entry function that properly handles the unique constraint
    - Function calculates period start dates based on category if not provided
    - Properly updates existing entries by adding points instead of replacing them
    - Returns the entry ID for confirmation

  2. Details
    - This migration addresses the error: "duplicate key value violates unique constraint leaderboard_entries_user_id_category_period_start_key"
    - The function first attempts to update an existing entry
    - Only creates a new entry if one doesn't exist
    - Handles all edge cases including NULL period_start values
*/

-- Create function to safely upsert leaderboard entries
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
  END IF;

  RETURN entry_id;
END;
$$ LANGUAGE plpgsql;