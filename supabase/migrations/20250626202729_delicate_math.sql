/*
  # Update Topic Progression Logic

  1. Changes
    - Add function to check if a user has completed 10 interactive games for a topic
    - Update topic unlocking logic to require 10 completed games
    - Add trigger to automatically unlock next topic when requirements are met

  2. Security
    - Maintain existing RLS policies
*/

-- Create function to check if a user has completed enough games for a topic
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
  FROM user_game_sessions
  WHERE user_id = user_uuid
    AND topic = topic_subtopic_key
    AND subject = topic_subject;
    
  -- Return true if user has completed at least 10 games
  RETURN completed_games >= 10;
END;
$$ LANGUAGE plpgsql;

-- Create function to get the next topic in sequence
CREATE OR REPLACE FUNCTION get_next_topic(current_topic_uuid uuid)
RETURNS uuid AS $$
DECLARE
  subject_id uuid;
  current_position_y integer;
  next_topic_id uuid;
BEGIN
  -- Get the current topic's subject and position
  SELECT t.subject_id, t.position_y
  INTO subject_id, current_position_y
  FROM topics t
  WHERE t.id = current_topic_uuid;
  
  -- Find the next topic with higher position_y
  SELECT id
  INTO next_topic_id
  FROM topics
  WHERE subject_id = subject_id
    AND position_y > current_position_y
    AND status = 'locked'
  ORDER BY position_y
  LIMIT 1;
  
  RETURN next_topic_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update topic progress and unlock next topic
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

-- Create trigger to update topic progress and unlock next topic
CREATE TRIGGER update_topic_progress_trigger
  AFTER UPDATE ON user_topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_progress_and_unlock();

-- Create function to update topic progress after game session
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
    FROM user_game_sessions
    WHERE user_id = NEW.user_id
      AND topic = topic_subtopic_key
      AND subject = NEW.subject;
    
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

-- Create trigger to update topic progress after game session
CREATE TRIGGER update_topic_progress_after_game_trigger
  AFTER INSERT ON user_game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_progress_after_game();