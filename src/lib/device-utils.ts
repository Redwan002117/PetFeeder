import { supabase } from './supabase';
import type { Device, DeviceStats, FeedingHistory } from './types';

export interface WifiNetwork {
  ssid: string;
  strength: number;
  security: string;
}

export interface DeviceStatus {
  online: boolean;
  lastSeen: string;
  wifiConnected: boolean;
  currentNetwork?: string;
  signalStrength?: number;
}

export const getWifiNetworks = async (deviceId: string): Promise<WifiNetwork[]> => {
  const { data, error } = await supabase
    .from('device_wifi_scan')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error) throw error;
  return data?.networks || [];
};

export const setWifiCredentials = async (
  deviceId: string, 
  ssid: string, 
  password: string
): Promise<void> => {
  const { error } = await supabase
    .from('device_wifi_config')
    .upsert({
      device_id: deviceId,
      ssid,
      password,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
};

export const getDeviceStatus = async (deviceId: string): Promise<DeviceStatus> => {
  const { data, error } = await supabase
    .from('device_status')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error) throw error;
  return data;
};

export const getDeviceStats = async (deviceId: string): Promise<DeviceStats> => {
  const { data, error } = await supabase
    .from('device_stats')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error) throw error;
  return data;
};

export const updateDeviceStatus = async (deviceId: string, status: DeviceStatus) => {
  const { error } = await supabase
    .from('devices')
    .update({ 
      status, 
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', deviceId);

  if (error) throw error;
  return true;
};

export const getDeviceFeedingHistory = async (
  deviceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<FeedingHistory[]> => {
  let query = supabase
    .from('feeding_history')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};
