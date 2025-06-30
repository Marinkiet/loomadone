/*
  # Add Timetable Support Tables

  1. New Tables
    - `user_timetables`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - timetable name
      - `type` (text) - 'weekly' or 'rotating'
      - `is_active` (boolean) - current active timetable
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `timetable_slots`
      - `id` (uuid, primary key)
      - `timetable_id` (uuid, foreign key to user_timetables)
      - `day` (text) - day name or number
      - `time_slot` (text) - time range
      - `subject_name` (text) - subject name
      - `teacher_name` (text) - optional teacher name
      - `room` (text) - optional room number
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own timetables
*/

-- Create user_timetables table
CREATE TABLE IF NOT EXISTS user_timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Timetable',
  type text NOT NULL CHECK (type IN ('weekly', 'rotating')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create timetable_slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id uuid REFERENCES user_timetables(id) ON DELETE CASCADE,
  day text NOT NULL,
  time_slot text NOT NULL,
  subject_name text NOT NULL,
  teacher_name text,
  room text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for user_timetables
CREATE POLICY "Users can manage their own timetables"
  ON user_timetables
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for timetable_slots
CREATE POLICY "Users can manage their own timetable slots"
  ON timetable_slots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_timetables 
      WHERE id = timetable_slots.timetable_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_timetables 
      WHERE id = timetable_slots.timetable_id 
      AND user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_user_timetables_updated_at
  BEFORE UPDATE ON user_timetables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();