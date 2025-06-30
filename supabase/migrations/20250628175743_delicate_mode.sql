/*
  # Fix user stats and game sessions

  1. Changes
     - Rename "total_points" to "looma_cells" in user_stats table to match users table
     - Fix ambiguous column reference in study_sessions trigger function
     - Update user_stats_on_game_completion trigger function to use looma_cells instead of total_points

  2. Security
     - No security changes
*/

-- Fix ambiguous column reference in sync_study_sessions_to_log function
CREATE OR REPLACE FUNCTION sync_study_sessions_to_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO study_log (
    user_id,
    subject,
    topic,
    time_spent,
    date,
    score
  )
  VALUES (
    NEW.user_id,
    (SELECT name FROM subjects WHERE id = (SELECT subject_id FROM topics WHERE topics.id = NEW.topic_id)),
    (SELECT name FROM topics WHERE topics.id = NEW.topic_id),
    NEW.duration_minutes / 60.0,
    CURRENT_DATE,
    NEW.points_earned
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix user_stats table to use looma_cells instead of total_points
ALTER TABLE user_stats RENAME COLUMN total_points TO looma_cells;

-- Update update_user_stats_on_game_completion function to use looma_cells
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
    CASE WHEN NEW.questions_attempted > 0 THEN 
      NEW.questions_correct::float / NEW.questions_attempted 
    ELSE 0 END,
    NEW.duration_seconds
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    looma_cells = user_stats.looma_cells + NEW.points_earned,
    games_played = user_stats.games_played + 1,
    correct_ratio = (user_stats.correct_ratio * user_stats.games_played + 
                    CASE WHEN NEW.questions_attempted > 0 THEN 
                      NEW.questions_correct::float / NEW.questions_attempted 
                    ELSE 0 END) / (user_stats.games_played + 1),
    total_time_spent = user_stats.total_time_spent + NEW.duration_seconds;

  -- Update user's looma_cells
  UPDATE users
  SET looma_cells = COALESCE(looma_cells, 0) + NEW.points_earned
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;