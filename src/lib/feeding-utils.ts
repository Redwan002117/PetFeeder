import { supabase } from './supabase';

export interface FeedingHistory {
  id: string;
  device_id: string;
  amount: number;
  timestamp: string;
  type: 'manual' | 'scheduled';
  success: boolean;
}

export const triggerManualFeed = async (deviceId: string, amount: number) => {
  const { data, error } = await supabase
    .from('feeding_events')
    .insert([{
      device_id: deviceId,
      amount,
      type: 'manual',
      timestamp: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getFeedingHistory = async (
  deviceId: string,
  limit: number = 10
): Promise<FeedingHistory[]> => {
  const { data, error } = await supabase
    .from('feeding_events')
    .select('*')
    .eq('device_id', deviceId)
    .eq('type', 'manual')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

export const getDeviceStatus = async (deviceId: string) => {
  const { data, error } = await supabase
    .from('device_status')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error) throw error;
  return data;
};
