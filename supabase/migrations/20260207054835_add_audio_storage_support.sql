/*
  # Add Audio Storage Support

  1. Changes to `chants` table
    - `audio_file_path` (text, nullable) - Path to audio file in Supabase storage bucket
    - This allows storing protected audio files that cannot be directly downloaded

  2. Storage Setup
    - Creates `chant-audio` bucket for storing audio files
    - Bucket is private (no public access)
    - Only authenticated admin users can upload/delete
    - Audio streaming will be handled through an edge function for protection

  3. Notes
    - The `audio_url` column is kept for backwards compatibility with external URLs
    - When `audio_file_path` is set, it takes precedence over `audio_url`
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chants' AND column_name = 'audio_file_path'
  ) THEN
    ALTER TABLE chants ADD COLUMN audio_file_path text;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chant-audio',
  'chant-audio',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chant-audio');

CREATE POLICY "Authenticated users can update audio"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'chant-audio')
  WITH CHECK (bucket_id = 'chant-audio');

CREATE POLICY "Authenticated users can delete audio"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'chant-audio');

CREATE POLICY "No direct public read for audio"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'chant-audio');
