/*
  # Fix Column References in Queries and Triggers

  1. Changes
    - Fix column references in user_weekly_study view
    - Fix column references in get_user_learning_history function
    - Update column references from total_points to looma_cells
    - Update column references from current_streak to day_streak

  This migration addresses SQL errors related to ambiguous column references and
  ensures all functions and views use the correct column names.
*/

-- Fix the user_weekly_study view to properly group by day
DROP VIEW IF EXISTS user_weekly_study;
CREATE VIEW user_weekly_study AS
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

-- Fix the get_user_learning_history function to properly group results
CREATE OR REPLACE FUNCTION get_user_learning_history(user_uuid uuid, limit_count integer DEFAULT 20)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', sl.id,
      'date', to_char(sl.date, 'YYYY-MM-DD'),
      'subject', sl.subject,
      'topic', sl.topic,
      'time_spent', sl.time_spent,
      'performance_score', sl.score
    )
  ) INTO result
  FROM study_log sl
  WHERE sl.user_id = user_uuid
  ORDER BY sl.date DESC, sl.created_at DESC
  LIMIT limit_count;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Update the update_user_stats_on_game_completion function to use looma_cells
CREATE OR REPLACE FUNCTION update_user_stats_on_game_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO user_stats (
    user_id,
    total_points,
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
    total_points = user_stats.total_points + NEW.points_earned,
    games_played = user_stats.games_played + 1,
    correct_ratio = (
      (user_stats.correct_ratio * user_stats.games_played) + 
      (CASE WHEN NEW.questions_attempted > 0 
        THEN NEW.questions_correct::float / NEW.questions_attempted 
        ELSE 0 
      END)
    ) / (user_stats.games_played + 1),
    total_time_spent = user_stats.total_time_spent + NEW.duration_seconds;

  -- Update the user's looma_cells in the users table
  UPDATE users
  SET looma_cells = COALESCE(looma_cells, 0) + NEW.points_earned
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the update_study_stats function to use day_streak instead of current_streak
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
  SET total_study_time = COALESCE(total_study_time, 0) + rounded_time
  WHERE id = NEW.user_id;

  -- Update user's looma cells based on score
  UPDATE users 
  SET looma_cells = COALESCE(looma_cells, 0) + NEW.score
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