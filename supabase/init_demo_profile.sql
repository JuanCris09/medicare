-- UPSERT DEMO DOCTOR PROFILE
-- Ensures the demo UUID exists so foreign key constraints on 'citas' and 'pacientes' don't fail

INSERT INTO public.doctor_profiles (id, doctor_name, specialty, brand_color)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Dr. MediScan Demo',
  'Especialista en IA Médica',
  '#0ea5e9'
)
ON CONFLICT (id) DO NOTHING;

-- Also ensure a demo configuration exists
-- NOTE: Changed ID from 1 to a UUID to match table definition
INSERT INTO public.configuracion (id, nombre_doctor, especialidad, nombre_clinica)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Dr. MediScan Demo',
  'Especialista en IA Médica',
  'Clínica Digital MediCare'
)
ON CONFLICT (id) DO UPDATE SET
  nombre_doctor = EXCLUDED.nombre_doctor,
  especialidad = EXCLUDED.especialidad,
  nombre_clinica = EXCLUDED.nombre_clinica;
