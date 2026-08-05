-- Esquema inicial para Postgres estándar (Railway).
--
-- Sustituye a las migraciones de Supabase: aquí no existe auth.users ni
-- auth.uid(), así que la tabla de usuarios es propia y las políticas de RLS
-- leen el id del usuario de la variable de sesión app.user_id, que la
-- aplicación fija en cada transacción (ver apps/web/src/lib/db/index.ts).

create extension if not exists "uuid-ossp";

-- Usuarios ---------------------------------------------------------------

create table public.users (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null unique check (email = lower(email) and position('@' in email) > 1),
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- Devuelve el usuario de la transacción actual, o null si no se ha fijado.
-- El segundo argumento de current_setting evita el error cuando la variable
-- no existe; el nullif evita que una cadena vacía reviente el cast a uuid.
create or replace function public.current_app_user()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- Tareas -----------------------------------------------------------------

create table public.tasks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 100),
  description   text check (char_length(description) <= 500),
  category      text not null default 'other'
                check (category in ('hygiene','health','home','car','work','pets','finances','other')),
  interval_days integer check (interval_days between 1 and 3650),
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.executions (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  executed_at timestamptz not null,
  note        text check (char_length(note) <= 500),
  created_at  timestamptz not null default now()
);

create index tasks_user_id_archived_idx on public.tasks(user_id, archived);
create index executions_task_id_executed_at_idx on public.executions(task_id, executed_at desc);
create index executions_user_id_idx on public.executions(user_id);

-- updated_at automático ---------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Row Level Security ------------------------------------------------------
--
-- force row level security hace que las políticas se apliquen también al
-- dueño de la tabla. Un superusuario (el rol postgres que Railway entrega por
-- defecto) las sigue saltando: para que esta capa cuente de verdad hay que
-- conectar con un rol sin privilegios, ver db/create-app-role.sql.

alter table public.tasks enable row level security;
alter table public.tasks force row level security;
alter table public.executions enable row level security;
alter table public.executions force row level security;

create policy tasks_select on public.tasks
  for select using (user_id = public.current_app_user());

create policy tasks_insert on public.tasks
  for insert with check (user_id = public.current_app_user());

create policy tasks_update on public.tasks
  for update using (user_id = public.current_app_user())
  with check (user_id = public.current_app_user());

create policy tasks_delete on public.tasks
  for delete using (user_id = public.current_app_user());

create policy executions_select on public.executions
  for select using (user_id = public.current_app_user());

create policy executions_insert on public.executions
  for insert with check (
    user_id = public.current_app_user()
    and exists (
      select 1 from public.tasks
      where id = task_id and user_id = public.current_app_user()
    )
  );

create policy executions_delete on public.executions
  for delete using (user_id = public.current_app_user());
