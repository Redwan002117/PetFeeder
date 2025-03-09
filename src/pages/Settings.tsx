import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Volume2, VolumeX, Lock, AlertTriangle, Calendar, HandPlatter, Wifi, Mail, Smartphone, Activity, XCircle, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import NotificationSettings from "@/components/NotificationSettings";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { ref, update } from "firebase/database";
import { database } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";

const Settings = () => {
  const { currentUser } = useAuth();
  const { notificationsEnabled, requestPermission, disableNotifications } = useNotifications();
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = React.useState(
    localStorage.getItem("sound") !== "disabled"
  );
  const [emailNotifications, setEmailNotifications] = React.useState(
    localStorage.getItem("emailNotifications") === "enabled"
  );

  const handleSoundToggle = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    
    if (newSoundEnabled) {
      localStorage.removeItem("sound");
    } else {
      localStorage.setItem("sound", "disabled");
    }
    
    toast({
      title: newSoundEnabled ? "Sound Enabled" : "Sound Disabled",
      description: `Application sounds have been ${newSoundEnabled ? "enabled" : "disabled"}.`,
    });
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      await requestPermission();
    } else {
      await disableNotifications();
    }
  };

  const handleEmailNotificationsToggle = () => {
    const newEmailNotifications = !emailNotifications;
    setEmailNotifications(newEmailNotifications);
    
    if (newEmailNotifications) {
      localStorage.setItem("emailNotifications", "enabled");
      
      // Update user preferences in the database if logged in
      if (currentUser) {
        const userPreferencesRef = ref(database, `users/${currentUser.uid}/preferences`);
        update(userPreferencesRef, {
          emailNotifications: true
        });
      }
    } else {
      localStorage.setItem("emailNotifications", "disabled");
      
      // Update user preferences in the database if logged in
      if (currentUser) {
        const userPreferencesRef = ref(database, `users/${currentUser.uid}/preferences`);
        update(userPreferencesRef, {
          emailNotifications: false
        });
      }
    }
    
    toast({
      title: newEmailNotifications ? "Email Notifications Enabled" : "Email Notifications Disabled",
      description: `You will ${newEmailNotifications ? "now" : "no longer"} receive email notifications.`,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader 
        title="Settings" 
        icon={<SettingsIcon size={28} />}
        description="Configure your application preferences and account settings"
      />
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-5 max-w-3xl overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="feeding">Feeding</TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sound Settings</CardTitle>
              <CardDescription>Configure application sound effects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {soundEnabled ? <Volume2 className="h-5 w-5 text-gray-500" /> : <VolumeX className="h-5 w-5 text-gray-500" />}
                  <Label htmlFor="sound-toggle">Enable Sound Effects</Label>
                </div>
                <Switch
                  id="sound-toggle"
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
              <p className="text-sm text-gray-500">
                When enabled, the application will play sound effects for notifications and actions.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reset Settings</CardTitle>
              <CardDescription>Reset all settings to default values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                This will reset all your settings to their default values. This action cannot be undone.
              </p>
              <Button variant="destructive" className="mt-2">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Reset All Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Configure browser push notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <Label htmlFor="notification-toggle">Enable Push Notifications</Label>
                </div>
                <Switch
                  id="notification-toggle"
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              <p className="text-sm text-gray-500">
                When enabled, you will receive notifications about feeding events and device status.
              </p>
              
              {notificationsEnabled && (
                <div className="mt-6 space-y-4 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notification Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Scheduled Feedings</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Notifications when scheduled feedings occur</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <HandPlatter className="h-4 w-4 text-green-600 dark:text-green-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Manual Feedings</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Notifications when manual feedings are triggered</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Low Food Alerts</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Notifications when food level is low</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                          <Wifi className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Device Offline Alerts</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Notifications when your device goes offline</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              )}
              
              {!notificationsEnabled && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Notifications are disabled</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enable notifications to receive alerts about your pet's feeding schedule and device status.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <Label htmlFor="email-notification-toggle">Enable Email Notifications</Label>
                </div>
                <Switch
                  id="email-notification-toggle"
                  checked={emailNotifications}
                  onCheckedChange={handleEmailNotificationsToggle}
                />
              </div>
              <p className="text-sm text-gray-500">
                When enabled, you will receive email notifications for important events.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <ChangePasswordForm />
          
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div>
                  <p className="font-medium">Current Session</p>
                  <p className="text-sm text-gray-500">
                    {navigator.userAgent.split(' ').slice(-1)[0].replace('/', ' ')}
                  </p>
                </div>
                <div className="text-green-600 text-sm font-medium">Active</div>
              </div>
              
              <Button variant="outline" className="w-full">
                <XCircle className="mr-2 h-4 w-4" />
                Sign Out All Other Devices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feeding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feeding Settings</CardTitle>
              <CardDescription>Configure default feeding settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="default-portion">Default Portion Size (grams)</Label>
                  <div className="flex items-center mt-1">
                    <input
                      type="range"
                      id="default-portion"
                      min="5"
                      max="100"
                      step="5"
                      defaultValue="30"
                      className="w-full"
                      onChange={(e) => {
                        const portionSizeElement = document.getElementById('portion-size-value');
                        if (portionSizeElement) {
                          portionSizeElement.textContent = `${e.target.value}g`;
                        }
                      }}
                    />
                    <span id="portion-size-value" className="ml-2 w-12 text-center font-medium">30g</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="max-daily">Maximum Daily Feedings</Label>
                  <div className="flex items-center mt-1">
                    <input
                      type="range"
                      id="max-daily"
                      min="1"
                      max="10"
                      defaultValue="4"
                      className="w-full"
                      onChange={(e) => {
                        const maxDailyElement = document.getElementById('max-daily-value');
                        if (maxDailyElement) {
                          maxDailyElement.textContent = e.target.value;
                        }
                      }}
                    />
                    <span id="max-daily-value" className="ml-2 w-12 text-center font-medium">4</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <Label htmlFor="schedule-toggle">Enable Default Schedule</Label>
                  </div>
                  <Switch id="schedule-toggle" defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HandPlatter className="h-5 w-5 text-gray-500" />
                    <Label htmlFor="manual-toggle">Allow Manual Feeding</Label>
                  </div>
                  <Switch id="manual-toggle" defaultChecked={true} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="connectivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Connectivity</CardTitle>
              <CardDescription>Configure device connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-gray-500" />
                  <Label htmlFor="auto-connect-toggle">Auto-Connect to Device</Label>
                </div>
                <Switch id="auto-connect-toggle" defaultChecked={true} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-gray-500" />
                  <Label htmlFor="status-check-toggle">Periodic Status Checks</Label>
                </div>
                <Switch id="status-check-toggle" defaultChecked={true} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  <Label htmlFor="offline-mode-toggle">Offline Mode</Label>
                </div>
                <Switch id="offline-mode-toggle" defaultChecked={false} />
              </div>
              
              <p className="text-sm text-gray-500">
                Offline mode allows the device to operate without an internet connection, but remote control will be disabled.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings; 