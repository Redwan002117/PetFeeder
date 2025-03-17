import { supabase } from './supabase';

/**
 * Utility functions for working with Supabase that simulate Firebase API patterns
 */

export async function serverTimestamp() {
  return new Date().toISOString();
}

export const safeServerTimestamp = serverTimestamp;

/**
 * Creates a safe reference to a Supabase table
 * This is a compatibility function to emulate Firebase ref functionality
 */
export function safeRef(path: string, ...args: any[]) {
  const [collection, id, ...restPath] = path.split('/');
  return { 
    collection, 
    id, 
    path: restPath.join('/'), 
    fullPath: path 
  };
}

/**
 * Safely update a profile in the database
 */
export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

/**
 * Safe get function to retrieve data from a table
 * Overloads to support both table+id and ref patterns for compatibility
 */
export async function safeGet(tableOrRef: string | any, id?: string) {
  try {
    let table: string;
    let itemId: string | undefined;
    
    if (typeof tableOrRef === 'string') {
      table = tableOrRef;
      itemId = id;
    } else if (tableOrRef?.collection) {
      // Reference object pattern
      table = tableOrRef.collection;
      itemId = tableOrRef.id;
    } else {
      console.error("Invalid arguments to safeGet");
      return null;
    }
    
    if (itemId) {
      // Get single item
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Add Firebase-like methods
      if (data) {
        return {
          val: () => data,
          exists: () => true,
          ...data
        };
      }
      
      return {
        val: () => null,
        exists: () => false
      };
    } else {
      // Get all items from table
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) throw error;
      
      // Format data in Firebase-like structure
      const formattedData = data?.reduce((acc, item) => {
        if (item.id) {
          acc[item.id] = item;
        }
        return acc;
      }, {}) || {};
      
      return {
        val: () => formattedData,
        exists: () => data && data.length > 0,
        ...formattedData
      };
    }
  } catch (error) {
    console.error(`Error in safeGet:`, error);
    return {
      val: () => null,
      exists: () => false
    };
  }
}

/**
 * Safe update function
 */
export async function safeUpdate(tableOrRef: string | any, idOrData: string | any, updates?: any) {
  try {
    let table: string;
    let id: string;
    let updateData: any;
    
    if (typeof tableOrRef === 'string' && typeof idOrData === 'string') {
      // Format: safeUpdate('table', 'id', {updates})
      table = tableOrRef;
      id = idOrData;
      updateData = updates;
    } else if (typeof tableOrRef === 'string' && typeof idOrData === 'object') {
      // Format: safeUpdate('table/id', {updates})
      const [tableName, itemId] = tableOrRef.split('/');
      table = tableName;
      id = itemId;
      updateData = idOrData;
    } else if (tableOrRef?.collection) {
      // Reference object pattern
      table = tableOrRef.collection;
      id = tableOrRef.id;
      updateData = idOrData;
    } else {
      console.error("Invalid arguments to safeUpdate");
      return false;
    }
    
    if (!table || !id || !updateData) {
      console.error("Missing required parameters for update");
      return false;
    }
    
    const { error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error in safeUpdate:`, error);
    return false;
  }
}

/**
 * Safe remove function
 */
export async function safeRemove(tableOrRef: string | any, id?: string) {
  try {
    let table: string;
    let itemId: string;
    
    if (typeof tableOrRef === 'string' && id) {
      // Format: safeRemove('table', 'id')
      table = tableOrRef;
      itemId = id;
    } else if (typeof tableOrRef === 'string' && !id) {
      // Format: safeRemove('table/id')
      const [tableName, recordId] = tableOrRef.split('/');
      table = tableName;
      itemId = recordId;
    } else if (tableOrRef?.collection) {
      // Reference object pattern
      table = tableOrRef.collection;
      itemId = tableOrRef.id;
    } else {
      console.error("Invalid arguments to safeRemove");
      return false;
    }
    
    if (!table || !itemId) {
      console.error("Missing required parameters for remove");
      return false;
    }
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error in safeRemove:`, error);
    return false;
  }
}

/**
 * Safe insert function (push)
 */
export async function safePush(table: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result.id;
  } catch (error) {
    console.error(`Error in safePush for ${table}:`, error);
    throw error;
  }
}

/**
 * Safe set function
 */
export async function safeSet(tableOrRef: string | any, idOrData: string | any, data?: any) {
  try {
    let table: string;
    let id: string;
    let setData: any;
    
    if (typeof tableOrRef === 'string' && typeof idOrData === 'string') {
      // Format: safeSet('table', 'id', {data})
      table = tableOrRef;
      id = idOrData;
      setData = data;
    } else if (typeof tableOrRef === 'string' && typeof idOrData === 'object') {
      // Format: safeSet('table/id', {data})
      const [tableName, itemId] = tableOrRef.split('/');
      table = tableName;
      id = itemId;
      setData = idOrData;
    } else if (tableOrRef?.collection) {
      // Reference object pattern
      table = tableOrRef.collection;
      id = tableOrRef.id;
      setData = idOrData;
    } else {
      console.error("Invalid arguments to safeSet");
      return false;
    }
    
    if (!table || !id || !setData) {
      console.error("Missing required parameters for set");
      return false;
    }
    
    const { error } = await supabase
      .from(table)
      .upsert({ id, ...setData });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error in safeSet:`, error);
    return false;
  }
}

/**
 * Safe listen function for real-time updates
 */
export function safeOnValue(tableOrPath: string | any, callbackOrFilter: any, errorCallback?: (error: any) => void) {
  try {
    let table: string;
    let filter: Record<string, any> = {};
    let callback: (data: any) => void;
    
    if (typeof tableOrPath === 'string' && typeof callbackOrFilter === 'function') {
      // Format: safeOnValue('table', callback, errorCallback)
      table = tableOrPath;
      callback = callbackOrFilter;
    } else if (typeof tableOrPath === 'string' && typeof callbackOrFilter === 'object') {
      // Format: safeOnValue('table', filter, callback)
      table = tableOrPath;
      filter = callbackOrFilter;
      callback = errorCallback as any;
    } else if (tableOrPath?.collection) {
      // Reference object pattern
      table = tableOrPath.collection;
      if (tableOrPath.id) {
        filter.id = tableOrPath.id;
      }
      callback = callbackOrFilter;
    } else {
      console.error("Invalid arguments to safeOnValue");
      if (typeof errorCallback === 'function') {
        errorCallback(new Error("Invalid arguments"));
      }
      return () => {};
    }
    
    if (!table || typeof callback !== 'function') {
      console.error("Missing required parameters for onValue");
      if (typeof errorCallback === 'function') {
        errorCallback(new Error("Missing parameters"));
      }
      return () => {};
    }
    
    // First get the current data
    const fetchInitialData = async () => {
      let query = supabase.from(table).select('*');

      // Apply filters if they exist
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query;
      
      if (error) {
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
        return;
      }
      
      // Format data to match Firebase snapshot
      const formattedData = {
        val: () => {
          if (Array.isArray(data)) {
            // If filtering by ID and we have exactly one result, return just that item
            if (filter.id && data.length === 1) {
              return data[0];
            }
            
            // Otherwise return all data in an object format keyed by ID
            return data.reduce((acc, item) => {
              if (item.id) {
                acc[item.id] = item;
              }
              return acc;
            }, {});
          }
          return data;
        },
        exists: () => data && (Array.isArray(data) ? data.length > 0 : true),
        ...data
      };
      
      callback(formattedData);
    };
    
    fetchInitialData();
    
    // Set up real-time subscription
    const filterEntries = Object.entries(filter);
    const filterString = filterEntries.length > 0 
      ? filterEntries.map(([k, v]) => `${k}=eq.${v}`).join(',') 
      : undefined;
    
    const channelId = `${table}-${Object.values(filter).join('-')}`;
    
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter: filterString
      }, () => {
        fetchInitialData();
      })
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
    };
  } catch (error) {
    console.error(`Error in safeOnValue:`, error);
    if (typeof errorCallback === 'function') {
      errorCallback(error);
    }
    return () => {};
  }
}

// Database emulator detector (always false with Supabase)
export const isUsingEmulator = () => false;
