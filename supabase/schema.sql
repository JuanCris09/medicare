-- Create the 'pacientes' table in Supabase
-- Run this in the SQL Editor of your Supabase dashboard

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  cedula TEXT,
  email TEXT,
  ultima_cita TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado TEXT NOT NULL DEFAULT 'Activo',
  diagnostico TEXT,
  doctor_id UUID DEFAULT NULL -- For future Auth integration
);

-- Enable Row Level Security (RLS)
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read/write for now
-- WARNING: In production, change this to authenticated users only!
CREATE POLICY "Public Access" ON pacientes FOR ALL USING (true) WITH CHECK (true);
