-- À exécuter une seule fois dans Supabase : SQL Editor > New query > coller > Run.
-- Crée une table privée : chaque utilisatrice ne voit et ne modifie que sa propre ligne.

create table if not exists public.dashboards (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboards enable row level security;

create policy "dashboards_select_own" on public.dashboards
  for select using (auth.uid() = user_id);

create policy "dashboards_insert_own" on public.dashboards
  for insert with check (auth.uid() = user_id);

create policy "dashboards_update_own" on public.dashboards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Droits d'accès pour les comptes connectés (nécessaire sur les projets récents).
-- Sans ça : « permission denied for table dashboards ». Les règles RLS ci-dessus restent le garde-fou.
grant usage on schema public to authenticated;
grant select, insert, update on public.dashboards to authenticated;
