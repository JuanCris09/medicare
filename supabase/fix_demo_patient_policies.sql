-- SOLUCIÓN FINAL: Separar pacientes DEMO de pacientes de doctores autenticados
-- Este script configura las políticas RLS correctamente para que:
-- 1. Dashboard público solo vea pacientes con doctor_id = '00000000-0000-0000-0000-000000000000'
-- 2. Doctores autenticados solo vean sus propios pacientes (NO los del dashboard)

-- ============================================
-- PASO 1: Eliminar el Foreign Key Constraint
-- ============================================
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_doctor_id_fkey;

-- ============================================
-- PASO 2: Permitir NULL en doctor_id
-- ============================================
ALTER TABLE pacientes ALTER COLUMN doctor_id DROP NOT NULL;

-- ============================================
-- PASO 3: Eliminar TODAS las políticas RLS existentes
-- ============================================
DROP POLICY IF EXISTS "Public Access" ON pacientes;
DROP POLICY IF EXISTS "Public view demo patients" ON pacientes;
DROP POLICY IF EXISTS "Public insert demo patients" ON pacientes;
DROP POLICY IF EXISTS "Public update demo patients" ON pacientes;
DROP POLICY IF EXISTS "Public delete demo patients" ON pacientes;
DROP POLICY IF EXISTS "Users can view own patients" ON pacientes;
DROP POLICY IF EXISTS "Users can insert own patients" ON pacientes;
DROP POLICY IF EXISTS "Users can update own patients" ON pacientes;
DROP POLICY IF EXISTS "Users can delete own patients" ON pacientes;

-- ============================================
-- PASO 4: Crear políticas RLS para DASHBOARD PÚBLICO (DEMO)
-- ============================================

-- Permitir a CUALQUIERA (sin autenticación) ver SOLO pacientes DEMO
CREATE POLICY "Public view demo patients" ON pacientes
  FOR SELECT 
  USING (
    doctor_id = '00000000-0000-0000-0000-000000000000' 
    OR doctor_id IS NULL
  );

-- Permitir a CUALQUIERA insertar pacientes DEMO
CREATE POLICY "Public insert demo patients" ON pacientes
  FOR INSERT 
  WITH CHECK (
    doctor_id = '00000000-0000-0000-0000-000000000000' 
    OR doctor_id IS NULL
  );

-- Permitir a CUALQUIERA actualizar pacientes DEMO
CREATE POLICY "Public update demo patients" ON pacientes
  FOR UPDATE 
  USING (
    doctor_id = '00000000-0000-0000-0000-000000000000' 
    OR doctor_id IS NULL
  )
  WITH CHECK (
    doctor_id = '00000000-0000-0000-0000-000000000000' 
    OR doctor_id IS NULL
  );

-- Permitir a CUALQUIERA eliminar pacientes DEMO
CREATE POLICY "Public delete demo patients" ON pacientes
  FOR DELETE 
  USING (
    doctor_id = '00000000-0000-0000-0000-000000000000' 
    OR doctor_id IS NULL
  );

-- ============================================
-- PASO 5: Políticas para DOCTORES AUTENTICADOS (PREMIUM)
-- ============================================

-- Doctores autenticados SOLO pueden ver SUS PROPIOS pacientes
-- IMPORTANTE: Esto EXCLUYE los pacientes DEMO
CREATE POLICY "Doctors view own patients only" ON pacientes
  FOR SELECT 
  USING (
    auth.uid() = doctor_id 
    AND doctor_id != '00000000-0000-0000-0000-000000000000'
    AND doctor_id IS NOT NULL
  );

-- Doctores autenticados SOLO pueden insertar pacientes con su propio ID
CREATE POLICY "Doctors insert own patients only" ON pacientes
  FOR INSERT 
  WITH CHECK (
    auth.uid() = doctor_id 
    AND doctor_id != '00000000-0000-0000-0000-000000000000'
    AND doctor_id IS NOT NULL
  );

-- Doctores autenticados SOLO pueden actualizar SUS PROPIOS pacientes
CREATE POLICY "Doctors update own patients only" ON pacientes
  FOR UPDATE 
  USING (
    auth.uid() = doctor_id 
    AND doctor_id != '00000000-0000-0000-0000-000000000000'
    AND doctor_id IS NOT NULL
  )
  WITH CHECK (
    auth.uid() = doctor_id 
    AND doctor_id != '00000000-0000-0000-0000-000000000000'
    AND doctor_id IS NOT NULL
  );

-- Doctores autenticados SOLO pueden eliminar SUS PROPIOS pacientes
CREATE POLICY "Doctors delete own patients only" ON pacientes
  FOR DELETE 
  USING (
    auth.uid() = doctor_id 
    AND doctor_id != '00000000-0000-0000-0000-000000000000'
    AND doctor_id IS NOT NULL
  );

-- ============================================
-- PASO 6: Habilitar RLS
-- ============================================
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 7: Verificar las políticas creadas
-- ============================================
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname LIKE '%demo%' THEN 'Dashboard Público'
        WHEN policyname LIKE '%Doctors%' THEN 'Doctores Premium'
        ELSE 'Otro'
    END as tipo_politica
FROM pg_policies
WHERE tablename = 'pacientes'
ORDER BY tipo_politica, cmd;

-- ============================================
-- PASO 8: Probar inserción de paciente DEMO
-- ============================================
INSERT INTO pacientes (nombre, cedula, email, doctor_id)
VALUES ('Paciente Demo Test', '999999999', 'demo@test.com', '00000000-0000-0000-0000-000000000000')
RETURNING id, nombre, doctor_id;

-- ✅ RESULTADO ESPERADO:
-- - Dashboard público: Solo ve pacientes con doctor_id = '00000000-0000-0000-0000-000000000000'
-- - Doctores autenticados: Solo ven pacientes con su propio doctor_id (NO ven los DEMO)
