# Step-by-Step Supabase Setup Guide for Beginners

This guide will walk you through setting up your Supabase database from absolute scratch, with detailed explanations for each step.

## 1. Creating Your Supabase Account and Project

### Step 1.1: Sign Up for Supabase
1. Go to https://supabase.com
2. Click "Start your project" or "Sign Up"
3. You can sign up using your GitHub account (recommended) or email

### Step 1.2: Create a New Project
1. After logging in, click "New Project"
2. Fill in the following details:
   - Name: Choose a name for your project (e.g., "pet-feeder-app")
   - Database Password: Create a strong password and save it somewhere safe
   - Region: Choose the region closest to your users
   - Pricing Plan: Start with the Free tier
3. Click "Create New Project" and wait for setup to complete (usually takes 1-2 minutes)

## 2. Setting Up Your Database Tables

### Step 2.1: Access SQL Editor
1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query" to create a new SQL query

### Step 2.2: Create Tables
Copy and paste each section of code below into the SQL editor and click "RUN" after each one.

First, create the users table:
```sql
-- Users table stores user information
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

-- This makes the table secure
alter table public.users enable row level security;

-- These rules determine who can do what with the table
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

Then create the devices table:
```sql
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

alter table public.devices enable row level security;

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

Next, create the schedules table:
```sql
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

alter table public.schedules enable row level security;

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

alter table public.feeding_history enable row level security;

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

alter table public.pet_profiles enable row level security;

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

## 3. Setting Up Authentication

### Step 3.1: Enable Email Authentication
1. Go to "Authentication" in the left sidebar
2. Click "Providers"
3. Make sure "Email" is enabled
4. You can customize email templates under "Email Templates"

### Step 3.2: Get Your API Keys
1. Go to "Project Settings" in the left sidebar
2. Click "API"
3. You'll see your:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

## 4. Testing Your Setup

### Step 4.1: Create a Test User
1. Go to "Authentication" → "Users"
2. Click "Invite user"
3. Enter an email address
4. User will receive an email to set their password

### Step 4.2: Test the Database Tables
1. Go to "Table Editor" in the left sidebar
2. You should see all the tables you created
3. Try to:
   - Add a test device
   - Create a feeding schedule
   - Add a pet profile

### Step 4.3: View API Documentation
1. Go to "API Docs" in the left sidebar
2. Here you can see examples of how to interact with your tables
3. The documentation is automatically generated based on your table structure

## Common Questions & Solutions

### What if I make a mistake?
- You can delete tables and start over using: `drop table table_name;`
- Be careful with the order of deletion due to references between tables

### Why can't I see my data?
- Make sure you're signed in
- Check that the Row Level Security (RLS) policies are set up correctly
- Verify you're using the correct user ID when querying

### What are the most important security considerations?
1. Never share your service_role key
2. Always use RLS policies
3. Test your security by trying to access data as different users

## Next Steps

1. Connect your application to Supabase:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Set up your environment variables:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Start building your application features using the Supabase client

Remember: Take your time to understand each step. It's okay to make mistakes - you can always delete tables and start over if needed.

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Discord Community: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues