/*
  # Fix Database Functions and Column References

  1. Changes
    - Fix ambiguous column references in sync_study_sessions_to_log function
    - Fix column references in update_user_stats_on_game_completion function
    - Fix column references in update_study_stats function
    - Fix column references in update_topic_progress_after_game function
    - Fix column references in has_completed_required_games function

  This migration addresses the following errors:
  - "column reference \"topic_id\" is ambiguous"
  - "column \"total_points\" of relation \"users\" does not exist"
*/

-- Fix the sync_study_sessions_to_log function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION sync_study_sessions_to_log()
RETURNS TRIGGER AS $$
DECLARE
  _topic_id uuid;
  _subject_name text;
  _topic_name text;
  _hours_spent float;
BEGIN
  -- Store topic_id in local variable to avoid ambiguity
  _topic_id := NEW.topic_id;
  
  -- Get topic and subject names using explicit table aliases
  SELECT t.name, s.name 
  INTO _topic_name, _subject_name
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  WHERE t.id = _topic_id;

  -- Convert minutes to hours
  _hours_spent := NEW.duration_minutes / 60.0;

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
    _subject_name,
    _topic_name,
    _hours_spent,
    CURRENT_DATE,
    NEW.points_earned
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_user_stats_on_game_completion function to use looma_cells
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

  -- Update the user's looma_cells in the users table
  UPDATE users
  SET looma_cells = COALESCE(looma_cells, 0) + NEW.points_earned
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_topic_progress_after_game function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION update_topic_progress_after_game()
RETURNS TRIGGER AS $$
DECLARE
  _topic_id uuid;
  _topic_subtopic_key text;
  _completed_games integer;
  _progress_percentage integer;
BEGIN
  -- Get the topic ID from the subtopic_key using explicit table aliases
  SELECT t.id, t.subtopic_key
  INTO _topic_id, _topic_subtopic_key
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  WHERE t.subtopic_key = NEW.topic
    AND s.name = NEW.subject;
  
  -- If topic found, update progress
  IF _topic_id IS NOT NULL THEN
    -- Count completed games for this topic
    SELECT COUNT(*)
    INTO _completed_games
    FROM user_game_sessions ugs
    WHERE ugs.user_id = NEW.user_id
      AND ugs.topic = _topic_subtopic_key
      AND ugs.subject = NEW.subject;
    
    -- Calculate progress percentage (10 games = 100%)
    _progress_percentage := LEAST(100, (_completed_games * 10));
    
    -- Update or insert progress record
    INSERT INTO user_topic_progress (
      user_id, 
      topic_id, 
      status, 
      progress_percentage
    )
    VALUES (
      NEW.user_id,
      _topic_id,
      CASE 
        WHEN _progress_percentage >= 100 THEN 'completed'
        WHEN _progress_percentage > 0 THEN 'in_progress'
        ELSE 'not_started'
      END,
      _progress_percentage
    )
    ON CONFLICT (user_id, topic_id)
    DO UPDATE SET
      status = CASE 
        WHEN _progress_percentage >= 100 THEN 'completed'
        WHEN _progress_percentage > 0 THEN 'in_progress'
        ELSE 'not_started'
      END,
      progress_percentage = _progress_percentage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the has_completed_required_games function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION has_completed_required_games(user_uuid uuid, topic_uuid uuid)
RETURNS boolean AS $$
DECLARE
  _completed_games integer;
  _topic_subtopic_key text;
  _topic_subject text;
BEGIN
  -- Get the topic's subtopic_key and subject using explicit table aliases
  SELECT t.subtopic_key, s.name
  INTO _topic_subtopic_key, _topic_subject
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  WHERE t.id = topic_uuid;
  
  -- Count completed game sessions for this topic
  SELECT COUNT(*)
  INTO _completed_games
  FROM user_game_sessions ugs
  WHERE ugs.user_id = user_uuid
    AND ugs.topic = _topic_subtopic_key
    AND ugs.subject = _topic_subject;
    
  -- Return true if user has completed at least 10 games
  RETURN _completed_games >= 10;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_study_stats function to use day_streak and looma_cells
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

  -- Update user's looma cells based on score
  UPDATE users 
  SET looma_cells = COALESCE(looma_cells, 0) + NEW.score
  WHERE id = NEW.user_id;

  -- Check if user studied yesterday to maintain streak
  SELECT EXISTS (
    SELECT 1 FROM study_log 
    WHERE user_id = NEW.user_id AND date = _yesterday_date
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

-- Ensure user_stats table has looma_cells column instead of total_points
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'total_points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'looma_cells'
  ) THEN
    ALTER TABLE user_stats RENAME COLUMN total_points TO looma_cells;
  END IF;
END $$;