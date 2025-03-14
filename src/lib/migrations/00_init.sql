-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    email text,
    role text DEFAULT 'user',
    username text,
    name text,
    email_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    device_id text,
    PRIMARY KEY (id),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'user'))
);