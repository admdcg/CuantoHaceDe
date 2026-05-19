-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tasks table
create table public.tasks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 100),
  description   text check (char_length(description) <= 500),
  color         text check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon          text check (char_length(icon) <= 10),
  interval_days integer check (interval_days between 1 and 3650),
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Executions table
create table public.executions (
  id           uuid primary key default uuid_generate_v4(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  executed_at  timestamptz not null,
  note         text check (char_length(note) <= 500),
  created_at   timestamptz not null default now()
);

-- Indexes for common queries
create index tasks_user_id_archived_idx on public.tasks(user_id, archived);
create index executions_task_id_executed_at_idx on public.executions(task_id, executed_at desc);
create index executions_user_id_idx on public.executions(user_id);

-- Auto-update updated_at on tasks
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

-- Row Level Security
alter table public.tasks enable row level security;
alter table public.executions enable row level security;

-- Tasks RLS policies
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Executions RLS policies
create policy "Users can view own executions"
  on public.executions for select
  using (auth.uid() = user_id);

create policy "Users can insert own executions"
  on public.executions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tasks
      where id = task_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own executions"
  on public.executions for delete
  using (auth.uid() = user_id);
