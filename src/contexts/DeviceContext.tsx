import React, { createContext, useContext, useState, useEffect } from 'react';
import { Device, getDevices } from '@/lib/device-api';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

// Updated interface with properly typed methods
export interface DeviceContextType {
  devices: Device[];
  selectedDevice: Device | null;
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  selectDevice: (deviceId: string | null) => void;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  databaseAvailable: boolean;
  device: DeviceData | null;
  deleteDevice: (deviceId: string) => Promise<void>;
  selectedDeviceId: string | null;
  updateWiFiConfig: (ssid: string, password: string) => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
};

// Adding proper type for children props
interface DeviceProviderProps {
  children: React.ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseAvailable, setDatabaseAvailable] = useState(false);
  
  const { currentUser } = useAuth();

  const refreshDevices = async () => {
    if (!currentUser) {
      setDevices([]);
      setSelectedDevice(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedDevices = await getDevices();
      setDevices(fetchedDevices);
      setDatabaseAvailable(true);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load devices. Please try again later.');
      setDatabaseAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const selectDevice = (deviceId: string | null) => {
    if (!deviceId) {
      setSelectedDevice(null);
      return;
    }
    
    const device = devices.find(d => d.id === deviceId) || null;
    setSelectedDevice(device);
  };

  const updateDevice = async (id: string, updates: Partial<Device>) => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      setDevices(prevDevices => 
        prevDevices.map(d => d.id === id ? { ...d, ...updates } : d)
      );
      
      if (selectedDevice?.id === id) {
        setSelectedDevice(prev => prev ? { ...prev, ...updates } : null);
      }
      
    } catch (err) {
      console.error('Error updating device:', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshDevices();
  }, [currentUser]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!currentUser) return;
    
    const subscription = supabase
      .channel('device-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'devices' 
      }, payload => {
        refreshDevices();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  const value = {
    devices,
    selectedDevice,
    loading,
    error,
    refreshDevices,
    selectDevice,
    updateDevice,
    databaseAvailable,
    device: null,
    deleteDevice: async (deviceId: string) => {},
    selectedDeviceId: null,
    updateWiFiConfig: async (ssid: string, password: string) => {}
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};