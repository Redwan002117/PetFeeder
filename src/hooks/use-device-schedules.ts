import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface FeedingSchedule {
  id: string;
  device_id: string;
  time: string;
  days: boolean[];
  amount: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useDeviceSchedules(deviceId: string | null) {
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  let subscription: RealtimeChannel | null = null;

  useEffect(() => {
    if (!deviceId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    async function fetchSchedules() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('feeding_schedules')
          .select('*')
          .eq('device_id', deviceId)
          .order('time');
        
        if (error) {
          throw error;
        }
        
        setSchedules(data || []);
        
        // Subscribe to realtime changes
        subscription = supabase
          .channel(`schedules_${deviceId}`)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'feeding_schedules',
            filter: `device_id=eq.${deviceId}` 
          }, payload => {
            // Handle different change types
            if (payload.eventType === 'INSERT') {
              setSchedules(current => [...current, payload.new as FeedingSchedule]);
            } else if (payload.eventType === 'UPDATE') {
              setSchedules(current => 
                current.map(schedule => 
                  schedule.id === payload.new.id ? payload.new as FeedingSchedule : schedule
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setSchedules(current => 
                current.filter(schedule => schedule.id !== payload.old.id)
              );
            }
          })
          .subscribe();
          
      } catch (err: any) {
        console.error('Error fetching schedules:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedules();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [deviceId]);

  const toggleSchedule = async (id: string, enabled: boolean) => {
    try {
      const { data, error } = await supabase
        .from('feeding_schedules')
        .update({ enabled })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return data?.[0];
    } catch (err: any) {
      console.error('Error toggling schedule:', err);
      setError(err);
      throw err;
    }
  };

  const createSchedule = async (newSchedule: Omit<FeedingSchedule, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('feeding_schedules')
        .insert([{ ...newSchedule, device_id: deviceId }])
        .select();
      
      if (error) throw error;
      
      return data?.[0];
    } catch (err: any) {
      console.error('Error creating schedule:', err);
      setError(err);
      throw err;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<FeedingSchedule>) => {
    try {
      const { data, error } = await supabase
        .from('feeding_schedules')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return data?.[0];
    } catch (err: any) {
      console.error('Error updating schedule:', err);
      setError(err);
      throw err;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feeding_schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (err: any) {
      console.error('Error deleting schedule:', err);
      setError(err);
      throw err;
    }
  };

  return {
    schedules,
    loading,
    error,
    toggleSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}
