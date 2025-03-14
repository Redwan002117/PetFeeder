-- Create feeding schedules table
CREATE TABLE IF NOT EXISTS public.feeding_schedules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id uuid REFERENCES public.devices(id) ON DELETE CASCADE,
    feed_time time NOT NULL,
    portions integer DEFAULT 1,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);