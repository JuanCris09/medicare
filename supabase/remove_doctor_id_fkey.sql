-- SOLUCIÓN: Eliminar el Foreign Key Constraint en pacientes.doctor_id
-- Esto permite que el dashboard funcione sin requerir un doctor autenticado específico
-- El doctor_id puede ser NULL o cualquier UUID sin validación

-- Paso 1: Eliminar el constraint de foreign key
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_doctor_id_fkey;

-- Paso 2: Asegurar que la columna permite NULL
ALTER TABLE pacientes ALTER COLUMN doctor_id DROP NOT NULL;

-- Paso 3: Verificar que el constraint fue eliminado
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='pacientes'
  AND kcu.column_name='doctor_id';

-- Paso 4: Verificar la configuración final de la columna
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'pacientes' 
  AND column_name = 'doctor_id';

-- ✅ RESULTADO ESPERADO:
-- - No debería aparecer ningún constraint en el Paso 3
-- - En el Paso 4, is_nullable debería ser 'YES'
