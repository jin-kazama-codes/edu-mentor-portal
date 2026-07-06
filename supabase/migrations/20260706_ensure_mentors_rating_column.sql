-- Migration to ensure rating column exists in mentors table
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS rating NUMERIC NOT NULL DEFAULT 5.0;
