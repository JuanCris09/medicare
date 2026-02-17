-- RLS PERMISSIONS FIX
-- Targets: 403 (Forbidden) on inserts and 406 (Not Acceptable) on fetches for anonymous users

-- ============================================
-- 1. DOCTOR PROFILES (Allow public read for branding)
-- ============================================
-- Fixes: 406 (Not Acceptable) when fetching clinic logo/name anonymously
DROP POLICY IF EXISTS "Users can manage own profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Public read profile" ON public.doctor_profiles;

CREATE POLICY "Public read profile" ON public.doctor_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users manage own profile" ON public.doctor_profiles
  FOR ALL
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================
-- 2. PACIENTES (Ensure inserts work for everyone)
-- ============================================
-- Already mostly correct, but let's ensure 'anon' can insert
DROP POLICY IF EXISTS "Insert patients" ON public.pacientes;
CREATE POLICY "Insert patients" ON public.pacientes
  FOR INSERT
  WITH CHECK (
    doctor_id = '00000000-0000-0000-0000-000000000000' -- Demo
    OR doctor_id IS NULL -- Demo
    OR (auth.role() = 'authenticated' AND doctor_id = (select auth.uid())) -- Premium
  );

-- ============================================
-- 3. SUB-RESOURCES (Fix 403 Forbidden for Demo mode)
-- ============================================

-- DOCUMENTOS IDENTIDAD
DROP POLICY IF EXISTS "Manage identity document" ON public.documentos_identidad;
CREATE POLICY "Manage identity document" ON public.documentos_identidad
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes 
      WHERE pacientes.id = documentos_identidad.paciente_id 
      AND (
        pacientes.doctor_id = (select auth.uid()) -- Profile match
        OR pacientes.doctor_id = '00000000-0000-0000-0000-000000000000' -- Demo match
        OR pacientes.doctor_id IS NULL -- Legacy match
      )
    )
  );

-- HISTORIAL MEDICO
DROP POLICY IF EXISTS "Doctors manage history" ON public.historial_medico;
CREATE POLICY "Doctors manage history" ON public.historial_medico
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes 
      WHERE pacientes.id = historial_medico.paciente_id 
      AND (
        pacientes.doctor_id = (select auth.uid()) 
        OR pacientes.doctor_id = '00000000-0000-0000-0000-000000000000'
        OR pacientes.doctor_id IS NULL
      )
    )
  );

-- PERFIL SALUD
DROP POLICY IF EXISTS "Manage health profile" ON public.perfil_salud;
CREATE POLICY "Manage health profile" ON public.perfil_salud
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes 
      WHERE pacientes.id = perfil_salud.paciente_id 
      AND (
        pacientes.doctor_id = (select auth.uid()) 
        OR pacientes.doctor_id = '00000000-0000-0000-0000-000000000000'
        OR pacientes.doctor_id IS NULL
      )
    )
  );

-- CITAS (Ensure public/demo can manage)
DROP POLICY IF EXISTS "Manage appointments" ON public.citas;
CREATE POLICY "Manage appointments" ON public.citas
  FOR ALL
  USING (
    doctor_id = '00000000-0000-0000-0000-000000000000'
    OR doctor_id IS NULL
    OR doctor_id = (select auth.uid())
  );

-- ============================================
-- 4. VERIFICATION
-- ============================================
SELECT 
    schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('doctor_profiles', 'pacientes', 'historial_medico', 'documentos_identidad', 'perfil_salud', 'citas')
ORDER BY tablename;
