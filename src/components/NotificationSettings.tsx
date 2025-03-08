import React from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const NotificationSettings = () => {
  const { notificationsEnabled, requestPermission } = useNotifications();
  const [loading, setLoading] = React.useState(false);

  const handleEnableNotifications = async () => {
    setLoading(true);
    await requestPermission();
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage push notifications for your pet feeder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications for feeding events and device status
              </p>
            </div>
            <div>
              {notificationsEnabled ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Enabled
                </span>
              ) : (
                <Button 
                  onClick={handleEnableNotifications}
                  disabled={loading}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {loading ? "Enabling..." : "Enable Notifications"}
                </Button>
              )}
            </div>
          </div>
          
          {notificationsEnabled && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Bell className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Notifications are enabled</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      You will receive notifications for:
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Scheduled feeding events</li>
                      <li>Manual feeding confirmations</li>
                      <li>Device status changes</li>
                      <li>Food level alerts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings; 