import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserData extends User {
  role?: string;
}

interface AuthHook {
  user: UserData | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = (): AuthHook => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get additional user data from Supabase
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (userError) throw userError;

          const enhancedUser = {
            ...session.user,
            role: userData?.role || 'user'
          };

          setUser(enhancedUser);
          setIsAdmin(userData?.role === 'admin');
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            // Get additional user data from Supabase
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (userError) throw userError;

            const enhancedUser = {
              ...session.user,
              role: userData?.role || 'user'
            };

            setUser(enhancedUser);
            setIsAdmin(userData?.role === 'admin');
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isAdmin, isLoading, error };
};
