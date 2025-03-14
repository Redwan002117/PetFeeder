import { createClient } from '@supabase/supabase-js';

// Define our configuration values
const config = {
  url: 'https://ufdzxfsqhylfiikrmvzu.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZHp4ZnNxaHlsZmlpa3Jtdnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjM0MDksImV4cCI6MjA1NzI5OTQwOX0.AKH0NUZbScCq-sBPZUHxwBzUVUtnVafAdsYEVmDSwhw'
};

// Create and export the Supabase client
export const supabase = createClient(config.url, config.key);
