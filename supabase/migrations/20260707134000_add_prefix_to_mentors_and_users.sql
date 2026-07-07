-- Migration to add title prefix to mentors and users tables
ALTER TABLE public.users ADD COLUMN prefix TEXT CHECK (prefix IN ('Mr', 'Miss', 'Mrs', 'Dr'));
ALTER TABLE public.mentors ADD COLUMN prefix TEXT CHECK (prefix IN ('Mr', 'Miss', 'Mrs', 'Dr'));
