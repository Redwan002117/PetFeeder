import { supabase } from './supabase';

/**
 * User authentication and management functions
 */

export async function deleteUserAccount(userId: string, password: string): Promise<void> {
  try {
    // Verify the password first
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password
    });
    
    if (authError) throw new Error("Password is incorrect");
    
    // Delete user data and profile
    await supabase.from('feeding_schedules').delete().eq('created_by', userId);
    await supabase.from('device_settings').delete().eq('created_by', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    
    // Delete the user account
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    
    // Sign out
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
}

export async function uploadProfilePicture(file: Blob & { name?: string }): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Generate a random file name if none exists
    const fileExt = (file.name?.split('.').pop() || 'png').toLowerCase();
    const fileName = `profile-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    // Update user profile with new avatar URL
    await supabase.from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
      
    return publicUrl;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
}

/**
 * Device management functions
 */

// Get a list of user's devices
export async function getDevices(userId: string) {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('owner_id', userId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting devices:", error);
    throw error;
  }
}

// Get last feeding for a device
export async function getLastFeeding(deviceId: string) {
  try {
    const { data, error } = await supabase
      .from('feeding_history')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error("Error getting last feeding:", error);
    return null;
  }
}

// Get device status
export function getDeviceStatus(userId: string, callback: (status: any) => void) {
  try {
    // Initial fetch
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('device_status')
        .select('*')
        .eq('owner_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      callback(data || { online: false });
    };
    
    fetchStatus();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`device_status:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'device_status',
        filter: `owner_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new || { online: false });
      })
      .subscribe();
      
    // Return unsubscribe function
    return () => { subscription.unsubscribe(); };
  } catch (error) {
    console.error("Error getting device status:", error);
    callback({ online: false });
    return () => {};
  }
}

// Get WiFi networks
export function getWifiNetworks(userId: string, callback: (data: any) => void) {
  try {
    // Initial fetch
    const fetchNetworks = async () => {
      const { data, error } = await supabase
        .from('wifi_networks')
        .select('*')
        .eq('owner_id', userId);
        
      if (error) throw error;
      callback({ networks: data || [] });
    };
    
    fetchNetworks();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`wifi_networks:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wifi_networks',
        filter: `owner_id=eq.${userId}`
      }, () => {
        fetchNetworks();
      })
      .subscribe();
      
    // Return unsubscribe function
    return () => { subscription.unsubscribe(); };
  } catch (error) {
    console.error("Error getting WiFi networks:", error);
    callback({ networks: [] });
    return () => {};
  }
}

// Set WiFi credentials
export async function setWifiCredentials(userId: string, ssid: string, password: string) {
  try {
    const { error } = await supabase
      .from('device_commands')
      .insert({
        owner_id: userId,
        command_type: 'set_wifi',
        params: { ssid, password },
        status: 'pending',
        created_at: new Date().toISOString()
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error setting WiFi credentials:", error);
    throw error;
  }
}

/**
 * Feeding related functions
 */

// Get feeding schedule
export function getFeedingSchedule(userId: string, callback: (schedules: any[]) => void) {
  try {
    // Initial fetch
    const fetchSchedules = async () => {
      const { data, error } = await supabase
        .from('feeding_schedules')
        .select('*')
        .eq('owner_id', userId);
        
      if (error) throw error;
      callback(data || []);
    };
    
    fetchSchedules();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`feeding_schedules:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feeding_schedules',
        filter: `owner_id=eq.${userId}`
      }, () => {
        fetchSchedules();
      })
      .subscribe();
      
    // Return unsubscribe function
    return () => { subscription.unsubscribe(); };
  } catch (error) {
    console.error("Error getting feeding schedule:", error);
    callback([]);
    return () => {};
  }
}

// Get feeding history
export function getFeedingHistory(userId: string, callback: (history: any[]) => void) {
  try {
    // Initial fetch
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('feeding_history')
        .select('*')
        .eq('owner_id', userId)
        .order('timestamp', { ascending: false });
        
      if (error) throw error;
      callback(data || []);
    };
    
    fetchHistory();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`feeding_history:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feeding_history',
        filter: `owner_id=eq.${userId}`
      }, () => {
        fetchHistory();
      })
      .subscribe();
      
    // Return unsubscribe function
    return () => { subscription.unsubscribe(); };
  } catch (error) {
    console.error("Error getting feeding history:", error);
    callback([]);
    return () => {};
  }
}

// Trigger manual feeding
export async function triggerManualFeed(userId: string, amount: number) {
  try {
    const { error } = await supabase
      .from('feed_commands')
      .insert({
        owner_id: userId,
        amount,
        type: 'manual',
        status: 'pending',
        created_at: new Date().toISOString()
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error triggering manual feed:", error);
    throw error;
  }
}

/**
 * Admin functions
 */

// Get all users (admin only)
export function getAllUsers(callback: (users: any[]) => void) {
  try {
    // Helper function to fetch users data
    const fetchUsers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();
        
      if (!profile?.is_admin) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      // Fetch all users
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) throw error;
      callback(data || []);
    };
    
    // Initial fetch
    fetchUsers();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchUsers();
      })
      .subscribe();
      
    // Return unsubscribe function
    return () => { subscription.unsubscribe(); };
  } catch (error) {
    console.error("Error getting all users:", error);
    callback([]);
    return () => {};
  }
}

// Update user role (admin only)
export async function updateUserRole(userId: string, isAdmin: boolean) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if current user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single();
      
    if (!profile?.is_admin) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    // Update user role
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

// Delete all non-admin users (admin only)
export async function deleteAllUsers() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if current user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single();
      
    if (!profile?.is_admin) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    // Get all non-admin users
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', false);
      
    if (fetchError) throw fetchError;
    
    // Delete each user
    for (const userToDelete of users || []) {
      await deleteUserAccount(userToDelete.id, '');
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting all users:", error);
    throw error;
  }
}
