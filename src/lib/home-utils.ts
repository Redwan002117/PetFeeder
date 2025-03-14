import { supabase } from './supabase';

export interface Device {
  id: string;
  name: string;
  status: string;
  foodLevel: number;
  lastSeen: string;
}

export interface FeedingEvent {
  id: string;
  timestamp: string;
  amount: number;
  type: 'manual' | 'scheduled';
  success: boolean;
}

export const getDevices = async (userId: string): Promise<Device[]> => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('owner_id', userId);

  if (error) throw error;
  return data || [];
};

export const getDeviceStatus = async (deviceId: string): Promise<Device | null> => {
  const { data, error } = await supabase
    .from('device_status')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error) throw error;
  return data;
};

export const getLastFeeding = async (deviceId: string): Promise<FeedingEvent | null> => {
  const { data, error } = await supabase
    .from('feeding_events')
    .select('*')
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};
