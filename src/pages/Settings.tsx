import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Volume2, VolumeX, Lock, AlertTriangle, Calendar, HandPlatter, Wifi, Mail, Smartphone, Activity, XCircle, AlertCircle, Settings as SettingsIcon, Server, Key, Send, ShieldAlert } from "lucide-react";
import NotificationSettings from "@/components/NotificationSettings";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { ref, update, get } from "firebase/database";
import { database } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Import react-hook-form and zod only if the user is an admin
// This prevents the build error when these modules aren't used
const AdminOnlySettings = React.lazy(() => import('@/components/AdminOnlySettings'));

const Settings = () => {
  const { currentUser, isAdmin } = useAuth();
  const { notificationsEnabled, requestPermission, disableNotifications } = useNotifications();
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = React.useState(
    localStorage.getItem("sound") !== "disabled"
  );
  const [emailNotifications, setEmailNotifications] = React.useState(
    localStorage.getItem("emailNotifications") === "enabled"
  );
  const [activeTab, setActiveTab] = React.useState("general");

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
      
      <Tabs 
        defaultValue="general" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-6 max-w-4xl overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="feeding">Feeding</TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin Settings</TabsTrigger>}
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
                        <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                          <Wifi className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Connectivity Issues</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Notifications when device goes offline</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure email notifications</CardDescription>
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
              
              {emailNotifications && (
                <div className="mt-4">
                  <NotificationSettings />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-gray-500" />
                  <Label htmlFor="2fa-toggle">Enable Two-Factor Authentication</Label>
                </div>
                <Switch id="2fa-toggle" />
              </div>
              <p className="text-sm text-gray-500">
                When enabled, you will be required to enter a verification code sent to your phone in addition to your password when logging in.
              </p>
              <Button variant="outline" className="mt-2">
                Set Up Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Current Device</p>
                      <p className="text-xs text-gray-500">Last active: Just now</p>
                    </div>
                  </div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Active
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">iPhone 13</p>
                      <p className="text-xs text-gray-500">Last active: 2 days ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <XCircle className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              </div>
              
              <Button variant="outline" className="mt-4 w-full">
                Log Out of All Devices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feeding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feeding Preferences</CardTitle>
              <CardDescription>Configure default feeding settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-portion">Default Portion Size (grams)</Label>
                <Input id="default-portion" type="number" defaultValue="50" />
                <p className="text-xs text-gray-500">
                  This will be the default portion size for manual feedings
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-daily">Maximum Daily Feedings</Label>
                <Input id="max-daily" type="number" defaultValue="3" />
                <p className="text-xs text-gray-500">
                  Maximum number of feedings allowed per day
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="slow-feed">Slow Feed Mode</Label>
                  <p className="text-xs text-gray-500">
                    Dispenses food more slowly to prevent pets from eating too quickly
                  </p>
                </div>
                <Switch id="slow-feed" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Feeding Schedule</CardTitle>
              <CardDescription>Configure default schedule settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-adjust">Auto-Adjust for Daylight Savings</Label>
                  <p className="text-xs text-gray-500">
                    Automatically adjust feeding times when daylight savings changes
                  </p>
                </div>
                <Switch id="auto-adjust" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekend-diff">Different Weekend Schedule</Label>
                  <p className="text-xs text-gray-500">
                    Use a different feeding schedule on weekends
                  </p>
                </div>
                <Switch id="weekend-diff" />
              </div>
              
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                View Full Schedule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="connectivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Connectivity</CardTitle>
              <CardDescription>Configure how your device connects to the network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connection-type">Connection Type</Label>
                <Select defaultValue="wifi">
                  <SelectTrigger id="connection-type">
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wifi">Wi-Fi</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                    <SelectItem value="ethernet">Ethernet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-reconnect">Auto-Reconnect</Label>
                  <p className="text-xs text-gray-500">
                    Automatically attempt to reconnect when connection is lost
                  </p>
                </div>
                <Switch id="auto-reconnect" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="offline-mode">Offline Mode</Label>
                  <p className="text-xs text-gray-500">
                    Continue to operate on schedule even when internet connection is lost
                  </p>
                </div>
                <Switch id="offline-mode" defaultChecked />
              </div>
              
              <Button variant="outline" className="w-full">
                <Activity className="mr-2 h-4 w-4" />
                Test Connection
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Network Settings</CardTitle>
              <CardDescription>Configure network settings for your device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wifi-name">Wi-Fi Network Name</Label>
                <Input id="wifi-name" defaultValue="Home Network" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wifi-password">Wi-Fi Password</Label>
                <Input id="wifi-password" type="password" value="••••••••••" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use-static-ip">Use Static IP</Label>
                  <p className="text-xs text-gray-500">
                    Use a static IP address instead of DHCP
                  </p>
                </div>
                <Switch id="use-static-ip" />
              </div>
              
              <Button variant="outline" className="w-full">
                <Wifi className="mr-2 h-4 w-4" />
                Scan for Networks
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldAlert className="mr-2 h-5 w-5" />
                  Admin Settings
                </CardTitle>
                <CardDescription>
                  These settings are only available to administrators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Admin Only</AlertTitle>
                  <AlertDescription>
                    These settings affect system-wide configurations and should be changed with caution.
                  </AlertDescription>
                </Alert>
                
                <React.Suspense fallback={<div className="p-4 text-center">Loading admin settings...</div>}>
                  <AdminOnlySettings />
                </React.Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings; 