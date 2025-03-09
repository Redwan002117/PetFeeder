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
import { Bell, Volume2, VolumeX, Lock, AlertTriangle, Calendar, HandPlatter, Wifi, Mail, Smartphone, Activity, XCircle, AlertCircle, Settings as SettingsIcon, Server, Key, Send } from "lucide-react";
import NotificationSettings from "@/components/NotificationSettings";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { ref, update, get } from "firebase/database";
import { database } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define schema for SMTP settings form
const smtpFormSchema = z.object({
  service: z.string().min(1, "Service is required"),
  host: z.string().min(1, "Host is required"),
  port: z.string().min(1, "Port is required"),
  secure: z.boolean().default(true),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromEmail: z.string().email("Invalid email address"),
  apiKey: z.string().optional(),
});

type SMTPFormValues = z.infer<typeof smtpFormSchema>;

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
  const [smtpProvider, setSmtpProvider] = React.useState("smtp");
  const [isLoading, setIsLoading] = React.useState(false);

  // Initialize form with default values
  const form = useForm<SMTPFormValues>({
    resolver: zodResolver(smtpFormSchema),
    defaultValues: {
      service: "",
      host: "",
      port: "",
      secure: true,
      username: "",
      password: "",
      fromEmail: "",
      apiKey: "",
    },
  });

  // Load SMTP settings from Firebase when component mounts
  React.useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      const smtpSettingsRef = ref(database, `users/${currentUser.uid}/smtpSettings`);
      get(smtpSettingsRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          form.reset({
            service: data.service || "",
            host: data.host || "",
            port: data.port || "",
            secure: data.secure !== undefined ? data.secure : true,
            username: data.username || "",
            password: data.password || "",
            fromEmail: data.fromEmail || "",
            apiKey: data.apiKey || "",
          });
          setSmtpProvider(data.service === "emailjs" ? "api" : "smtp");
        }
        setIsLoading(false);
      }).catch(error => {
        console.error("Error loading SMTP settings:", error);
        setIsLoading(false);
      });
    }
  }, [currentUser, form]);

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

  const onSubmitSMTPSettings = (data: SMTPFormValues) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to save SMTP settings.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const smtpSettingsRef = ref(database, `users/${currentUser.uid}/smtpSettings`);
    
    update(smtpSettingsRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
      .then(() => {
        toast({
          title: "Settings Saved",
          description: "Your email settings have been updated successfully.",
        });
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error saving SMTP settings:", error);
        toast({
          title: "Error",
          description: "Failed to save email settings. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  };

  const handleTestEmail = async () => {
    const values = form.getValues();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to send a test email.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // This would typically call a backend function to send a test email
      // For now, we'll just simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Test Email Sent",
        description: "If your settings are correct, you should receive a test email shortly.",
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "Failed to send test email. Please check your settings and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader 
        title="Settings" 
        icon={<SettingsIcon size={28} />}
        description="Configure your application preferences and account settings"
      />
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-6 max-w-4xl overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="feeding">Feeding</TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          <TabsTrigger value="smtp">Email Settings</TabsTrigger>
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
        
        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure your email settings for notifications and admin requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Label htmlFor="email-provider" className="mb-2 block">Email Provider Type</Label>
                <Select
                  value={smtpProvider}
                  onValueChange={(value) => setSmtpProvider(value)}
                >
                  <SelectTrigger id="email-provider" className="w-full md:w-1/2">
                    <SelectValue placeholder="Select provider type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP Server</SelectItem>
                    <SelectItem value="api">Email API (EmailJS, SendGrid, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitSMTPSettings)} className="space-y-6">
                  {smtpProvider === "smtp" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="service"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select service" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="gmail">Gmail</SelectItem>
                                  <SelectItem value="outlook">Outlook</SelectItem>
                                  <SelectItem value="yahoo">Yahoo</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select your email service provider
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="host"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Host</FormLabel>
                              <FormControl>
                                <Input placeholder="smtp.example.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                The hostname of your SMTP server
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="port"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Port</FormLabel>
                              <FormControl>
                                <Input placeholder="587 or 465" {...field} />
                              </FormControl>
                              <FormDescription>
                                The port for your SMTP server (usually 587 or 465)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="secure"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Use Secure Connection (SSL/TLS)
                                </FormLabel>
                                <FormDescription>
                                  Enable for secure email transmission (recommended)
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Username</FormLabel>
                              <FormControl>
                                <Input placeholder="your-email@example.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                Usually your email address
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SMTP Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your email password or app password
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Email</FormLabel>
                            <FormControl>
                              <Input placeholder="noreply@yourapp.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              The email address that will appear as the sender
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="service"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Service</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select API service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="emailjs">EmailJS</SelectItem>
                                <SelectItem value="sendgrid">SendGrid</SelectItem>
                                <SelectItem value="mailchimp">Mailchimp</SelectItem>
                                <SelectItem value="custom">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select your email API service
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Your API key" {...field} />
                            </FormControl>
                            <FormDescription>
                              The API key for your email service
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Email</FormLabel>
                            <FormControl>
                              <Input placeholder="noreply@yourapp.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              The email address that will appear as the sender
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="mr-2">Saving...</span>
                          <span className="animate-spin">⏳</span>
                        </>
                      ) : (
                        <>
                          <Server className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleTestEmail}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="mr-2">Testing...</span>
                          <span className="animate-spin">⏳</span>
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Test Email
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings; 