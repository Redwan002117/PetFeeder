import React, { createContext, useContext, useState, useEffect } from 'react';
import { off } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { database, initializeFirebase } from '@/lib/firebase';
import { safeRef, safeSet, safeUpdate, safeOnValue } from '@/lib/firebase-utils';

// Ensure Firebase is initialized
initializeFirebase();

interface DeviceData {
  name: string;
  status: string;
  foodLevel: number;
  lastSeen: number;
  wifiConfig?: {
    ssid: string;
    password: string;
    hotspotEnabled: boolean;
    hotspotName: string;
    hotspotPassword: string;
  };
}

interface DeviceContextType {
  device: DeviceData | null;
  loading: boolean;
  updateWiFiConfig: (config: DeviceData['wifiConfig']) => Promise<void>;
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

    setLoading(true);

    // Make sure Firebase is initialized
    initializeFirebase();

    // If database is not available, show an error
    if (!database) {
      console.error('Firebase database is not available');
      setDatabaseAvailable(false);
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the device database. Please try again later.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Database is available
    setDatabaseAvailable(true);

    // Use our safe onValue function instead of direct onValue
    const unsubscribe = safeOnValue(
      `devices/${currentUser.uid}`,
      (snapshot: any) => {
        setLoading(false);
        if (snapshot.exists()) {
          setDevice(snapshot.val());
        } else {
          // Create a default device if none exists
          const defaultDevice: DeviceData = {
            name: 'My PetFeeder',
            status: 'offline',
            foodLevel: 0,
            lastSeen: Date.now(),
            wifiConfig: {
              ssid: '',
              password: '',
              hotspotEnabled: false,
              hotspotName: 'PetFeeder_' + currentUser.uid.substring(0, 5),
              hotspotPassword: 'petfeeder'
            }
          };
          
          safeSet(`devices/${currentUser.uid}`, defaultDevice)
            .then((success) => {
              if (success) {
                setDevice(defaultDevice);
              } else {
                console.error('Failed to create default device');
                toast({
                  title: 'Error',
                  description: 'Failed to create your device profile. Please try again later.',
                  variant: 'destructive',
                });
              }
            })
            .catch(error => {
              console.error('Error creating default device:', error);
              toast({
                title: 'Error',
                description: 'Failed to create your device profile. Please try again later.',
                variant: 'destructive',
              });
            });
        }
      },
      (error: any) => {
        console.error('Error fetching device data:', error);
        setLoading(false);
        setDatabaseAvailable(false);
        toast({
          title: 'Connection Error',
          description: 'Could not fetch device data. Please check your connection and try again.',
          variant: 'destructive',
        });
      }
    );

    return () => {
      // Clean up the listener
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, toast]);

  const updateWiFiConfig = async (config: DeviceData['wifiConfig']) => {
    if (!currentUser || !device) {
      toast({
        title: 'Error',
        description: 'You must be logged in and have a device to update WiFi settings.',
        variant: 'destructive',
      });
      return;
    }

    if (!databaseAvailable) {
      toast({
        title: 'Connection Error',
        description: 'Database is not available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const success = await safeUpdate(`devices/${currentUser.uid}/wifiConfig`, config);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'WiFi configuration updated successfully.',
          variant: 'default',
        });
      } else {
        throw new Error('Failed to update WiFi configuration');
      }
    } catch (error) {
      console.error('Error updating WiFi config:', error);
      toast({
        title: 'Error',
        description: 'Failed to update WiFi configuration. Please try again.',
        variant: 'destructive',
      });
    }
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

    if (!databaseAvailable) {
      toast({
        title: 'Connection Error',
        description: 'Database is not available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const success = await safeUpdate(`devices/${currentUser.uid}`, { name });
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Device name updated successfully.',
          variant: 'default',
        });
      } else {
        throw new Error('Failed to update device name');
      }
    } catch (error) {
      console.error('Error updating device name:', error);
      toast({
        title: 'Error',
        description: 'Failed to update device name. Please try again.',
        variant: 'destructive',
      });
    }
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

    if (!databaseAvailable) {
      toast({
        title: 'Connection Error',
        description: 'Database is not available. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const feedingRef = safeRef(`feeding_requests/${currentUser.uid}`);
      if (!feedingRef) {
        throw new Error('Failed to create feeding request reference');
      }
      
      const success = await safeSet(feedingRef, {
        amount,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      if (success) {
        toast({
          title: 'Success',
          description: `Feeding request sent (${amount} units).`,
          variant: 'default',
        });
      } else {
        throw new Error('Failed to send feeding request');
      }
    } catch (error) {
      console.error('Error triggering feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to send feeding request. Please try again.',
        variant: 'destructive',
      });
    }
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