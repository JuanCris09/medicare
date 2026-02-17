-- SUPABASE SECURITY & PERFORMANCE OPTIMIZATION SCRIPT
-- Resolves: 
-- 1. Performance Warnings (auth_rls_initplan)
-- 2. Performance Warnings (multiple_permissive_policies)
-- 3. Security Hardening (RLS & Search Path)

-- ============================================
-- 1. CLEANUP: Reset existing policies to avoid conflicts
-- ============================================
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ============================================
-- 2. ENABLE RLS
-- ============================================
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_medico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_identidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_salud ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. OPTIMIZED POLICIES - DOCTOR_PROFILES
-- ============================================
CREATE POLICY "Users can manage own profile" ON public.doctor_profiles
  FOR ALL
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================
-- 4. OPTIMIZED POLICIES - PACIENTES (Consolidated)
-- ============================================
-- Combine Demo access and Premium access into unified policies per action
CREATE POLICY "Select patients" ON public.pacientes
  FOR SELECT
  USING (
    doctor_id = '00000000-0000-0000-0000-000000000000' -- Demo
    OR doctor_id IS NULL -- Legacy/Demo
    OR doctor_id = (select auth.uid()) -- Premium
    OR id::text = (select auth.uid())::text -- Patient looking at own record (if applicable)
  );

CREATE POLICY "Insert patients" ON public.pacientes
  FOR INSERT
  WITH CHECK (
    doctor_id = '00000000-0000-0000-0000-000000000000' -- Demo
    OR doctor_id IS NULL -- Demo
    OR doctor_id = (select auth.uid()) -- Premium
  );

CREATE POLICY "Update patients" ON public.pacientes
  FOR UPDATE
  USING (
    doctor_id = '00000000-0000-0000-0000-000000000000'
    OR doctor_id IS NULL
    OR doctor_id = (select auth.uid())
  );

CREATE POLICY "Delete patients" ON public.pacientes
  FOR DELETE
  USING (
    doctor_id = '00000000-0000-0000-0000-000000000000'
    OR doctor_id IS NULL
    OR doctor_id = (select auth.uid())
  );

-- ============================================
-- 5. OPTIMIZED POLICIES - CITAS (Consolidated)
-- ============================================
CREATE POLICY "Manage appointments" ON public.citas
  FOR ALL
  USING (
    doctor_id = '00000000-0000-0000-0000-000000000000'
    OR doctor_id IS NULL
    OR doctor_id = (select auth.uid())
  );

-- ============================================
-- 6. OPTIMIZED POLICIES - SUB-RESOURCES (Linked via Patient)
-- ============================================

-- Unified selection for emergency and authenticated
CREATE POLICY "Read health profile" ON public.perfil_salud
  FOR SELECT
  USING (true); -- Publicly readable for emergency QR access

CREATE POLICY "Manage health profile" ON public.perfil_salud
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes 
      WHERE pacientes.id = perfil_salud.paciente_id 
      AND (pacientes.doctor_id = (select auth.uid()) OR pacientes.id = (select auth.uid()))
    )
  );

CREATE POLICY "Read identity document" ON public.documentos_identidad
  FOR SELECT
  USING (true);

CREATE POLICY "Manage identity document" ON public.documentos_identidad
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes 
      WHERE pacientes.id = documentos_identidad.paciente_id 
      AND (pacientes.doctor_id = (select auth.uid()) OR pacientes.id = (select auth.uid()))
    )
  );

CREATE POLICY "Doctors manage history" ON public.historial_medico
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes 
      WHERE pacientes.id = historial_medico.paciente_id 
      AND (pacientes.doctor_id = (select auth.uid()) OR pacientes.id = (select auth.uid()))
    )
  );

-- ============================================
-- 7. CONFIGURATION POLICIES
-- ============================================
CREATE POLICY "Public read config" ON public.configuracion
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated manage config" ON public.configuracion
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================
-- 8. FUNCTION HARDENING
-- ============================================
ALTER FUNCTION public.handle_new_doctor() SET search_path = public;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
SELECT 
    schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
