/*
  # Create Subjects and Topics Tables

  1. New Tables
    - `subjects`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `color` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `topics`
      - `id` (uuid, primary key)
      - `subject_id` (uuid, foreign key to subjects)
      - `title` (text)
      - `name` (text)
      - `description` (text)
      - `status` (text)
      - `position_x` (integer)
      - `position_y` (integer)
      - `subtopic_key` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read subjects and topics
    - Add policies for admins to manage subjects and topics
*/

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'locked',
  position_x integer NOT NULL,
  position_y integer NOT NULL,
  subtopic_key text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_topic_progress table to track user progress
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started',
  progress_percentage integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for subjects
CREATE POLICY "Anyone can read subjects"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert subjects"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update subjects"
  ON subjects
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for topics
CREATE POLICY "Anyone can read topics"
  ON topics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert topics"
  ON topics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update topics"
  ON topics
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policies for user_topic_progress
CREATE POLICY "Users can read their own progress"
  ON user_topic_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_topic_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_topic_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_topic_progress_updated_at
  BEFORE UPDATE ON user_topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial subject data
INSERT INTO subjects (name, description, icon, color)
VALUES
  ('Mathematics', 'Explore the world of numbers, patterns, and problem-solving', 'calculator', '#8B5CF6'),
  ('Mathematical Literacy', 'Apply mathematical concepts to everyday situations', 'stats-chart', '#7C3AED'),
  ('Life Sciences', 'Study living organisms and their interactions with the environment', 'leaf', '#10B981'),
  ('Natural Sciences', 'Discover the fundamental principles of the natural world', 'flask', '#10B981'),
  ('English Home Language', 'Master language skills and literary analysis', 'book', '#3B82F6'),
  ('Physical Sciences', 'Understand the laws of physics and chemistry', 'planet', '#F59E0B'),
  ('Afrikaans First Additional Language', 'Learn Afrikaans as a second language', 'language', '#F59E0B'),
  ('Business Studies', 'Explore business concepts and entrepreneurship', 'briefcase', '#059669'),
  ('Life Orientation', 'Develop life skills and personal well-being', 'compass', '#DC2626')
ON CONFLICT (name) DO NOTHING;

-- Insert initial topic data for Mathematics
DO $$
DECLARE
  math_id uuid;
BEGIN
  SELECT id INTO math_id FROM subjects WHERE name = 'Mathematics';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (math_id, 'Algebra Intro', 'Number Nexus', 'Master the fundamentals of algebra and unlock the secrets of variables!', 'not_started', 120, 200, 'algebra-intro'),
      (math_id, 'Quadratic Equations', 'Equation Empire', 'Solve complex quadratic equations and become the ruler of polynomials!', 'locked', 250, 350, 'quadratic-equations'),
      (math_id, 'Geometry Basics', 'Shape Sanctuary', 'Discover the beauty of shapes, angles, and spatial relationships!', 'locked', 180, 500, 'geometry-basics'),
      (math_id, 'Trigonometry', 'Triangle Temple', 'Unlock the mysteries of sine, cosine, and tangent functions!', 'locked', 320, 650, 'trigonometry')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Insert initial topic data for Life Sciences
DO $$
DECLARE
  bio_id uuid;
BEGIN
  SELECT id INTO bio_id FROM subjects WHERE name = 'Life Sciences';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (bio_id, 'Cell Structure', 'The Cell Lab', 'Dive into the microscopic world and discover cellular mysteries!', 'not_started', 150, 180, 'cell-structure'),
      (bio_id, 'Photosynthesis', 'Green Gardens', 'Learn how plants convert sunlight into energy through photosynthesis!', 'locked', 280, 320, 'photosynthesis'),
      (bio_id, 'Human Body Systems', 'Body Boulevard', 'Explore the complex systems that keep the human body functioning!', 'locked', 200, 480, 'human-body-systems')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;

-- Insert initial topic data for English Home Language
DO $$
DECLARE
  eng_id uuid;
BEGIN
  SELECT id INTO eng_id FROM subjects WHERE name = 'English Home Language';
  
  IF FOUND THEN
    INSERT INTO topics (subject_id, title, name, description, status, position_x, position_y, subtopic_key)
    VALUES
      (eng_id, 'Grammar Fundamentals', 'Grammar Grove', 'Master the building blocks of language and perfect your writing!', 'not_started', 140, 220, 'grammar-fundamentals'),
      (eng_id, 'Poetry Analysis', 'Verse Valley', 'Decode the hidden meanings and beauty within poetic verses!', 'locked', 260, 380, 'poetry-analysis'),
      (eng_id, 'Creative Writing', 'Story Summit', 'Craft compelling narratives and bring your imagination to life!', 'locked', 190, 520, 'creative-writing')
    ON CONFLICT (subtopic_key) DO NOTHING;
  END IF;
END $$;