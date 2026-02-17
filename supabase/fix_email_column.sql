-- SOLUCIÓN COMPLETA: Recrear la columna email con todas las configuraciones necesarias
-- Ejecuta este script completo en el SQL Editor de Supabase

-- Paso 1: Eliminar la columna si existe (para empezar limpio)
ALTER TABLE pacientes DROP COLUMN IF EXISTS email;

-- Paso 2: Agregar la columna email con todas las configuraciones
ALTER TABLE pacientes ADD COLUMN email TEXT;

-- Paso 3: Agregar índice para mejorar búsquedas (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);

-- Paso 4: Agregar comentario descriptivo
COMMENT ON COLUMN pacientes.email IS 'Email address of the patient for PDF delivery and notifications';

-- Paso 5: REFRESCAR EL SCHEMA CACHE (IMPORTANTE)
NOTIFY pgrst, 'reload schema';

-- Verificar que la columna se creó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pacientes'
ORDER BY ordinal_position;
