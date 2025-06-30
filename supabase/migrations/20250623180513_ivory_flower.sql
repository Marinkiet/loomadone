/*
  # Create users table for LoomaLearn

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users id
      - `full_name` (text) - user's full name
      - `email` (text) - user's email address
      - `grade` (text) - user's grade level (e.g., "Grade 10")
      - `subjects` (text[]) - array of subjects user is studying
      - `profile_image` (text) - URL to profile image
      - `created_at` (timestamp) - when the record was created
      - `updated_at` (timestamp) - when the record was last updated

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read and update their own data
    - Add policy for users to insert their own data during registration
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text,
  grade text,
  subjects text[],
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();