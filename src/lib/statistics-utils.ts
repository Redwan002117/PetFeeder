import { supabase } from './supabase';

export const getFeedingHistory = async (userId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase
    .from('feeding_history')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
};

export const getDeviceStatistics = async (userId: string) => {
  const { data, error } = await supabase
    .from('device_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};
