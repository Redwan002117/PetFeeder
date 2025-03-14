import { supabase } from './supabase';

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support desktop notifications');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted');
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const saveUserNotificationPreferences = async (userId: string, enabled: boolean) => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        notifications_enabled: enabled,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return false;
  }
};

export const removeUserNotificationPreferences = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing notification preferences:', error);
    return false;
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  const channel = supabase.channel('notifications')
    .on('broadcast', { event: 'notification' }, (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};
