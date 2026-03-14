/*
  # Create chant-images storage bucket

  1. Storage
    - Creates a public `chant-images` bucket for chant artwork
    - Max file size: 5MB
    - Allowed types: JPEG, PNG, WebP, GIF

  2. Security
    - Authenticated users can upload images
    - Public read access for all images
    - Authenticated users can delete images (for cleanup on re-upload)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chant-images',
  'chant-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload chant images'
  ) THEN
    CREATE POLICY "Authenticated users can upload chant images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'chant-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Public can view chant images'
  ) THEN
    CREATE POLICY "Public can view chant images"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'chant-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated users can delete chant images'
  ) THEN
    CREATE POLICY "Authenticated users can delete chant images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'chant-images');
  END IF;
END $$;
