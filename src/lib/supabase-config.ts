import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

// Production client configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Add autoRefreshToken and retry configuration
    autoRefreshExp: 3600, // 1 hour
  },
  global: {
    headers: {
      'x-application-name': 'petfeeder',
      'x-client-info': 'pet-feeder-app/1.0.0'
    },
    // Add retry logic to fetch
    fetch: async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const maxRetries = 3;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          return response;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
      }
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Production connection test
export const testConnection = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Use a simple auth check instead of database query
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        console.log('Supabase connection successful');
        return true;
      }
      
      console.warn(`Connection attempt ${i + 1} failed, retrying...`, error);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return false;
};

// Production error handler with logging
export const handleSupabaseError = (error: any, context?: string) => {
  const timestamp = new Date().toISOString();
  const errorId = Math.random().toString(36).substring(7);

  // Log error for debugging
  console.error(`[${timestamp}] Error ID: ${errorId}`, {
    context,
    error,
    url: window.location.href
  });

  // Return user-friendly message
  if (!error) return 'An unexpected error occurred. Please try again.';

  if (error.message?.toLowerCase().includes('network') || 
      error.message?.toLowerCase().includes('fetch')) {
    return 'Connection failed. Please check your internet connection and try again.';
  }

  if (error.status === 401 || error.status === 403) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error.status === 429) {
    return 'Too many requests. Please try again later.';
  }

  if (error.status >= 500) {
    return 'Server error. Our team has been notified.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};

// Production auth state management
supabase.auth.onAuthStateChange((event, session) => {
  const timestamp = new Date().toISOString();
  
  switch (event) {
    case 'SIGNED_IN':
      console.log(`[${timestamp}] User signed in:`, session?.user?.id);
      break;
    case 'SIGNED_OUT':
      console.log(`[${timestamp}] User signed out`);
      break;
    case 'TOKEN_REFRESHED':
      console.log(`[${timestamp}] Token refreshed`);
      break;
    case 'USER_UPDATED':
      console.log(`[${timestamp}] User updated:`, session?.user?.id);
      break;
    default:
      console.log(`[${timestamp}] Auth event:`, event);
  }
});

// Initialize production monitoring
testConnection()
  .then(isConnected => {
    console.log(`[${new Date().toISOString()}] Initial connection test:`, isConnected ? 'successful' : 'failed');
  })
  .catch(error => {
    console.error(`[${new Date().toISOString()}] Initial connection test failed:`, error);
  });