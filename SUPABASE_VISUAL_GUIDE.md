# Visual Guide: Setting Up Supabase Database from Scratch

## Introduction
This guide will walk you through setting up your Supabase database with clear screenshots and explanations. No coding experience required!

## Step 1: Create Supabase Account

1. Open your web browser and go to https://supabase.com
2. Click the "Start your project" button at the top right
   ![Supabase Homepage](https://i.imgur.com/example1.png)

3. You can sign up using your GitHub account (recommended) or email
   ![Sign Up Options](https://i.imgur.com/example2.png)

## Step 2: Create Your First Project

1. After signing in, click "New Project"
   ![New Project Button](https://i.imgur.com/example3.png)

2. Fill in your project details:
   - Name: "pet-feeder-app" (or any name you like)
   - Database Password: Create a strong password (save this somewhere safe!)
   - Region: Choose the closest to your location
   - Pricing Plan: Free tier
   ![Create Project Form](https://i.imgur.com/example4.png)

3. Click "Create new project" and wait a minute or two

## Step 3: Create Database Tables

1. In your project dashboard, click "SQL Editor" in the left sidebar
   ![SQL Editor](https://i.imgur.com/example5.png)

2. Click "New Query"
   ![New Query Button](https://i.imgur.com/example6.png)

3. Copy and paste these commands ONE AT A TIME and click "RUN" after each one:

First, create the users table:
```sql
-- First, create the users table
create table public.users (
  id uuid references auth.users not null primary key,
  role text check (role in ('admin', 'user')) default 'user',
  email text,
  username text,
  name text,
  email_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  device_id text,
  permissions jsonb default '{"canFeed": true, "canSchedule": true, "canViewStats": true}'::jsonb
);

-- Make the table secure
alter table public.users enable row level security;

-- Add security rules
create policy "Users can view their own data"
  on public.users
  for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on public.users
  for update
  using (auth.uid() = id);

create policy "Users can insert their own data"
  on public.users
  for insert
  with check (auth.uid() = id);
```

Next, create the devices table:
```sql
-- Create devices table
create table public.devices (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_active timestamp with time zone,
  status text default 'offline',
  config jsonb default '{}'::jsonb,
  firmware_version text
);

-- Make it secure
alter table public.devices enable row level security;

-- Add security rules
create policy "Users can view their own devices"
  on public.devices
  for select
  using (auth.uid() = owner_id);

create policy "Users can update their own devices"
  on public.devices
  for update
  using (auth.uid() = owner_id);

create policy "Users can add devices"
  on public.devices
  for insert
  with check (auth.uid() = owner_id);

create policy "Users can delete their own devices"
  on public.devices
  for delete
  using (auth.uid() = owner_id);
```

Then, create the schedules table:
```sql
-- Create feeding schedules table
create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  device_id uuid references public.devices(id),
  user_id uuid references public.users(id),
  feeding_time time not null,
  amount float not null,
  days_active text[] not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_modified timestamp with time zone default timezone('utc'::text, now())
);

-- Make it secure
alter table public.schedules enable row level security;

-- Add security rules
create policy "Users can view their schedules"
  on public.schedules
  for select
  using (auth.uid() = user_id);

create policy "Users can update their schedules"
  on public.schedules
  for update
  using (auth.uid() = user_id);

create policy "Users can create schedules"
  on public.schedules
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their schedules"
  on public.schedules
  for delete
  using (auth.uid() = user_id);
```

Create the feeding history table:
```sql
-- Create feeding history table
create table public.feeding_history (
  id uuid default uuid_generate_v4() primary key,
  device_id uuid references public.devices(id),
  user_id uuid references public.users(id),
  amount float not null,
  feed_time timestamp with time zone default timezone('utc'::text, now()),
  feed_type text check (feed_type in ('manual', 'scheduled', 'error')),
  status text check (status in ('success', 'failed')),
  error_message text
);

-- Make it secure
alter table public.feeding_history enable row level security;

-- Add security rules
create policy "Users can view their feeding history"
  on public.feeding_history
  for select
  using (auth.uid() = user_id);

create policy "Users can insert feeding history"
  on public.feeding_history
  for insert
  with check (auth.uid() = user_id);
```

Finally, create the pet profiles table:
```sql
-- Create pet profiles table
create table public.pet_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  device_id uuid references public.devices(id),
  name text not null,
  breed text,
  weight float,
  age integer,
  feeding_amount float,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_modified timestamp with time zone default timezone('utc'::text, now())
);

-- Make it secure
alter table public.pet_profiles enable row level security;

-- Add security rules
create policy "Users can view their pet profiles"
  on public.pet_profiles
  for select
  using (auth.uid() = user_id);

create policy "Users can update their pet profiles"
  on public.pet_profiles
  for update
  using (auth.uid() = user_id);

create policy "Users can create pet profiles"
  on public.pet_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their pet profiles"
  on public.pet_profiles
  for delete
  using (auth.uid() = user_id);
```

## Step 4: Verify Your Tables

1. Click "Table Editor" in the left sidebar
   ![Table Editor](https://i.imgur.com/example7.png)

2. You should see all 5 tables:
   - users
   - devices
   - schedules
   - feeding_history
   - pet_profiles
   ![Tables List](https://i.imgur.com/example8.png)

## Step 5: Enable Authentication

1. Click "Authentication" in the left sidebar
   ![Authentication Menu](https://i.imgur.com/example9.png)

2. Click "Providers"
   ![Providers Tab](https://i.imgur.com/example10.png)

3. Make sure "Email" is enabled and toggle it on if it isn't
   ![Email Provider](https://i.imgur.com/example11.png)

## Step 6: Get Your API Keys

1. Click "Project Settings" (gear icon) in the left sidebar
   ![Project Settings](https://i.imgur.com/example12.png)

2. Click "API" in the settings menu
   ![API Settings](https://i.imgur.com/example13.png)

3. You'll see two important pieces of information:
   - Project URL
   - anon/public key
   
   Save these somewhere safe - you'll need them to connect your app to Supabase!
   ![API Keys](https://i.imgur.com/example14.png)

## Testing Your Setup

### Create a Test User

1. Go to Authentication → Users
2. Click "New User"
3. Fill in:
   - Email: your email
   - Password: a test password
4. Click "Create User"

### Try Adding Data

1. Go to Table Editor
2. Click on the "users" table
3. You should see your test user
4. Try adding:
   - A device in the devices table
   - A feeding schedule in the schedules table
   - A pet profile in the pet_profiles table

## Common Problems & Solutions

### "Error: relation does not exist"
- Make sure you ran ALL the SQL commands
- Check the Table Editor to verify all tables exist
- Run the commands again if needed

### "Error: permission denied"
- Make sure you added all the security policies
- Check that you're signed in
- Verify the user ID matches

### Tables are empty
- This is normal for a new database
- Add test data through the Table Editor
- Make sure you're signed in to see your data

## Need More Help?

If you get stuck:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Join the [Supabase Discord](https://discord.supabase.com)
3. Ask questions on [GitHub](https://github.com/supabase/supabase/discussions)

Remember: It's okay to make mistakes! You can always delete tables and start over:
```sql
drop table pet_profiles;
drop table feeding_history;
drop table schedules;
drop table devices;
drop table users;
```

Just make sure to create them again in the correct order (users first, then devices, etc.)!