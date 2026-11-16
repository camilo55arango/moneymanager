-- Presupuesto mensual por categoría. Se repite todos los meses hasta que el usuario lo cambie.

create table if not exists public.budgets (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null,
  amount numeric not null check (amount > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.budgets enable row level security;

create policy "Cada usuario ve sus presupuestos"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Cada usuario crea sus presupuestos"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Cada usuario edita sus presupuestos"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Cada usuario borra sus presupuestos"
  on public.budgets for delete
  using (auth.uid() = user_id);
