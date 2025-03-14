import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Simple connection test function
const testConnection = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        console.log('Supabase connection successful');
        return true;
      }
      
      console.warn(`Connection attempt ${i + 1} failed, retrying...`, error);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return false;
};

interface DeviceData {
  id: string;
  created_at: string;
  owner_id: string;
  name: string;
  status: 'online' | 'offline';
  food_level: number;
  last_seen: string | null;
  wifi_config: {
    ssid: string;
    password: string;
    hotspot_enabled: boolean;
    hotspot_name: string;
    hotspot_password: string;
  };
  model?: string;
  firmware_version?: string;
}

interface DeviceContextType {
  device: DeviceData | null;
  loading: boolean;
  updateWiFiConfig: (config: DeviceData['wifi_config']) => Promise<void>;
  updateDeviceName: (name: string) => Promise<void>;
  triggerFeed: (amount: number) => Promise<void>;
  databaseAvailable: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [databaseAvailable, setDatabaseAvailable] = useState<boolean>(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setDevice(null);
      setLoading(false);
      return;
    }

    const initialize = async () => {
      setLoading(true);
      try {
        const isConnected = await testConnection();
        if (!isConnected) {
          setDatabaseAvailable(false);
          toast({
            title: 'Connection Error',
            description: 'Could not connect to the database',
            variant: 'destructive',
          });
          return;
        }
        setDatabaseAvailable(true);
        await fetchDevice();
      } catch (error) {
        console.error('Connection initialization error:', error);
        setDatabaseAvailable(false);
        toast({
          title: 'Error',
          description: 'Could not establish database connection',
          variant: 'destructive',
        });
      }
    };

    initialize();

    const fetchDevice = async () => {
      try {
        const { data, error } = await supabase
          .from('devices')
          .select('id, created_at, owner_id, name, status, food_level, last_seen, wifi_config, model, firmware_version')
          .eq('owner_id', currentUser.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setDevice(data as DeviceData);
        } else {
          // Create default device with snake_case keys
          const defaultDevice: Partial<DeviceData> = {
            name: 'My PetFeeder',
            status: 'offline',
            food_level: 0,
            wifi_config: {
              ssid: '',
              password: '',
              hotspot_enabled: false,
              hotspot_name: `PetFeeder_${currentUser.id.substring(0, 5)}`,
              hotspot_password: Math.random().toString(36).slice(-8)
            }
          };

          const { error: insertError } = await supabase
            .from('devices')
            .insert([{ 
              ...defaultDevice, 
              owner_id: currentUser.id 
            }]);

          if (insertError) {
            throw insertError;
          }

          setDevice(defaultDevice as DeviceData);
        }
      } catch (error: any) {
        console.error('Error managing device:', error);
        setDatabaseAvailable(false);
        toast({
          title: 'Error',
          description: 'Could not fetch or create device data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Set up realtime subscription
    const channel = supabase
      .channel('device_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `owner_id=eq.${currentUser.id}`
        },
        (payload) => {
          if (payload.new) {
            setDevice(payload.new as DeviceData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, toast]);

  const updateWiFiConfig = async (config: DeviceData['wifi_config']) => {
    if (!currentUser || !device) {
      toast({
        title: 'Error',
        description: 'You must be logged in and have a device to update WiFi settings.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('devices')
      .update({ wifi_config: config })
      .eq('owner_id', currentUser.id);

    if (error) {
      console.error('Error updating WiFi config:', error);
      toast({
        title: 'Error',
        description: 'Failed to update WiFi configuration',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'WiFi configuration updated successfully',
    });
  };

  const updateDeviceName = async (name: string) => {
    if (!currentUser || !device) {
      toast({
        title: 'Error',
        description: 'You must be logged in and have a device to update its name.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('devices')
      .update({ name })
      .eq('owner_id', currentUser.id);

    if (error) {
      console.error('Error updating device name:', error);
      toast({
        title: 'Error',
        description: 'Failed to update device name. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Device name updated successfully.',
      variant: 'default',
    });
  };

  const triggerFeed = async (amount: number) => {
    if (!currentUser || !device) {
      toast({
        title: 'Error',
        description: 'You must be logged in and have a device to trigger feeding.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('feeding_requests')
      .insert([{ user_id: currentUser.id, amount, timestamp: Date.now(), status: 'pending' }]);

    if (error) {
      console.error('Error triggering feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to send feeding request. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `Feeding request sent (${amount} units).`,
      variant: 'default',
    });
  };

  const value = {
    device,
    loading,
    updateWiFiConfig,
    updateDeviceName,
    triggerFeed,
    databaseAvailable
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}