import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface FeedingEvent {
  id: string;
  device_id: string;
  timestamp: string;
  amount: number;
  type: 'manual' | 'scheduled';
}

interface FeedingStats {
  totalFeedings: number;
  totalAmount: number;
  feedingsToday: number;
  averageAmount: number;
}

export const useFeedingHistory = (deviceId: string) => {
  const [history, setHistory] = useState<FeedingEvent[]>([]);
  const [stats, setStats] = useState<FeedingStats>({
    totalFeedings: 0,
    totalAmount: 0,
    feedingsToday: 0,
    averageAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const calculateStats = (feedingEvents: FeedingEvent[]) => {
    if (feedingEvents.length === 0) {
      setStats({
        totalFeedings: 0,
        totalAmount: 0,
        feedingsToday: 0,
        averageAmount: 0
      });
      return;
    }

    const totalFeedings = feedingEvents.length;
    const totalAmount = feedingEvents.reduce((sum, event) => sum + event.amount, 0);
    
    // Calculate feedings today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const feedingsToday = feedingEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= today;
    }).length;
    
    setStats({
      totalFeedings,
      totalAmount,
      feedingsToday,
      averageAmount: totalAmount / totalFeedings
    });
  };

  // Function to fetch feeding history data
  const fetchHistory = useCallback(async () => {
    if (!deviceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('feeding_history')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const feedingEvents = data as FeedingEvent[];
      setHistory(feedingEvents);
      calculateStats(feedingEvents);
    } catch (err) {
      console.error('Error fetching feeding history:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Fetch data on mount and when deviceId changes
  useEffect(() => {
    fetchHistory();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`feeding_history_${deviceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feeding_history',
        filter: `device_id=eq.${deviceId}`
      }, () => {
        fetchHistory();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [deviceId, fetchHistory]);

  return {
    history,
    stats,
    loading,
    error,
    refresh: fetchHistory
  };
};

export default useFeedingHistory;
