import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';

/**
 * Custom hook for authentication
 * This is a wrapper around the useAuth hook from AuthContext
 */
export function useAuth() {
  const auth = useAuthContext();
  
  // Map Supabase user id to uid for backward compatibility
  if (auth.currentUser && !auth.currentUser.uid) {
    Object.defineProperty(auth.currentUser, 'uid', {
      get() { return this.id; }
    });
  }
  
  return auth;
}

export default useAuth;