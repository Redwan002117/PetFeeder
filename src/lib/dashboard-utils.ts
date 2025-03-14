import { supabase } from './supabase';

export interface DashboardStats {
  totalFeedings: number;
  feedingsByHour: number[];
  foodLevel: number;
  lastFeeding: {
    timestamp: string;
    amount: number;
  } | null;
  nextScheduled: {
    time: string;
    amount: number;
  } | null;
}

export const getDashboardStats = async (deviceId: string): Promise<DashboardStats> => {
  const { data: feedingData, error: feedingError } = await supabase
    .from('feeding_events')
    .select('*')
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })
    .limit(1);

  if (feedingError) throw feedingError;

  const { data: deviceData, error: deviceError } = await supabase
    .from('devices')
    .select('food_level')
    .eq('id', deviceId)
    .single();

  if (deviceError) throw deviceError;

  const { data: scheduleData, error: scheduleError } = await supabase
    .from('feeding_schedules')
    .select('*')
    .eq('device_id', deviceId)
    .gte('next_feeding', new Date().toISOString())
    .order('next_feeding', { ascending: true })
    .limit(1);

  if (scheduleError) throw scheduleError;

  return {
    totalFeedings: feedingData?.length || 0,
    feedingsByHour: Array(24).fill(0), // To be implemented with aggregation
    foodLevel: deviceData?.food_level || 0,
    lastFeeding: feedingData?.[0] || null,
    nextScheduled: scheduleData?.[0] || null
  };
};

export const triggerManualFeed = async (deviceId: string, amount: number) => {
  const { data, error } = await supabase
    .from('feeding_events')
    .insert([{
      device_id: deviceId,
      amount,
      type: 'manual',
      timestamp: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getFeedingHistory = async (deviceId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('feeding_events')
    .select('*')
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};
