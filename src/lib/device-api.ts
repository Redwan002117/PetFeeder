import { supabase } from '@/lib/supabase';

// Device types
export interface Device {
  id: string;
  name: string;
  mac_address: string;
  status: 'online' | 'offline' | 'maintenance' | 'new' | 'error';
  model?: string;
  firmware_version?: string;
  food_level?: number;
  battery_level?: number;
  wifi_strength?: number;
  last_seen?: string;
  owner_id?: string;
}

/**
 * Fetch devices owned by the current user (or all if admin)
 */
export async function getDevices() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    let query = supabase.from('devices').select('*');

    // If not admin, only show user's devices
    if (!profileData?.is_admin) {
      query = query.eq('owner_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
}

/**
 * Fetch a specific device by ID
 */
export async function getDevice(id: string) {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Device not found');
    
    return data;
  } catch (error) {
    console.error(`Error fetching device ${id}:`, error);
    throw error;
  }
}

/**
 * Claims a new device by setting the owner_id
 */
export async function claimDevice(macAddress: string): Promise<Device> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    // Find device by MAC address
    const { data: deviceData, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('mac_address', macAddress)
      .single();
    
    if (deviceError) throw deviceError;
    if (!deviceData) throw new Error('Device not found');
    
    // If device already has an owner, check if it's the current user
    if (deviceData.owner_id && deviceData.owner_id !== user.id) {
      throw new Error('Device already claimed by another user');
    }
    
    // Update the device owner
    const { data, error } = await supabase
      .from('devices')
      .update({ owner_id: user.id })
      .eq('id', deviceData.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error claiming device:', error);
    throw error;
  }
}

/**
 * Update device settings
 */
export async function updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
  try {
    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating device ${id}:`, error);
    throw error;
  }
}

/**
 * Trigger a feed command for a device
 */
export async function triggerFeed(deviceId: string, amount: number) {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Create a feed command
    const { data, error } = await supabase
      .from('feed_commands')
      .insert([{
        device_id: deviceId,
        user_id: user.id,
        amount,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error triggering feed:', error);
    throw error;
  }
}

/**
 * Get list of unassigned devices (for admin use)
 */
export async function getUnassignedDevices(): Promise<Device[]> {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .is('owner_id', null);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching unassigned devices:', error);
    throw error;
  }
}

/**
 * Check if a device is online based on its last_seen timestamp
 */
export function isDeviceOnline(device?: Device | null): boolean {
  if (!device) return false;

  // If the device has been seen in the last 5 minutes, consider it online
  if (device.last_seen) {
    const lastSeen = new Date(device.last_seen).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return lastSeen > fiveMinutesAgo;
  }

  return false;
}

/**
 * Update a device's settings
 */
export async function updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>) {
  try {
    const { data, error } = await supabase
      .from('device_settings')
      .upsert({
        device_id: deviceId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error updating device settings:', error);
    throw error;
  }
}

/**
 * Get a device's settings
 */
export async function getDeviceSettings(deviceId: string) {
  try {
    const { data, error } = await supabase
      .from('device_settings')
      .select('*')
      .eq('device_id', deviceId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching device settings:', error);
    throw error;
  }
}
