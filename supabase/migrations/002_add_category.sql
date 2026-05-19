-- Add category column to tasks
alter table public.tasks
  add column category text not null default 'other'
  check (category in ('hygiene','health','home','car','work','pets','finances','other'));

-- Update existing tasks to keep 'other' as default (already set above)
