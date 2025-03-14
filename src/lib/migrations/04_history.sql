-- Create feeding history table
CREATE TABLE IF NOT EXISTS public.feeding_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id uuid REFERENCES public.devices(id) ON DELETE CASCADE,
    feed_time timestamp with time zone NOT NULL,
    portions integer,
    success boolean DEFAULT true,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);