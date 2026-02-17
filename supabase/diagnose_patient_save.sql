-- DIAGNÓSTICO COMPLETO: Verificar por qué no se están guardando los pacientes
-- Ejecuta este script en el SQL Editor de Supabase para diagnosticar el problema

-- ============================================
-- 1. VERIFICAR ESTRUCTURA DE LA TABLA
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'pacientes'
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFICAR CONSTRAINTS (FOREIGN KEYS)
-- ============================================
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
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='pacientes';

-- ============================================
-- 3. VERIFICAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'pacientes';

-- ============================================
-- 4. VERIFICAR SI RLS ESTÁ HABILITADO
-- ============================================
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'pacientes';

-- ============================================
-- 5. INTENTAR INSERTAR UN PACIENTE DE PRUEBA
-- ============================================
-- Esto te dirá exactamente qué error está ocurriendo
INSERT INTO pacientes (nombre, cedula, email, doctor_id)
VALUES ('Paciente Prueba', '123456789', 'test@test.com', '00000000-0000-0000-0000-000000000000')
RETURNING *;

-- Si el INSERT anterior falla, intenta este (sin doctor_id):
-- INSERT INTO pacientes (nombre, cedula, email)
-- VALUES ('Paciente Prueba 2', '987654321', 'test2@test.com')
-- RETURNING *;

-- ============================================
-- 6. VERIFICAR PACIENTES EXISTENTES
-- ============================================
SELECT id, nombre, cedula, doctor_id, created_at
FROM pacientes
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 7. VERIFICAR SI EXISTE EL DEMO DOCTOR ID
-- ============================================
SELECT id, email
FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000000';
