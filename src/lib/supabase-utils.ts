import { supabase } from './supabase-config'
import { PostgrestError, RealtimeChannel } from '@supabase/supabase-js'

// Type for handling Supabase responses
type SupabaseResponse<T> = {
  data: T | null
  error: PostgrestError | null
}

// Equivalent to Firebase's safeGet
export const safeGet = async <T>(
  table: string,
  query?: { [key: string]: any }
): Promise<T | null> => {
  try {
    let queryBuilder = supabase.from(table).select('*');
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    return data as T;
  } catch (error) {
    console.error(`Error fetching from ${table}:`, error);
    return null;
  }
};

// Equivalent to Firebase's safeSet
export const safeSet = async <T>(
  table: string,
  data: Partial<T>,
  id?: string
): Promise<T | null> => {
  try {
    let response: SupabaseResponse<T>
    
    if (id) {
      response = await supabase
        .from(table)
        .upsert({ id, ...data })
        .select()
        .single()
    } else {
      response = await supabase
        .from(table)
        .insert(data)
        .select()
        .single()
    }
    
    if (response.error) throw response.error
    return response.data
  } catch (error) {
    console.error(`Error setting data in ${table}:`, error)
    return null
  }
}

// Equivalent to Firebase's safeUpdate
export const safeUpdate = async <T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return false;
  }
};

// Equivalent to Firebase's safePush
export const safePush = async <T>(
  table: string,
  data: T
): Promise<string | null> => {
  try {
    const { data: inserted, error } = await supabase
      .from(table)
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return inserted.id;
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return null;
  }
};

// Equivalent to Firebase's safeRemove
export const safeRemove = async (
  table: string,
  id: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return false;
  }
};

// Equivalent to Firebase's real-time subscriptions
export const subscribeToChanges = (
  table: string,
  callback: (payload: any) => void
) => {
  const subscription = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}

// Equivalent to Firebase's safeOnValue
export const safeOnValue = (
  table: string,
  callback: (data: any) => void
): RealtimeChannel => {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

// Add new utility functions for pages
export const getDeviceData = async (userId: string) => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const getFeedingSchedule = async (userId: string) => {
  const { data, error } = await supabase
    .from('feeding_schedules')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const subscribeToDevice = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('device_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};

// Authentication helper functions
export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },
  
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw error
    return data
  },
  
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  
  updateProfile: async (updates: { email?: string; password?: string; data?: object }) => {
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) throw error
    return data
  },
  
  sendVerificationEmail: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },
  
  onAuthStateChange: (callback: (session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session)
    })
  }
}