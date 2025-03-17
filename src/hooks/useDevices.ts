import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface DeviceData {
  id: string;
  name: string;
  mac_address: string;
  status: string;
  model?: string;
  firmware_version?: string;
  food_level?: number;
  battery_level?: number;
  wifi_strength?: number;
  last_seen?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceContextType {
  devices: DeviceData[];
  loading: boolean;
  error: Error | null;
  refreshDevices: () => Promise<void>;
  updateDevice: (deviceId: string, updates: Partial<DeviceData>) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
}

export const useDevices = (): DeviceContextType => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  // Fetch devices on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      fetchDevices();
    } else {
      setDevices([]);
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch devices from Supabase
  const fetchDevices = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('owner_id', currentUser.id);
      
      if (error) throw error;
      
      setDevices(data || []);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Update device
  const updateDevice = async (deviceId: string, updates: Partial<DeviceData>) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId);
      
      if (error) throw error;
      
      // Update local state
      setDevices(prev => 
        prev.map(device => 
          device.id === deviceId 
            ? { ...device, ...updates } 
            : device
        )
      );
    } catch (err) {
      console.error('Error updating device:', err);
      throw err;
    }
  };

  // Delete device
  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);
      
      if (error) throw error;
      
      // Update local state
      setDevices(prev => prev.filter(device => device.id !== deviceId));
    } catch (err) {
      console.error('Error deleting device:', err);
      throw err;
    }
  };

  return {
    devices,
    loading,
    error,
    refreshDevices: fetchDevices,
    updateDevice,
    deleteDevice
  };
};

export default useDevices;
