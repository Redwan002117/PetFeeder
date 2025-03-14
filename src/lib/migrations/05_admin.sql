-- Create tables for admin components
create table if not exists public.analytics (
  id uuid default uuid_generate_v4() primary key,
  metric_name text not null,
  metric_value jsonb,
  created_at timestamptz default now()
);

create table if not exists public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  level text not null,
  message text not null,
  metadata jsonb,
  timestamp timestamptz default now()
);

-- Add RLS policies
alter table public.analytics enable row level security;
alter table public.system_logs enable row level security;

create policy "Allow admin read analytics"
  on public.analytics for select
  using (auth.uid() in (
    select id from public.users where role = 'admin'
  ));

create policy "Allow admin read logs"
  on public.system_logs for select
  using (auth.uid() in (
    select id from public.users where role = 'admin'
  ));
