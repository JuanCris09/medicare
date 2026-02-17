CREATE TABLE IF NOT EXISTS doctor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  brand_color TEXT DEFAULT '#0f172a', -- Default slate-900
  logo_url TEXT,
  subdomain_slug TEXT UNIQUE,
  font_family TEXT DEFAULT 'Outfit', -- Default premium font
  ui_density TEXT DEFAULT 'comfortable', -- compact, comfortable, spacious
  sidebar_theme TEXT DEFAULT 'light', -- light, dark, glass
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update existing tables (pacientes and citas)
-- Add doctor_id and email to pacientes if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pacientes' AND COLUMN_NAME='doctor_id') THEN
    ALTER TABLE pacientes ADD COLUMN doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pacientes' AND COLUMN_NAME='email') THEN
    ALTER TABLE pacientes ADD COLUMN email TEXT;
  END IF;
END $$;

-- Add doctor_id to citas if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='citas' AND COLUMN_NAME='doctor_id') THEN
    ALTER TABLE citas ADD COLUMN doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Enable RLS on all tables
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS Policies

-- doctor_profiles: Users can only read/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON doctor_profiles;
CREATE POLICY "Users can view own profile" ON doctor_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON doctor_profiles;
CREATE POLICY "Users can update own profile" ON doctor_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON doctor_profiles;
CREATE POLICY "Users can insert own profile" ON doctor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. AUTOMATED PROFILE CREATION (Trigger)
-- This function runs every time a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_doctor() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.doctor_profiles (id, doctor_name, specialty, brand_color)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Doctor Nuevo'), 
    COALESCE(NEW.raw_user_meta_data->>'specialty', 'Medicina General'),
    '#0ea5e9'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_doctor();

-- pacientes: Users can only see/manage their own patients
-- PUBLIC POLICY: Allow anyone to see and insert DEMO patients (ID: 00000000-0000-0000-0000-000000000000)
DROP POLICY IF EXISTS "Public view demo patients" ON pacientes;
CREATE POLICY "Public view demo patients" ON pacientes
  FOR SELECT USING (doctor_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Public insert demo patients" ON pacientes;
CREATE POLICY "Public insert demo patients" ON pacientes
  FOR INSERT WITH CHECK (doctor_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Users can view own patients" ON pacientes;
CREATE POLICY "Users can view own patients" ON pacientes
  FOR SELECT USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Users can insert own patients" ON pacientes;
CREATE POLICY "Users can insert own patients" ON pacientes
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Users can update own patients" ON pacientes;
CREATE POLICY "Users can update own patients" ON pacientes
  FOR UPDATE USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Users can delete own patients" ON pacientes;
CREATE POLICY "Users can delete own patients" ON pacientes
  FOR DELETE USING (auth.uid() = doctor_id);

-- citas: Users can only see/manage their own appointments
-- PUBLIC POLICY: Allow anyone to see and insert DEMO appointments (ID: 00000000-0000-0000-0000-000000000000)
DROP POLICY IF EXISTS "Public view demo appointments" ON citas;
CREATE POLICY "Public view demo appointments" ON citas
  FOR SELECT USING (doctor_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Public insert demo appointments" ON citas;
CREATE POLICY "Public insert demo appointments" ON citas
  FOR INSERT WITH CHECK (doctor_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Users can view own appointments" ON citas;
CREATE POLICY "Users can view own appointments" ON citas
  FOR SELECT USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON citas;
CREATE POLICY "Users can insert own appointments" ON citas
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON citas;
CREATE POLICY "Users can update own appointments" ON citas
  FOR UPDATE USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Users can delete own appointments" ON citas;
CREATE POLICY "Users can delete own appointments" ON citas
  FOR DELETE USING (auth.uid() = doctor_id);
