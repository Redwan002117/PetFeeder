# Firebase to Supabase Migration Guide

## Overview
This document outlines the step-by-step process for migrating from Firebase to Supabase in our application.

## Steps

### 1. Setup and Installation

1. Remove Firebase dependencies from package.json:
   - @firebase/app
   - @firebase/auth
   - @firebase/firestore
   - firebase

2. Install Supabase dependencies:
   ```bash
   npm install @supabase/supabase-js
   ```

3. Create a Supabase project:
   - Go to https://app.supabase.com
   - Create a new project
   - Note down the project URL and anon key

### 2. Configuration Setup

1. Create a new file `src/lib/supabase-config.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

2. Update environment variables:
   - Remove Firebase config variables
   - Add Supabase variables to .env:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Database Migration

1. Schema Migration:
   - Create equivalent tables in Supabase for your Firebase collections
   - Set up Row Level Security (RLS) policies
   - Example user table:
   ```sql
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
   ```

2. Data Migration:
   - Export data from Firebase
   - Transform data to match Supabase schema
   - Import data into Supabase

### 4. Authentication Migration

1. Update AuthContext.tsx:
   - Replace Firebase auth with Supabase auth
   - Update sign-in, sign-up, and sign-out methods
   - Modify user session management

2. Key methods to update:
   - login
   - loginWithGoogle
   - register
   - logout
   - updateUserProfile
   - sendVerificationEmailToUser
   - checkVerificationStatus

### 5. Database Operations Migration

1. Replace Firebase Realtime Database operations with Supabase equivalents:
   - `safeGet` → `supabase.from('table').select()`
   - `safeSet` → `supabase.from('table').insert()`
   - `safeUpdate` → `supabase.from('table').update()`
   - Real-time subscriptions using `supabase.from('table').on()`

### 6. Storage Migration

1. If using Firebase Storage:
   - Set up Supabase Storage buckets
   - Migrate files to Supabase Storage
   - Update storage-related operations

### 7. Testing and Validation

1. Test all migrated functionality:
   - Authentication flows
   - CRUD operations
   - Real-time updates
   - File storage operations

2. Update test files to use Supabase instead of Firebase

### 8. Deployment Updates

1. Update deployment scripts:
   - Remove Firebase deployment commands
   - Update environment variables in deployment platforms

2. Test deployment pipeline

## Important Considerations

1. **Backup Strategy**:
   - Keep Firebase as fallback during initial deployment
   - Implement feature flags for gradual rollout

2. **Security**:
   - Review and implement RLS policies
   - Set up proper authentication rules
   - Configure proper CORS settings

3. **Performance**:
   - Test real-time subscription performance
   - Monitor query performance
   - Set up proper indexes

4. **Cost Optimization**:
   - Review Supabase pricing tiers
   - Optimize queries and storage usage
   - Monitor usage patterns

## Migration Checklist

- [ ] Create Supabase project
- [ ] Set up environment variables
- [ ] Migrate database schema
- [ ] Migrate authentication
- [ ] Update database operations
- [ ] Migrate storage (if applicable)
- [ ] Test all functionality
- [ ] Update deployment configuration
- [ ] Monitor performance and costs