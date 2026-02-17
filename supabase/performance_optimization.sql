-- PERFORMANCE INDEXES & SCHEMA REFINEMENT
-- This script adds missing indexes and columns to resolve high latency and dashboard performance warnings.

-- ============================================
-- 1. SUPPORT FOR QR TOKENS (Emergency View)
-- ============================================
-- Ensure qr_token exists as it is referenced in EmergencyView.jsx
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pacientes' AND COLUMN_NAME='qr_token') THEN
    ALTER TABLE public.pacientes ADD COLUMN qr_token UUID DEFAULT uuid_generate_v4() UNIQUE;
  END IF;
END $$;

-- ============================================
-- 2. FOREIGN KEY INDEXES (Crucial for RLS Performance)
-- ============================================
-- RLS policies filter by doctor_id. Without indexes, every request scans the whole table.
CREATE INDEX IF NOT EXISTS idx_pacientes_doctor_id ON public.pacientes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_citas_doctor_id ON public.citas(doctor_id);

-- Sub-resources are linked via paciente_id.
CREATE INDEX IF NOT EXISTS idx_citas_paciente_id ON public.citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historial_paciente_id ON public.historial_medico(paciente_id);
CREATE INDEX IF NOT EXISTS idx_perfil_salud_paciente_id ON public.perfil_salud(paciente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_paciente_id ON public.documentos_identidad(paciente_id);

-- ============================================
-- 3. LOOKUP INDEXES (Search & Verification)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pacientes_cedula ON public.pacientes(cedula);
CREATE INDEX IF NOT EXISTS idx_pacientes_qr_token ON public.pacientes(qr_token);
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON public.pacientes(email);

-- ============================================
-- 4. VERIFICATION
-- ============================================
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('pacientes', 'citas', 'historial_medico', 'perfil_salud', 'documentos_identidad')
ORDER BY tablename;
