-- ALTERNATIVA: Si la columna cedula tampoco aparece, ejecuta este script
-- Este script recrea TODA la tabla con las columnas correctas

-- ADVERTENCIA: Este script eliminará y recreará la tabla
-- Solo úsalo si no tienes datos importantes o si tienes un backup

-- Paso 1: Eliminar tabla existente
DROP TABLE IF EXISTS pacientes CASCADE;

-- Paso 2: Recrear tabla con todas las columnas
CREATE TABLE pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  cedula TEXT,
  email TEXT,
  ultima_cita TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado TEXT NOT NULL DEFAULT 'Activo',
  diagnostico TEXT,
  doctor_id UUID DEFAULT NULL
);

-- Paso 3: Habilitar RLS
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

-- Paso 4: Crear política de acceso público (cambiar en producción)
CREATE POLICY "Public Access" ON pacientes FOR ALL USING (true) WITH CHECK (true);

-- Paso 5: Agregar índices
CREATE INDEX IF NOT EXISTS idx_pacientes_cedula ON pacientes(cedula);
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);
CREATE INDEX IF NOT EXISTS idx_pacientes_doctor_id ON pacientes(doctor_id);

-- Paso 6: Agregar comentarios
COMMENT ON TABLE pacientes IS 'Tabla principal de pacientes del sistema';
COMMENT ON COLUMN pacientes.cedula IS 'Número de cédula de identidad del paciente';
COMMENT ON COLUMN pacientes.email IS 'Email del paciente para notificaciones y envío de PDFs';

-- Paso 7: REFRESCAR SCHEMA
NOTIFY pgrst, 'reload schema';

-- Verificar estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pacientes'
ORDER BY ordinal_position;
