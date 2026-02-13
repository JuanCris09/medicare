-- Create 'citas' table
create table public.citas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  paciente_id uuid references public.pacientes(id) on delete cascade not null,
  fecha date not null,
  hora time not null,
  motivo text not null,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'En Espera', 'Completada', 'Cancelada'))
);

-- Enable RLS
alter table public.citas enable row level security;

-- Policies (Allow all for demo purposes, restrict in prod)
create policy "Enable all for anon" on public.citas for all using (true) with check (true);

-- Optional: Create index for performance
create index citas_fecha_idx on public.citas (fecha);
