/*
  # Fix Column References in Triggers and Functions

  1. Changes
    - Fix ambiguous column reference for "topic_id" in update_topic_progress_and_unlock function
    - Update references to "total_points" to use "looma_cells" in user_stats_on_game_completion function
    - Fix column reference in user_weekly_study view to include proper GROUP BY clause

  2. Details
    - These changes address database errors that were occurring due to column name changes
    - The "total_points" column was renamed to "looma_cells" but some functions still referenced the old name
    - The "topic_id" column was ambiguous in some queries
    - The user_weekly_study view had a GROUP BY clause issue
*/

-- Fix the update_user_stats_on_game_completion function to use looma_cells instead of total_points
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

  -- Also update the user's looma_cells in the users table
  UPDATE users
  SET looma_cells = COALESCE(looma_cells, 0) + NEW.points_earned
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_topic_progress_and_unlock function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION update_topic_progress_and_unlock()
RETURNS TRIGGER AS $$
DECLARE
  topic_id uuid;
  next_topic_id uuid;
  has_completed boolean;
BEGIN
  -- Get the topic ID from the progress record
  topic_id := NEW.topic_id;
  
  -- Check if user has completed enough games
  has_completed := has_completed_required_games(NEW.user_id, topic_id);
  
  -- If progress is marked as completed and user has completed enough games
  IF NEW.status = 'completed' AND has_completed THEN
    -- Find the next topic to unlock
    next_topic_id := get_next_topic(topic_id);
    
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

-- Fix the user_weekly_study view to include proper GROUP BY clause
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

-- Fix the has_completed_required_games function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION has_completed_required_games(user_uuid uuid, topic_uuid uuid)
RETURNS boolean AS $$
DECLARE
  completed_games integer;
  topic_subtopic_key text;
  topic_subject text;
BEGIN
  -- Get the topic's subtopic_key and subject
  SELECT t.subtopic_key, s.name
  INTO topic_subtopic_key, topic_subject
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  WHERE t.id = topic_uuid;
  
  -- Count completed game sessions for this topic
  SELECT COUNT(*)
  INTO completed_games
  FROM user_game_sessions ugs
  WHERE ugs.user_id = user_uuid
    AND ugs.topic = topic_subtopic_key
    AND ugs.subject = topic_subject;
    
  -- Return true if user has completed at least 10 games
  RETURN completed_games >= 10;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_topic_progress_after_game function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION update_topic_progress_after_game()
RETURNS TRIGGER AS $$
DECLARE
  topic_id uuid;
  current_progress integer;
  topic_subtopic_key text;
  completed_games integer;
  progress_percentage integer;
BEGIN
  -- Get the topic ID from the subtopic_key
  SELECT t.id, t.subtopic_key
  INTO topic_id, topic_subtopic_key
  FROM topics t
  JOIN subjects s ON t.subject_id = s.id
  WHERE t.subtopic_key = NEW.topic
    AND s.name = NEW.subject;
  
  -- If topic found, update progress
  IF topic_id IS NOT NULL THEN
    -- Count completed games for this topic
    SELECT COUNT(*)
    INTO completed_games
    FROM user_game_sessions ugs
    WHERE ugs.user_id = NEW.user_id
      AND ugs.topic = topic_subtopic_key
      AND ugs.subject = NEW.subject;
    
    -- Calculate progress percentage (10 games = 100%)
    progress_percentage := LEAST(100, (completed_games * 10));
    
    -- Update or insert progress record
    INSERT INTO user_topic_progress (
      user_id, 
      topic_id, 
      status, 
      progress_percentage
    )
    VALUES (
      NEW.user_id,
      topic_id,
      CASE 
        WHEN progress_percentage >= 100 THEN 'completed'
        WHEN progress_percentage > 0 THEN 'in_progress'
        ELSE 'not_started'
      END,
      progress_percentage
    )
    ON CONFLICT (user_id, topic_id)
    DO UPDATE SET
      status = CASE 
        WHEN progress_percentage >= 100 THEN 'completed'
        WHEN progress_percentage > 0 THEN 'in_progress'
        ELSE 'not_started'
      END,
      progress_percentage = progress_percentage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;