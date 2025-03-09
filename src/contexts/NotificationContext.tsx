import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { requestNotificationPermission, saveUserFCMToken, onForegroundMessage, removeUserFCMToken } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
    // Check if notifications are already enabled
    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !notificationsEnabled) return;

    // Set up foreground message handler
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Received foreground message:', payload);
      
      // Show toast notification for foreground messages
      toast({
        title: payload.notification?.title || "New Notification",
        description: payload.notification?.body || "",
      });
    });

    return () => unsubscribe();
  }, [currentUser, notificationsEnabled, toast]);

  const requestPermission = async () => {
    if (!currentUser) return false;
    
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        // Save the token to the user's profile
        await saveUserFCMToken(currentUser.uid, token);
        setNotificationsEnabled(true);
        
        toast({
          title: "Notifications Enabled",
          description: "You will now receive notifications for feeding events.",
        });
        
        return true;
      } else {
        toast({
          title: "Notifications Disabled",
          description: "You will not receive notifications. You can enable them in your browser settings.",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const disableNotifications = async () => {
    if (!currentUser) return;
    
    try {
      // Remove the FCM token from the user's profile
      await removeUserFCMToken(currentUser.uid);
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

  return (
    <NotificationContext.Provider
      value={{
        notificationsEnabled,
        requestPermission,
        disableNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider; 