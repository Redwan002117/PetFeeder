# Complete Guide to Setting Up Pet Feeder Database in Supabase

## Introduction
This guide explains how to set up your database for the pet feeder project. We'll explain every part in simple terms so you can understand what each piece does.

## What We're Building
We'll create 5 connected tables:
1. Users (stores information about people who use the app)
2. Devices (stores information about each pet feeder device)
3. Schedules (stores feeding schedules)
4. Feeding History (keeps track of when pets were fed)
5. Pet Profiles (stores information about pets)

## Before You Start
1. Create a Supabase account at https://supabase.com
2. Create a new project (name it whatever you like, e.g., "pet-feeder-app")
3. Keep the page open and follow along

## Understanding Database Terms
- **table**: Like a spreadsheet that stores specific information
- **field** or **column**: A single piece of information (like 'name' or 'email')
- **uuid**: A unique ID number that identifies each row
- **references**: Links one table to another
- **timestamp**: Date and time information
- **jsonb**: Stores complex data like settings or configurations
- **text[]**: A list of text items
- **boolean**: True/false value
- **RLS (Row Level Security)**: Rules that control who can see or change data

## Step-by-Step Table Creation

### 1. Creating the Users Table
Open SQL Editor in Supabase and create each table one at a time.

First, the users table:
```sql
-- Users table stores information about people who use the app
create table public.users (
  -- A unique ID that matches their authentication ID
  id uuid references auth.users not null primary key,
  
  -- User type (normal user or admin)
  role text check (role in ('admin', 'user')) default 'user',
  
  -- Basic user information
  email text,
  username text,
  name text,
  
  -- Has the user verified their email?
  email_verified boolean default false,
  
  -- When was the account created?
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- ID of their pet feeder device
  device_id text,
  
  -- What can this user do? Stored as JSON
  permissions jsonb default '{"canFeed": true, "canSchedule": true, "canViewStats": true}'::jsonb
);

-- Make the table secure
alter table public.users enable row level security;

-- Security rules:
-- 1. Users can only see their own data
create policy "Users can view their own data"
  on public.users
  for select
  using (auth.uid() = id);

-- 2. Users can only update their own data
create policy "Users can update their own data"
  on public.users
  for update
  using (auth.uid() = id);

-- 3. Users can create their own profile
create policy "Users can insert their own data"
  on public.users
  for insert
  with check (auth.uid() = id);
```

### 2. Creating the Devices Table
```sql
-- Devices table stores information about pet feeder devices
create table public.devices (
  -- A unique ID for each device
  id uuid default uuid_generate_v4() primary key,
  
  -- Name of the device (e.g., "Kitchen Feeder")
  name text not null,
  
  -- Who owns this device?
  owner_id uuid references public.users(id),
  
  -- When was the device added?
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- When was it last connected?
  last_active timestamp with time zone,
  
  -- Is it online or offline?
  status text default 'offline',
  
  -- Device settings (stored as JSON)
  config jsonb default '{}'::jsonb,
  
  -- Current software version
  firmware_version text
);

-- Make the table secure
alter table public.devices enable row level security;

-- Security rules:
-- 1. Users can only see their own devices
create policy "Users can view their own devices"
  on public.devices
  for select
  using (auth.uid() = owner_id);

-- 2. Users can update their own devices
create policy "Users can update their own devices"
  on public.devices
  for update
  using (auth.uid() = owner_id);

-- 3. Users can add new devices
create policy "Users can add devices"
  on public.devices
  for insert
  with check (auth.uid() = owner_id);

-- 4. Users can remove their devices
create policy "Users can delete their own devices"
  on public.devices
  for delete
  using (auth.uid() = owner_id);
```

### 3. Creating the Schedules Table
```sql
-- Schedules table stores feeding schedules
create table public.schedules (
  -- A unique ID for each schedule
  id uuid default uuid_generate_v4() primary key,
  
  -- Which device is this schedule for?
  device_id uuid references public.devices(id),
  
  -- Who created this schedule?
  user_id uuid references public.users(id),
  
  -- What time should feeding happen?
  feeding_time time not null,
  
  -- How much food to dispense?
  amount float not null,
  
  -- Which days should this schedule run?
  days_active text[] not null,
  
  -- Is this schedule currently active?
  is_active boolean default true,
  
  -- When was this schedule created?
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- When was it last changed?
  last_modified timestamp with time zone default timezone('utc'::text, now())
);

-- Make the table secure
alter table public.schedules enable row level security;

-- Security rules:
-- 1. Users can see their schedules
create policy "Users can view their schedules"
  on public.schedules
  for select
  using (auth.uid() = user_id);

-- 2. Users can update their schedules
create policy "Users can update their schedules"
  on public.schedules
  for update
  using (auth.uid() = user_id);

-- 3. Users can create new schedules
create policy "Users can create schedules"
  on public.schedules
  for insert
  with check (auth.uid() = user_id);

-- 4. Users can delete their schedules
create policy "Users can delete their schedules"
  on public.schedules
  for delete
  using (auth.uid() = user_id);
```

### 4. Creating the Feeding History Table
```sql
-- Feeding history table keeps track of all feeding events
create table public.feeding_history (
  -- A unique ID for each feeding event
  id uuid default uuid_generate_v4() primary key,
  
  -- Which device did the feeding?
  device_id uuid references public.devices(id),
  
  -- Which user triggered this feeding?
  user_id uuid references public.users(id),
  
  -- How much food was dispensed?
  amount float not null,
  
  -- When did the feeding happen?
  feed_time timestamp with time zone default timezone('utc'::text, now()),
  
  -- Was it manual, scheduled, or an error?
  feed_type text check (feed_type in ('manual', 'scheduled', 'error')),
  
  -- Did it work or fail?
  status text check (status in ('success', 'failed')),
  
  -- If it failed, what went wrong?
  error_message text
);

-- Make the table secure
alter table public.feeding_history enable row level security;

-- Security rules:
-- 1. Users can see their feeding history
create policy "Users can view their feeding history"
  on public.feeding_history
  for select
  using (auth.uid() = user_id);

-- 2. Users can record new feedings
create policy "Users can insert feeding history"
  on public.feeding_history
  for insert
  with check (auth.uid() = user_id);
```

### 5. Creating the Pet Profiles Table
```sql
-- Pet profiles table stores information about pets
create table public.pet_profiles (
  -- A unique ID for each pet
  id uuid default uuid_generate_v4() primary key,
  
  -- Who owns this pet?
  user_id uuid references public.users(id),
  
  -- Which feeder is for this pet?
  device_id uuid references public.devices(id),
  
  -- Pet's name
  name text not null,
  
  -- Pet details
  breed text,
  weight float,
  age integer,
  
  -- How much food should they get?
  feeding_amount float,
  
  -- Link to pet's photo
  photo_url text,
  
  -- When was this profile created?
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- When was it last updated?
  last_modified timestamp with time zone default timezone('utc'::text, now())
);

-- Make the table secure
alter table public.pet_profiles enable row level security;

-- Security rules:
-- 1. Users can see their pets
create policy "Users can view their pet profiles"
  on public.pet_profiles
  for select
  using (auth.uid() = user_id);

-- 2. Users can update their pets' info
create policy "Users can update their pet profiles"
  on public.pet_profiles
  for update
  using (auth.uid() = user_id);

-- 3. Users can add new pets
create policy "Users can create pet profiles"
  on public.pet_profiles
  for insert
  with check (auth.uid() = user_id);

-- 4. Users can remove pets
create policy "Users can delete their pet profiles"
  on public.pet_profiles
  for delete
  using (auth.uid() = user_id);
```

## Testing Your Setup

### 1. Check Your Tables
After running all the SQL commands:
1. Click "Table Editor" in the left sidebar
2. You should see all 5 tables listed
3. Click each table to make sure it exists and has the right columns

### 2. Test Adding Data
Try adding a test user:
1. Go to Authentication → Users
2. Click "New User"
3. Add your email and a password
4. Try to add:
   - A device
   - A pet profile
   - A feeding schedule

### 3. Common Problems and Solutions

If you see "relation does not exist":
- Make sure you created all tables
- Create them in order: users → devices → schedules → feeding_history → pet_profiles
- The order matters because tables reference each other!

If you see "permission denied":
- Check that you're signed in
- Make sure you added all the security policies
- You can only access your own data (that's good - it means security is working!)

## Need Help?

1. Join Supabase Discord: https://discord.supabase.com
2. Ask on GitHub: https://github.com/supabase/supabase/discussions
3. Email Supabase support: support@supabase.com

Remember:
- Take it slow, one table at a time
- Always create tables in the right order
- Test as you go
- It's okay to make mistakes - you can always start over!

## Starting Over

If you need to start fresh, run these commands in order:
```sql
drop table if exists pet_profiles;
drop table if exists feeding_history;
drop table if exists schedules;
drop table if exists devices;
drop table if exists users;
```

Then start again from the beginning. Good luck!