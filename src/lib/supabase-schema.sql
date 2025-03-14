-- Recreate devices table with fixed column names
drop table if exists public.devices cascade;

create table public.devices (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid references auth.users not null,
  name text not null default 'My PetFeeder',
  status text default 'offline',
  food_level integer default 0,
  last_seen timestamp with time zone,
  wifi_config jsonb default '{"ssid":"","password":"","hotspot_enabled":false,"hotspot_name":"","hotspot_password":""}'::jsonb,
  model text,
  firmware_version text,
  unique(owner_id)
);

-- Create feeding_requests table
create table if not exists public.feeding_requests (
  id uuid default uuid_generate_v4() primary key,
  device_id uuid references public.devices(id) not null,
  user_id uuid references auth.users(id) not null,
  amount integer not null,
  status text default 'pending',
  timestamp timestamp with time zone default timezone('utc'::text, now()),
  completed_at timestamp with time zone
);

-- Create user_preferences table
create table if not exists public.user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null unique,
  notifications_enabled boolean default false,
  email_notifications boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up RLS policies for devices
alter table public.devices enable row level security;

create policy "Users can view their own devices"
  on public.devices for select
  using (auth.uid() = owner_id);

create policy "Users can update their own devices"
  on public.devices for update
  using (auth.uid() = owner_id);

create policy "Users can create devices"
  on public.devices for insert
  with check (auth.uid() = owner_id);

create policy "Users can delete their own devices"
  on public.devices for delete
  using (auth.uid() = owner_id);

-- Add RLS policies for user_preferences
alter table public.user_preferences enable row level security;

create policy "Users can view their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

-- Create indexes
create index devices_owner_id_idx on public.devices(owner_id);
