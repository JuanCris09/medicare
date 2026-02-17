-- Verificar si la columna email existe en la tabla pacientes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pacientes'
ORDER BY ordinal_position;
