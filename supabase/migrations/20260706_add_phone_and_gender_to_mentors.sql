-- Migration to add phone and gender columns to mentors table
ALTER TABLE mentors ADD COLUMN phone TEXT;
ALTER TABLE mentors ADD COLUMN gender TEXT CHECK (gender IN ('Male', 'Female', 'Others'));
