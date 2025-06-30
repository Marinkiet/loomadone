/*
  # Add User Content Storage Support

  1. New Tables
    - `user_content`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - content title
      - `type` (text) - 'image', 'pdf', 'audio'
      - `subject` (text) - subject category
      - `description` (text) - optional description
      - `file_url` (text) - URL to the file
      - `thumbnail_url` (text) - URL to thumbnail (for images)
      - `file_size` (text) - formatted file size
      - `upload_date` (date) - date uploaded
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Users can only access their own content
    - Appropriate policies for content management
*/

-- Create user_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'pdf', 'audio')),
  subject text NOT NULL,
  description text,
  file_url text NOT NULL,
  thumbnail_url text,
  file_size text NOT NULL,
  upload_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;

-- Create policies for user_content only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_content' AND policyname = 'Users can view their own content'
  ) THEN
    CREATE POLICY "Users can view their own content"
      ON user_content
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_content' AND policyname = 'Users can insert their own content'
  ) THEN
    CREATE POLICY "Users can insert their own content"
      ON user_content
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_content' AND policyname = 'Users can update their own content'
  ) THEN
    CREATE POLICY "Users can update their own content"
      ON user_content
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_content' AND policyname = 'Users can delete their own content'
  ) THEN
    CREATE POLICY "Users can delete their own content"
      ON user_content
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create storage bucket for user content if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('user_content', 'user_content', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create storage policy using the correct approach
-- Instead of querying storage.policies directly, we'll use a different approach
DO $$
DECLARE
  count_policies integer;
BEGIN
  -- Check if the policy already exists using a different method
  SELECT COUNT(*) INTO count_policies 
  FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects' 
  AND policyname = 'User Content Upload Policy';
  
  -- Only create the policy if it doesn't exist
  IF count_policies = 0 THEN
    -- Create policy for storage.objects table
    CREATE POLICY "User Content Upload Policy" 
    ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
      bucket_id = 'user_content' AND 
      auth.uid()::text = SPLIT_PART(name, '/', 1)
    );
  END IF;
END $$;

-- Create function to get content by date
CREATE OR REPLACE FUNCTION get_user_content_by_date(user_uuid uuid, date_param date)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'type', type,
      'subject', subject,
      'description', description,
      'file_url', file_url,
      'thumbnail_url', thumbnail_url,
      'file_size', file_size,
      'upload_date', upload_date
    )
  ) INTO result
  FROM user_content
  WHERE user_id = user_uuid
    AND upload_date = date_param
  ORDER BY created_at DESC;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create function to get content by subject
CREATE OR REPLACE FUNCTION get_user_content_by_subject(user_uuid uuid, subject_param text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'type', type,
      'subject', subject,
      'description', description,
      'file_url', file_url,
      'thumbnail_url', thumbnail_url,
      'file_size', file_size,
      'upload_date', upload_date
    )
  ) INTO result
  FROM user_content
  WHERE user_id = user_uuid
    AND subject = subject_param
  ORDER BY upload_date DESC, created_at DESC;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create function to get dates with content
CREATE OR REPLACE FUNCTION get_user_content_dates(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(DISTINCT upload_date)
  INTO result
  FROM user_content
  WHERE user_id = user_uuid
  ORDER BY upload_date DESC;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;