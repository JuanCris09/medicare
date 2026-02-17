-- FIX DEMO FK CONSTRAINTS
-- Decouples tables from strict auth.users(id) requirements to allow '0000-0000-0000-0000-000000000000' to exist

-- 1. DOCTOR_PROFILES
ALTER TABLE public.doctor_profiles DROP CONSTRAINT IF EXISTS doctor_profiles_id_fkey;

-- 2. PACIENTES
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_doctor_id_fkey;
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS fk_doctor;

-- 3. CITAS
ALTER TABLE public.citas DROP CONSTRAINT IF EXISTS citas_doctor_id_fkey;

-- Verification
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('doctor_profiles', 'pacientes', 'citas');
