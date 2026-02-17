-- SOLUCIÓN: Arreglar el problema de Foreign Key Constraint en pacientes.doctor_id
-- Este script permite que doctor_id sea NULL o verifica que el constraint esté correctamente configurado

-- Paso 1: Ver el constraint actual
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='pacientes'
  AND kcu.column_name='doctor_id';

-- Paso 2: Eliminar el constraint existente (si existe)
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_doctor_id_fkey;

-- Paso 3: Recrear el constraint con la configuración correcta
-- Esto permite que doctor_id sea NULL o que referencie un usuario válido en auth.users
ALTER TABLE pacientes 
  ADD CONSTRAINT pacientes_doctor_id_fkey 
  FOREIGN KEY (doctor_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Paso 4: Verificar que la columna permite NULL
ALTER TABLE pacientes ALTER COLUMN doctor_id DROP NOT NULL;

-- Paso 5: Verificar la configuración final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pacientes' AND column_name = 'doctor_id';

-- Paso 6: Verificar usuarios existentes en auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
