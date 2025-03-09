import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue, off, set, getDatabase } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const db = getDatabase();

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
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const deviceId = userData?.deviceId || '';
    
    if (!deviceId) {
      setLoading(false);
      return;
    }

    const deviceRef = ref(db, `devices/${deviceId}`);
    onValue(deviceRef, (snapshot) => {
      if (snapshot.exists()) {
        setDevice(snapshot.val());
      } else {
        toast({
          title: "Error",
          description: "Device not found",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading device:', error);
      toast({
        title: "Error",
        description: "Error loading device data",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => {
      off(deviceRef);
    };
  }, [currentUser, userData]);

  const updateWiFiConfig = async (config: DeviceData['wifiConfig']) => {
    const deviceId = userData?.deviceId || '';
    if (!deviceId || !device) return;

    try {
      const configRef = ref(db, `devices/${deviceId}/wifiConfig`);
      await set(configRef, config);
      toast({
        title: "Success",
        description: "WiFi configuration updated successfully",
      });
    } catch (error) {
      console.error('Error updating WiFi config:', error);
      toast({
        title: "Error",
        description: "Failed to update WiFi configuration",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDeviceName = async (name: string) => {
    const deviceId = userData?.deviceId || '';
    if (!deviceId || !device) return;

    try {
      const nameRef = ref(db, `devices/${deviceId}/name`);
      await set(nameRef, name);
      toast({
        title: "Success",
        description: "Device name updated successfully",
      });
    } catch (error) {
      console.error('Error updating device name:', error);
      toast({
        title: "Error",
        description: "Failed to update device name",
        variant: "destructive",
      });
      throw error;
    }
  };

  const triggerFeed = async (amount: number) => {
    const deviceId = userData?.deviceId || '';
    if (!deviceId || !device) return;

    try {
      const feedRef = ref(db, `devices/${deviceId}/feedCommand`);
      await set(feedRef, {
        pending: true,
        amount,
        timestamp: Date.now(),
      });
      toast({
        title: "Success",
        description: "Feed command sent successfully",
      });
    } catch (error) {
      console.error('Error sending feed command:', error);
      toast({
        title: "Error",
        description: "Failed to send feed command",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    device,
    loading,
    updateWiFiConfig,
    updateDeviceName,
    triggerFeed,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
} 