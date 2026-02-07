/*
  # Create chants table for Naam Japa app

  1. New Tables
    - `chants`
      - `id` (uuid, primary key) - unique identifier for each chant
      - `name` (text, not null) - display name of the chant (e.g., "Shri Ram Naam")
      - `subtitle` (text, not null) - short description shown below the name
      - `audio_url` (text, nullable) - URL to the single-repetition audio file
      - `duration_ms` (integer, not null, default 3000) - duration of one repetition in milliseconds
      - `has_rounds` (boolean, not null, default false) - whether this chant supports "Rounds" mode
      - `sort_order` (integer, not null, default 0) - display order on home screen
      - `created_at` (timestamptz, default now()) - record creation timestamp

  2. Security
    - Enable RLS on `chants` table
    - Add policy for anyone to read chants (public content, no auth required for reading)

  3. Seed Data
    - "Shri Ram Naam" - classic Ram chant
    - "Radhe Radhe" - devotional Radha chant
    - "Hare Krishna Mahamantra" - the full Mahamantra with rounds support
*/

CREATE TABLE IF NOT EXISTS chants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  audio_url text,
  duration_ms integer NOT NULL DEFAULT 3000,
  has_rounds boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chants"
  ON chants
  FOR SELECT
  TO anon, authenticated
  USING (sort_order >= 0);

INSERT INTO chants (name, subtitle, audio_url, duration_ms, has_rounds, sort_order) VALUES
  ('Shri Ram Naam', 'श्री राम जय राम जय जय राम', NULL, 4000, false, 1),
  ('Radhe Radhe', 'राधे राधे राधे श्याम', NULL, 3500, false, 2),
  ('Hare Krishna Mahamantra', 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे', NULL, 5000, true, 3);
