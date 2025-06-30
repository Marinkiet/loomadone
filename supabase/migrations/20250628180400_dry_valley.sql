/*
  # Fix Database Column Reference Errors

  1. Changes
    - Fix ambiguous "topic_id" column reference in update_topic_progress_and_unlock function
    - Update references to "total_points" to use "looma_cells" in users table
    - Fix ambiguous column references in sync_study_sessions_to_log function
    - Ensure user_stats table uses looma_cells column instead of total_points

  This migration addresses the following errors:
  - "column reference "topic_id" is ambiguous"
  - "column "total_points" of relation "users" does not exist"
*/

-- Fix the update_user_stats_on_game_completion function to use looma_cells instead of total_points
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

  -- Also update the user's looma_cells in the users table
  UPDATE users
  SET looma_cells = COALESCE(looma_cells, 0) + NEW.points_earned
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the sync_study_sessions_to_log function to avoid ambiguous column references
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

-- Fix the update_topic_progress_and_unlock function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION update_topic_progress_and_unlock()
RETURNS TRIGGER AS $$
DECLARE
  current_topic_id uuid;
  next_topic_id uuid;
  has_completed boolean;
BEGIN
  -- Get the topic ID from the progress record
  current_topic_id := NEW.topic_id;
  
  -- Check if user has completed enough games
  has_completed := has_completed_required_games(NEW.user_id, current_topic_id);
  
  -- If progress is marked as completed and user has completed enough games
  IF NEW.status = 'completed' AND has_completed THEN
    -- Find the next topic to unlock
    next_topic_id := get_next_topic(current_topic_id);
    
    -- If there is a next topic, update its status to 'not_started'
    IF next_topic_id IS NOT NULL THEN
      UPDATE topics
      SET status = 'not_started'
      WHERE id = next_topic_id;
      
      -- Create a progress entry for the newly unlocked topic
      INSERT INTO user_topic_progress (user_id, topic_id, status, progress_percentage)
      VALUES (NEW.user_id, next_topic_id, 'not_started', 0)
      ON CONFLICT (user_id, topic_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_study_stats function to use looma_cells instead of total_points
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

-- Ensure user_stats table has looma_cells column instead of total_points
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_stats' AND column_name = 'total_points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_stats' AND column_name = 'looma_cells'
  ) THEN
    ALTER TABLE user_stats RENAME COLUMN total_points TO looma_cells;
  END IF;
END $$;