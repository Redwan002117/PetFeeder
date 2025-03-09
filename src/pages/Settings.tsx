import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Volume2, VolumeX, Lock, AlertTriangle, Calendar, HandPlatter, Mail, Smartphone, Activity, XCircle, AlertCircle, Settings as SettingsIcon, Server, Key, Send, ShieldAlert, QrCode, LogOut } from "lucide-react";
import NotificationSettings from "@/components/NotificationSettings";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { ref, update, get } from "firebase/database";
import { database } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeGet, safeUpdate, safeSet, safeOnValue } from "@/lib/firebase-utils";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

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
  const [scheduleData, setScheduleData] = React.useState(null);
  const [loadingSchedule, setLoadingSchedule] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const navigate = useNavigate();

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

  // Function to set up real-time listeners for all data
  useEffect(() => {
    if (!currentUser) return;
    
    // Set up listeners for all data
    const unsubscribers = [];
    
    // 1. Listen for user data changes (including 2FA status)
    const userUnsubscribe = safeOnValue(`users/${currentUser.uid}`, (snapshot) => {
      if (snapshot && snapshot.exists()) {
        const userData = snapshot.val();
        setTwoFactorEnabled(userData.twoFactorEnabled || false);
        
        // Update other user-related state if needed
        console.log('User data updated from database:', userData);
      }
    });
    unsubscribers.push(userUnsubscribe);
    
    // 2. Listen for session data changes
    const sessionsUnsubscribe = safeOnValue(`userSessions/${currentUser.uid}`, (snapshot) => {
      if (snapshot && snapshot.exists()) {
        const sessionsData = snapshot.val();
        const sessionsArray = Object.keys(sessionsData).map(key => ({
          id: key,
          ...sessionsData[key]
        }));
        setSessions(sessionsArray);
        setLoadingSessions(false);
        
        console.log('Sessions data updated from database:', sessionsArray);
      } else {
        // No sessions found
        setSessions([]);
        setLoadingSessions(false);
      }
    });
    unsubscribers.push(sessionsUnsubscribe);
    
    // 4. Listen for feeding schedule data changes
    const scheduleUnsubscribe = safeOnValue(`feedingSchedules/${currentUser.uid}`, (snapshot) => {
      if (snapshot && snapshot.exists()) {
        const scheduleData = snapshot.val();
        setScheduleData(scheduleData);
        setLoadingSchedule(false);
        
        console.log('Feeding schedule updated from database:', scheduleData);
      } else {
        // Set default schedule if none exists
        setScheduleData({
          weekdays: [
            { time: "08:00", amount: 100 },
            { time: "12:00", amount: 100 },
            { time: "18:00", amount: 100 }
          ],
          weekends: [
            { time: "09:00", amount: 100 },
            { time: "13:00", amount: 100 },
            { time: "19:00", amount: 100 }
          ],
          useWeekendSchedule: false
        });
        setLoadingSchedule(false);
      }
    });
    unsubscribers.push(scheduleUnsubscribe);
    
    // Clean up all listeners when component unmounts
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  // Function to fetch feeding schedule
  const fetchFeedingSchedule = async () => {
    if (!currentUser) return;
    
    setLoadingSchedule(true);
    try {
      const scheduleSnapshot = await safeGet(`feedingSchedules/${currentUser.uid}`);
      if (scheduleSnapshot && scheduleSnapshot.exists()) {
        setScheduleData(scheduleSnapshot.val());
      } else {
        // Set default schedule if none exists
        setScheduleData({
          weekdays: [
            { time: "08:00", amount: 100 },
            { time: "12:00", amount: 100 },
            { time: "18:00", amount: 100 }
          ],
          weekends: [
            { time: "09:00", amount: 100 },
            { time: "13:00", amount: 100 },
            { time: "19:00", amount: 100 }
          ],
          useWeekendSchedule: false
        });
      }
    } catch (error) {
      console.error("Error fetching feeding schedule:", error);
      toast({
        title: "Error",
        description: "Failed to load feeding schedule. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Function to check if 2FA is enabled
  useEffect(() => {
    const checkTwoFactorStatus = async () => {
      if (!currentUser) return;
      
      try {
        const userData = await safeGet(`users/${currentUser.uid}`);
        if (userData) {
          setTwoFactorEnabled(userData.twoFactorEnabled || false);
        }
      } catch (error) {
        console.error("Error checking 2FA status:", error);
      }
    };
    
    checkTwoFactorStatus();
  }, [currentUser]);
  
  // Function to toggle 2FA
  const handleTwoFactorToggle = async () => {
    if (!currentUser) return;
    
    if (twoFactorEnabled) {
      // Disable 2FA
      try {
        await safeUpdate(`users/${currentUser.uid}`, {
          twoFactorEnabled: false,
          twoFactorSecret: null
        });
        
        setTwoFactorEnabled(false);
        setTwoFactorSecret("");
        setQrCodeUrl("");
        
        toast({
          title: "Two-Factor Authentication Disabled",
          description: "Your account is now less secure. We recommend enabling 2FA for better security.",
          variant: "default"
        });
      } catch (error) {
        console.error("Error disabling 2FA:", error);
        toast({
          title: "Error",
          description: "Failed to disable Two-Factor Authentication. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // Show 2FA setup dialog
      setShowTwoFactorSetup(true);
      generateTwoFactorSecret();
    }
  };
  
  // Function to generate 2FA secret
  const generateTwoFactorSecret = async () => {
    if (!currentUser) return;
    
    try {
      // In a real app, you would generate a proper TOTP secret
      // For this demo, we'll create a random string
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let secret = '';
      for (let i = 0; i < 16; i++) {
        secret += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      setTwoFactorSecret(secret);
      
      // Generate a QR code URL (using Google Chart API)
      const appName = encodeURIComponent("PetFeeder");
      const email = encodeURIComponent(currentUser.email || "user");
      const secretEncoded = encodeURIComponent(secret);
      const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/${appName}:${email}%3Fsecret%3D${secretEncoded}%26issuer%3D${appName}`;
      
      console.log("Generated QR code URL:", qrUrl);
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Error generating 2FA secret:", error);
      toast({
        title: "Error",
        description: "Failed to set up Two-Factor Authentication. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to verify and enable 2FA
  const verifyAndEnableTwoFactor = async () => {
    if (!currentUser || !twoFactorSecret) return;
    
    // In a real app, you would verify the TOTP code here
    // For this demo, we'll accept any 6-digit code
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await safeUpdate(`users/${currentUser.uid}`, {
        twoFactorEnabled: true,
        twoFactorSecret: twoFactorSecret
      });
      
      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setVerificationCode("");
      
      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now more secure with 2FA.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      toast({
        title: "Error",
        description: "Failed to enable Two-Factor Authentication. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Function to revoke a session
  const revokeSession = async (sessionId) => {
    if (!currentUser) return;
    
    try {
      // Don't allow revoking the current session
      const session = sessions.find(s => s.id === sessionId);
      if (session.isCurrent) {
        toast({
          title: "Cannot Revoke Current Session",
          description: "You cannot revoke your current session. Please log out instead.",
          variant: "destructive"
        });
        return;
      }
      
      // Remove the session from Firebase
      await safeUpdate(`userSessions/${currentUser.uid}`, {
        [sessionId]: null
      });
      
      toast({
        title: "Session Revoked",
        description: "The device has been logged out successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error revoking session:", error);
      toast({
        title: "Error",
        description: "Failed to revoke session. Please try again.",
        variant: "destructive"
      });
    }
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
        <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-5 max-w-4xl overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="feeding">Feeding</TabsTrigger>
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
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
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
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-gray-500" />
                  <Label htmlFor="2fa-toggle">Enable Two-Factor Authentication</Label>
                        </div>
                <Switch 
                  id="2fa-toggle" 
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                />
                        </div>
              <p className="text-sm text-gray-500">
                When enabled, you will be required to enter a verification code from your authenticator app in addition to your password when logging in.
              </p>
              
              {!twoFactorEnabled && (
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    setShowTwoFactorSetup(true);
                    generateTwoFactorSecret();
                  }}
                >
                  Set Up Two-Factor Authentication
                </Button>
              )}
              
              <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Scan the QR code with your authenticator app or enter the secret key manually.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="flex justify-center">
                      {qrCodeUrl && (
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code for Two-Factor Authentication" 
                          className="border border-gray-200 rounded-md"
                          width="200"
                          height="200"
                        />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secret-key">Secret Key</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="secret-key" 
                          value={twoFactorSecret} 
                          readOnly 
                          className="font-mono"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(twoFactorSecret);
                            toast({
                              title: "Copied",
                              description: "Secret key copied to clipboard",
                              variant: "default"
                            });
                          }}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        If you can't scan the QR code, enter this secret key into your authenticator app.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="verification-code">Verification Code</Label>
                      <Input 
                        id="verification-code" 
                        value={verificationCode} 
                        onChange={(e) => setVerificationCode(e.target.value)} 
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                      />
                      <p className="text-xs text-gray-500">
                        Enter the 6-digit code from your authenticator app to verify and enable 2FA.
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTwoFactorSetup(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={verifyAndEnableTwoFactor}
                      disabled={!verificationCode || verificationCode.length !== 6}
                    >
                      Verify and Enable
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>Manage your active sessions and devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSessions ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div 
                      key={session.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-gray-500" />
                        <div>
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{session.deviceName}</p>
                            {session.isCurrent && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                        </div>
                          <p className="text-xs text-gray-500">{session.browser} on {session.os}</p>
                          <p className="text-xs text-gray-500">Last active: {formatDate(session.lastActive)}</p>
                        </div>
                      </div>
                      
                      {!session.isCurrent && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => revokeSession(session.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                      </div>
                  ))}
                  
                  {sessions.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No active sessions found.
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-2">
                <p className="text-sm text-gray-500 mb-2">
                  If you notice any suspicious activity, revoke the session and change your password immediately.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    // Sign out from all devices
                    if (confirm("Are you sure you want to log out from all devices? This will require you to log in again on all your devices.")) {
                      // In a real app, you would implement a server-side token invalidation
                      // For this demo, we'll just clear the sessions
                      if (currentUser) {
                        safeSet(`userSessions/${currentUser.uid}`, null)
                          .then(() => {
                            // Keep only current session
                            const currentSession = sessions.find(s => s.isCurrent);
                            if (currentSession) {
                              safeSet(`userSessions/${currentUser.uid}/current-session`, currentSession);
                              setSessions([currentSession]);
                            }
                            
                            toast({
                              title: "Success",
                              description: "You have been logged out from all other devices.",
                              variant: "default"
                            });
                          })
                          .catch(error => {
                            console.error("Error signing out from all devices:", error);
                            toast({
                              title: "Error",
                              description: "Failed to log out from all devices. Please try again.",
                              variant: "destructive"
                            });
                          });
                      }
                    }
                  }}
                >
                  Sign Out From All Devices
                </Button>
              </div>
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
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={fetchFeedingSchedule}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    View Full Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Feeding Schedule</DialogTitle>
                    <DialogDescription>
                      Your pet's complete feeding schedule. You can manage this schedule from the Feeding page.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {loadingSchedule ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : scheduleData ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Weekday Schedule</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              <TableHead>Amount (g)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {scheduleData.weekdays && scheduleData.weekdays.map((feeding, index) => (
                              <TableRow key={`weekday-${index}`}>
                                <TableCell>{feeding.time}</TableCell>
                                <TableCell>{feeding.amount}</TableCell>
                              </TableRow>
                            ))}
                            {(!scheduleData.weekdays || scheduleData.weekdays.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                  No weekday feedings scheduled
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {scheduleData.useWeekendSchedule && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Weekend Schedule</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Amount (g)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scheduleData.weekends && scheduleData.weekends.map((feeding, index) => (
                                <TableRow key={`weekend-${index}`}>
                                  <TableCell>{feeding.time}</TableCell>
                                  <TableCell>{feeding.amount}</TableCell>
                                </TableRow>
                              ))}
                              {(!scheduleData.weekends || scheduleData.weekends.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                                    No weekend feedings scheduled
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No feeding schedule found. Set up your schedule on the Feeding page.
                    </div>
                  )}
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                    <Button 
                      type="button" 
                      onClick={() => navigate('/schedule')}
                    >
                      Manage Schedule
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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