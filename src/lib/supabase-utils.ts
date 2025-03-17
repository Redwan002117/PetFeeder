/**
 * Utility functions for working with Supabase
 */
import { supabase } from './supabase';

/**
 * Safe function to fetch data from a table by ID
 */
export async function safeGet<T = any>(tableName: string, id?: string): Promise<T | null> {
  try {
    if (!id) {
      return null;
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return null;
    }
    
    return data as T;
  } catch (err) {
    console.error(`Error in safeGet for ${tableName}:`, err);
    return null;
  }
}

/**
 * Safe function to update a record in a table
 */
export async function safeUpdate<T = any>(tableName: string, id: string, data: Partial<T>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id);
      
    if (error) {
      console.error(`Error updating ${tableName}:`, error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error(`Error in safeUpdate for ${tableName}:`, err);
    return false;
  }
}

/**
 * Safe function to insert a record and return the newly created record
 */
export async function safeInsert<T = any>(tableName: string, data: Omit<T, 'id'>): Promise<T | null> {
  try {
    const { data: newRecord, error } = await supabase
      .from(tableName)
      .insert([data])
      .select()
      .single();
      
    if (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      return null;
    }
    
    return newRecord as T;
  } catch (err) {
    console.error(`Error in safeInsert for ${tableName}:`, err);
    return null;
  }
}

/**
 * Safe function to delete a record
 */
export async function safeDelete(tableName: string, id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error(`Error in safeDelete for ${tableName}:`, err);
    return false;
  }
}

/**
 * Safe function to list records from a table
 */
export async function safeList<T = any>(tableName: string, options?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}): Promise<T[] | null> {
  try {
    let query = supabase.from(tableName).select('*');
    
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options?.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.orderDirection !== 'desc'
      });
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error listing ${tableName}:`, error);
      return null;
    }
    
    return data as T[];
  } catch (err) {
    console.error(`Error in safeList for ${tableName}:`, err);
    return null;
  }
}

/**
 * Get a server timestamp that's compatible with Supabase
 */
export function serverTimestamp() {
  return new Date().toISOString();
}
