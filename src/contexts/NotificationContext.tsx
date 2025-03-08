import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { requestNotificationPermission, saveUserFCMToken, onForegroundMessage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface NotificationContextProps {
  notificationsEnabled: boolean;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <NotificationContext.Provider
      value={{
        notificationsEnabled,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 