import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { 
  requestNotificationPermission, 
  saveUserNotificationPreferences, 
  removeUserNotificationPreferences, 
  onForegroundMessage 
} from "@/lib/supabase-notifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase-config';

interface NotificationContextProps {
  notificationsEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

// Use a named function declaration instead of an arrow function
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Check if notifications are already enabled
    const checkNotificationPreferences = async () => {
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('notifications_enabled')
          .eq('user_id', currentUser.id)
          .single();

        setNotificationsEnabled(!!data?.notifications_enabled);
      } catch (error) {
        console.error("Error checking notification preferences:", error);
      }
    };

    checkNotificationPreferences();

    // Subscribe to notifications
    const unsubscribe = onForegroundMessage((payload) => {
      if (payload.type === 'FEEDING_COMPLETE') {
        toast({
          title: "Feeding Complete",
          description: payload.message,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, toast]);

  const requestPermission = async () => {
    if (!currentUser) return false;

    try {
      const permissionGranted = await requestNotificationPermission();
      if (permissionGranted) {
        await saveUserNotificationPreferences(currentUser.id, true);
        setNotificationsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const disableNotifications = async () => {
    if (!currentUser) return;

    try {
      // Remove the notification preferences from the user's profile
      await removeUserNotificationPreferences(currentUser.id);
      setNotificationsEnabled(false);

      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive notifications.",
      });
    } catch (error) {
      console.error("Error disabling notifications:", error);

      toast({
        title: "Error",
        description: "Failed to disable notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    notificationsEnabled,
    requestPermission,
    disableNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;