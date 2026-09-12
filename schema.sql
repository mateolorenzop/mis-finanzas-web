-- Ejecutar esto en Supabase: Project > SQL Editor > New query > pegar todo > Run

create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  concepto text not null,
  categoria text,
  monto numeric not null,
  fecha date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.movimientos enable row level security;

create policy "select own movimientos" on public.movimientos
  for select using (auth.uid() = user_id);

create policy "insert own movimientos" on public.movimientos
  for insert with check (auth.uid() = user_id);

create policy "update own movimientos" on public.movimientos
  for update using (auth.uid() = user_id);

create policy "delete own movimientos" on public.movimientos
  for delete using (auth.uid() = user_id);

-- Índice para traer rápido los movimientos de un usuario ordenados por fecha
create index if not exists movimientos_user_fecha_idx on public.movimientos (user_id, fecha desc);
