-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id text UNIQUE NOT NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    status text DEFAULT 'offline',
    last_feeding timestamp with time zone,
    next_feeding timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('online', 'offline', 'error'))
);