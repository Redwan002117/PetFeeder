import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Settings as SettingsIcon, Lock, Server, AlertCircle, Check } from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import NotificationSettings from '@/components/NotificationSettings';
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/PageHeader';

const Settings = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  // Theme settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  // Two-factor authentication
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  // Active sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  // General loading state
  const [loading, setLoading] = useState(false);
  
  // Initialize settings from local storage and database
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('system');
    }
    
    // Load sound settings
    const soundDisabled = localStorage.getItem("sound") === "disabled";
    setSoundEnabled(!soundDisabled);
    
    // Load notification settings from local storage
    const notificationsEnabled = localStorage.getItem("notifications") === "enabled";
    setNotificationsEnabled(notificationsEnabled);
    
    const emailNotificationsDisabled = localStorage.getItem("emailNotifications") === "disabled";
    setEmailNotifications(!emailNotificationsDisabled);
    
    // Load user settings from database
    if (currentUser) {
      fetchUserSettings();
    }
  }, [currentUser]);
  
  // Function to load user settings from database
  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch user preferences from Supabase
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('id', currentUser?.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is fine
        throw error;
      }
      
      if (data) {
        // Update state with database settings
        setNotificationsEnabled(data.notifications_enabled || false);
        setEmailNotifications(data.email_notifications || true);
        setTheme(data.theme || 'system');
      }
      
      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase.auth.admin.listUserSessions(
        currentUser?.id || ''
      );
      
      if (sessionsError) {
        throw sessionsError;
      }
      
      setSessions(sessionsData || []);
      
      // Fetch two-factor auth status
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (mfaError) {
        throw mfaError;
      }
      
      setTwoFactorEnabled(mfaData.currentLevel === 'aal2' || false);
      
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
      setLoadingSessions(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
    
    // Save to database if logged in
    if (currentUser) {
      updateUserPreferences({ theme: newTheme });
    }
    
    toast({
      title: `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme applied`,
      description: newTheme === 'system' ? 'Theme will match your system preference' : undefined,
    });
  };

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
    const newNotificationsEnabled = !notificationsEnabled;
    
    try {
      setNotificationsEnabled(newNotificationsEnabled);
      
      if (newNotificationsEnabled) {
        // Request browser notification permission
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          localStorage.setItem("notifications", "enabled");
        } else {
          setNotificationsEnabled(false);
          throw new Error("Notification permission denied");
        }
      } else {
        localStorage.removeItem("notifications");
      }
      
      // Update in database if logged in
      if (currentUser) {
        await updateUserPreferences({
          notifications_enabled: newNotificationsEnabled
        });
      }
      
      toast({
        title: newNotificationsEnabled ? "Notifications Enabled" : "Notifications Disabled",
        description: `Push notifications have been ${newNotificationsEnabled ? "enabled" : "disabled"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings",
        variant: "destructive",
      });
    }
  };

  const handleEmailNotificationsToggle = async () => {
    const newEmailNotifications = !emailNotifications;
    
    try {
      setEmailNotifications(newEmailNotifications);
      
      if (newEmailNotifications) {
        localStorage.removeItem("emailNotifications");
      } else {
        localStorage.setItem("emailNotifications", "disabled");
      }
      
      // Update in database if logged in
      if (currentUser) {
        await updateUserPreferences({
          email_notifications: newEmailNotifications
        });
      }
      
      toast({
        title: newEmailNotifications ? "Email Notifications Enabled" : "Email Notifications Disabled",
        description: `You will ${newEmailNotifications ? "now" : "no longer"} receive email notifications.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email notification settings",
        variant: "destructive",
      });
    }
  };

  const updateUserPreferences = async (updates: any) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          id: currentUser.id,
          ...updates
        });
        
      if (error) throw error;
      
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  };

  // Function to set up real-time listeners for all data
  useEffect(() => {
    if (!currentUser) return;
    
    // Set up listeners for sessions
    const subscription = supabase
      .channel(`user_sessions_${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'auth',
        table: 'sessions',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        fetchUserSettings();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Settings"
        icon={<Server className="h-6 w-6" />}
        description="Manage your account and application settings"
      />
      
      <div className="mt-8">
        <Tabs defaultValue="general">
          <TabsList className="mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {currentUser && <TabsTrigger value="sessions">Active Sessions</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={(value) => handleThemeChange(value as any)}>
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose between light, dark, or system theme preference.
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="sound">Sound Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable application sound effects
                    </p>
                  </div>
                  <Switch id="sound" checked={soundEnabled} onCheckedChange={handleSoundToggle} />
                </div>
              </CardContent>
            </Card>
            
            {currentUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Editor</CardTitle>
                  <CardDescription>
                    Update your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <SettingsIcon className="h-4 w-4" />
                    <AlertDescription>
                      To edit your profile picture and display name, please visit the <Button variant="link" className="h-auto p-0" onClick={() => window.location.href = '/profile'}>Profile Page</Button>.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <ChangePasswordForm />
            
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorEnabled ? "Two-factor authentication is active" : "Enable two-factor authentication for better security"}
                    </p>
                  </div>
                  <Button 
                    variant={twoFactorEnabled ? "outline" : "default"} 
                    onClick={() => window.location.href = '/profile/security/two-factor'}
                    className="shrink-0"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Advanced Security</CardTitle>
                <CardDescription>
                  Additional security options for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Security settings like API key management, authorized applications, and account recovery options will be available in a future update.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="browser-notification">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications on this device when important events occur
                    </p>
                  </div>
                  <Switch id="browser-notification" checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="email-notification">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <Switch id="email-notification" checked={emailNotifications} onCheckedChange={handleEmailNotificationsToggle} />
                </div>
              </CardContent>
            </Card>
            
            <NotificationSettings />
          </TabsContent>
          
          {currentUser && (
            <TabsContent value="sessions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Manage your current device sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{session.user_agent || 'Unknown Device'}</p>
                            <p className="text-xs text-muted-foreground">
                              Last active: {new Date(session.updated_at || session.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {session.current && (
                              <Badge variant="outline" className="mr-2 bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Current
                              </Badge>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              disabled={session.current}
                              onClick={async () => {
                                try {
                                  const { error } = await supabase.auth.admin.signOut(session.id);
                                  if (error) throw error;
                                  toast({
                                    title: "Session ended",
                                    description: "The session has been terminated successfully.",
                                  });
                                  fetchUserSettings();
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to end session",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              {session.current ? "Current Session" : "End Session"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No active sessions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;