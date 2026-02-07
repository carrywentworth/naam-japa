/*
  # Add background visuals and theme gradient to chants

  1. Modified Tables
    - `chants`
      - `background_image_url` (text, nullable) - URL to a serene background image for this chant
      - `background_video_url` (text, nullable) - URL to a looping background video for this chant
      - `theme_gradient` (text, not null, default) - CSS gradient identifier for per-chant theming

  2. Data Updates
    - Each chant gets a unique theme gradient for visual distinction

  3. Notes
    - Background media is optional; the app falls back to the theme gradient
    - Gradient values are CSS-compatible color stops
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chants' AND column_name = 'background_image_url'
  ) THEN
    ALTER TABLE chants ADD COLUMN background_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chants' AND column_name = 'background_video_url'
  ) THEN
    ALTER TABLE chants ADD COLUMN background_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chants' AND column_name = 'theme_gradient'
  ) THEN
    ALTER TABLE chants ADD COLUMN theme_gradient text NOT NULL DEFAULT 'amber';
  END IF;
END $$;

UPDATE chants SET theme_gradient = 'amber' WHERE name = 'Shri Ram Naam';
UPDATE chants SET theme_gradient = 'rose' WHERE name = 'Radhe Radhe';
UPDATE chants SET theme_gradient = 'teal' WHERE name = 'Hare Krishna Mahamantra';
