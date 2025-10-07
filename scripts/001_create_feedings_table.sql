-- Create feedings table to store feeding records
create table if not exists public.feedings (
  id uuid primary key default gen_random_uuid(),
  amount integer not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.feedings enable row level security;

-- Create policies for public access (no auth required for this simple app)
-- Allow anyone to view all feedings
create policy "feedings_select_all"
  on public.feedings for select
  using (true);

-- Allow anyone to insert feedings
create policy "feedings_insert_all"
  on public.feedings for insert
  with check (true);

-- Allow anyone to delete feedings
create policy "feedings_delete_all"
  on public.feedings for delete
  using (true);
