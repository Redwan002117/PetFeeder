-- Core User Management Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  email_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid primary key references public.profiles(id) on delete cascade,
  notifications_enabled boolean default false,
  email_notifications boolean default true,
  theme text default 'system',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Device Management
CREATE TABLE IF NOT EXISTS public.devices (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'My PetFeeder',
  status text default 'offline',
  food_level integer default 0,
  last_seen timestamp with time zone,
  firmware_version text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Pet Management
CREATE TABLE IF NOT EXISTS public.pets (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  device_id uuid references public.devices(id) on delete set null,
  name text not null,
  type text not null,
  breed text,
  age integer,
  weight decimal,
  photo_url text,
  feeding_amount integer,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Feeding Management
CREATE TABLE IF NOT EXISTS public.feeding_schedules (
  id uuid default uuid_generate_v4() primary key,
  pet_id uuid references public.pets(id) on delete cascade not null,
  device_id uuid references public.devices(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  time_of_day time not null,
  days_of_week text[] not null,
  amount integer not null,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.feeding_history (
  id uuid default uuid_generate_v4() primary key,
  device_id uuid references public.devices(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  amount integer not null,
  type text default 'manual',
  status text default 'completed',
  schedule_id uuid references public.feeding_schedules(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Additional table for device statistics
CREATE TABLE IF NOT EXISTS public.device_stats (
  id uuid default uuid_generate_v4() primary key,
  device_id uuid references public.devices(id) on delete cascade not null,
  total_feedings integer default 0,
  total_amount integer default 0,
  last_maintenance timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.devices enable row level security;
alter table public.pets enable row level security;
alter table public.feeding_schedules enable row level security;
alter table public.feeding_history enable row level security;
ALTER TABLE public.device_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
create policy "Profiles are viewable by owner"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Devices
CREATE POLICY "Users can view their own devices"
    ON public.devices FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own devices"
    ON public.devices FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create devices"
    ON public.devices FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own devices"
    ON public.devices FOR DELETE
    USING (auth.uid() = owner_id);

-- Feeding Schedules
CREATE POLICY "Users can view their feeding schedules"
    ON public.feeding_schedules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their feeding schedules"
    ON public.feeding_schedules FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feeding schedules"
    ON public.feeding_schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their feeding schedules"
    ON public.feeding_schedules FOR DELETE
    USING (auth.uid() = user_id);

-- Feeding History
CREATE POLICY "Users can view their feeding history"
    ON public.feeding_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feeding history"
    ON public.feeding_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User Preferences
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = id);

-- Pets
CREATE POLICY "Users can view their own pets"
    ON public.pets FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own pets"
    ON public.pets FOR ALL
    USING (auth.uid() = owner_id);

-- Indexes
CREATE INDEX idx_devices_owner_id ON public.devices(owner_id);
CREATE INDEX idx_feeding_schedules_device_id ON public.feeding_schedules(device_id);
CREATE INDEX idx_feeding_schedules_user_id ON public.feeding_schedules(user_id);
CREATE INDEX idx_feeding_history_device_id ON public.feeding_history(device_id);
CREATE INDEX idx_feeding_history_user_id ON public.feeding_history(user_id);
CREATE INDEX idx_user_profiles_username ON public.profiles(username);
CREATE INDEX idx_pets_owner_id ON public.pets(owner_id);
CREATE INDEX idx_feeding_history_pet_id ON public.feeding_history(pet_id);
CREATE INDEX idx_feeding_schedules_pet_id ON public.feeding_schedules(pet_id);
CREATE INDEX idx_devices_last_seen ON public.devices(last_seen);
CREATE INDEX idx_feeding_history_created_at ON public.feeding_history(created_at);

-- Drop existing triggers and functions first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS device_stats_trigger ON public.devices;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_device_stats();

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name,
    email_verified
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  );

  INSERT INTO public.user_preferences (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_device_stats()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.device_stats (device_id)
  VALUES (NEW.id)
  ON CONFLICT (device_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER device_stats_trigger
  AFTER INSERT ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION update_device_stats();

-- Add status check constraint
ALTER TABLE public.devices 
  ADD CONSTRAINT device_status_check 
  CHECK (status IN ('online', 'offline', 'maintenance', 'error'));

-- Add feeding history type check
ALTER TABLE public.feeding_history 
  ADD CONSTRAINT feeding_type_check 
  CHECK (type IN ('manual', 'scheduled', 'error'));

-- RLS for device stats
CREATE POLICY "Users can view their device stats"
  ON public.device_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.devices
    WHERE devices.id = device_stats.device_id
    AND devices.owner_id = auth.uid()
  ));
