import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
}

export function useDeviceData(deviceId: string | null) {
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  let subscription: RealtimeChannel | null = null;

  useEffect(() => {
    if (!deviceId) {
      setDevice(null);
      setLoading(false);
      return;
    }

    async function fetchDeviceData() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('devices')
          .select('*')
          .eq('id', deviceId)
          .single();
        
        if (error) {
          throw error;
        }
        
        setDevice(data);
        
        // Subscribe to realtime changes
        subscription = supabase
          .channel(`device_${deviceId}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'devices',
            filter: `id=eq.${deviceId}` 
          }, payload => {
            setDevice(currentDevice => {
              if (!currentDevice) return payload.new as DeviceData;
              return {
                ...currentDevice,
                ...(payload.new as Partial<DeviceData>)
              };
            });
          })
          .subscribe();
          
      } catch (err: any) {
        console.error('Error fetching device data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDeviceData();

    // Cleanup function
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [deviceId]);

  const updateDevice = async (updates: Partial<DeviceData>) => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setDevice(data);
      return data;
    } catch (err: any) {
      console.error('Error updating device:', err);
      setError(err);
      throw err;
    }
  };

  const refreshData = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single();
      
      if (error) throw error;
      setDevice(data);
    } catch (err: any) {
      console.error('Error refreshing device data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    device,
    loading,
    error,
    updateDevice,
    refreshData,
    isOnline: device ? device.status === 'online' : false
  };
}
