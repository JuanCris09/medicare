-- Migration: Add email column to pacientes table
-- Run this in the SQL Editor of your Supabase dashboard

-- Add email column to pacientes table
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS email TEXT;

-- Optional: Add a comment to the column
COMMENT ON COLUMN pacientes.email IS 'Email address of the patient for PDF delivery and notifications';
