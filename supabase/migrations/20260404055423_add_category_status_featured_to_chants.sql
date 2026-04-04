/*
  # Add category, status, and featured columns to chants

  1. New Columns
    - `category` (text) - Categorizes chants (e.g., Vaishnavism, Shaivism)
    - `status` (text) - Publication status: draft, published, archived. Default: published
    - `featured` (boolean) - Whether chant appears in hero carousel. Default: false
    - `updated_at` (timestamptz) - Last update timestamp

  2. Data Update
    - Sets all existing chants to published status
    - Sets first chant as featured
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chants' AND column_name = 'category'
  ) THEN
    ALTER TABLE chants ADD COLUMN category text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chants' AND column_name = 'status'
  ) THEN
    ALTER TABLE chants ADD COLUMN status text NOT NULL DEFAULT 'published';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chants' AND column_name = 'featured'
  ) THEN
    ALTER TABLE chants ADD COLUMN featured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chants' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE chants ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

UPDATE chants SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE chants SET featured = true WHERE sort_order = 1;
