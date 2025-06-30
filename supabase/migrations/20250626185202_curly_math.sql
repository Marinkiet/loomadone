/*
  # Add AI Interactive Games Support

  1. New Tables
    - `ai_game_questions`
      - `id` (uuid, primary key)
      - `subject` (text) - subject name
      - `topic` (text) - topic name
      - `question` (text) - question text
      - `options` (jsonb) - answer options for multiple choice
      - `correct_answer` (text) - correct answer
      - `type` (text) - 'multiple_choice' or 'true_false'
      - `created_by` (text) - 'gpt' or user id
      - `created_at` (timestamp)
    
    - `user_game_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `subject` (text) - subject name
      - `topic` (text) - topic name
      - `points_earned` (integer) - points earned in session
      - `questions_attempted` (integer) - total questions attempted
      - `questions_correct` (integer) - correctly answered questions
      - `questions_wrong` (integer) - incorrectly answered questions
      - `duration_seconds` (integer) - session duration
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Appropriate access policies for game data
*/

-- Create ai_game_questions table
CREATE TABLE IF NOT EXISTS ai_game_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  topic text NOT NULL,
  question text NOT NULL,
  options jsonb DEFAULT NULL,
  correct_answer text NOT NULL,
  type text NOT NULL CHECK (type IN ('multiple_choice', 'true_false')),
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_game_sessions table
CREATE TABLE IF NOT EXISTS user_game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  points_earned integer DEFAULT 0,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  questions_wrong integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- Create user_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  games_played integer DEFAULT 0,
  correct_ratio float DEFAULT 0,
  total_time_spent integer DEFAULT 0,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE ai_game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Policies for ai_game_questions
CREATE POLICY "Anyone can read game questions"
  ON ai_game_questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert game questions"
  ON ai_game_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR created_by = 'gpt');

-- Policies for user_game_sessions
CREATE POLICY "Users can view their own game sessions"
  ON user_game_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game sessions"
  ON user_game_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON user_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update user stats when a game session is completed
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

  -- Also update the user's total points in the users table
  UPDATE users
  SET total_points = total_points + NEW.points_earned
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user stats when a game session is completed
CREATE TRIGGER update_user_stats_on_game_completion_trigger
  AFTER INSERT ON user_game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_game_completion();

-- Insert sample questions for testing
INSERT INTO ai_game_questions (subject, topic, question, options, correct_answer, type, created_by)
VALUES
  -- Mathematics - Number Systems
  ('Mathematics', 'Number Systems', 'Which of the following is an irrational number?', 
   '[{"id": "A", "text": "0.75"}, {"id": "B", "text": "√2"}, {"id": "C", "text": "22/7"}, {"id": "D", "text": "-5"}]', 
   'B', 'multiple_choice', 'system'),
  
  ('Mathematics', 'Number Systems', 'Every rational number can be expressed as a fraction where the numerator and denominator are integers.', 
   NULL, 
   'True', 'true_false', 'system'),
  
  -- Life Sciences - Cell Biology
  ('Life Sciences', 'Cell Biology', 'Which organelle is responsible for protein synthesis in a cell?', 
   '[{"id": "A", "text": "Mitochondria"}, {"id": "B", "text": "Nucleus"}, {"id": "C", "text": "Ribosome"}, {"id": "D", "text": "Golgi apparatus"}]', 
   'C', 'multiple_choice', 'system'),
  
  ('Life Sciences', 'Cell Biology', 'Plant cells have cell walls while animal cells do not.', 
   NULL, 
   'True', 'true_false', 'system'),
  
  -- English Home Language - Grammar Fundamentals
  ('English Home Language', 'Grammar Fundamentals', 'Which of the following is a proper noun?', 
   '[{"id": "A", "text": "happiness"}, {"id": "B", "text": "Cape Town"}, {"id": "C", "text": "beautiful"}, {"id": "D", "text": "quickly"}]', 
   'B', 'multiple_choice', 'system'),
  
  ('English Home Language', 'Grammar Fundamentals', 'Adverbs can modify verbs, adjectives, and other adverbs.', 
   NULL, 
   'True', 'true_false', 'system')
ON CONFLICT DO NOTHING;