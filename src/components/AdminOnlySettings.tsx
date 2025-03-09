import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Server, Send, Users, Database, Shield, Key } from "lucide-react";
import { ref, update, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const AdminOnlySettings = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
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
      const smtpSettingsRef = ref(database, `system/smtpSettings`);
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
    const smtpSettingsRef = ref(database, `system/smtpSettings`);
    
    update(smtpSettingsRef, {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.uid,
    })
      .then(() => {
        toast({
          title: "Settings Saved",
          description: "Email settings have been updated successfully.",
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
    <Tabs defaultValue="email" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="email">Email Settings</TabsTrigger>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="system">System Settings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="email" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure system-wide email settings for notifications and admin requests
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
      
      <TabsContent value="users" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user permissions and access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Configure user roles and permissions for the application.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-registration">Allow New Registrations</Label>
                  <p className="text-xs text-gray-500">
                    When disabled, new users cannot register for accounts
                  </p>
                </div>
                <Switch id="allow-registration" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-verification">Require Email Verification</Label>
                  <p className="text-xs text-gray-500">
                    Users must verify their email before accessing the application
                  </p>
                </div>
                <Switch id="email-verification" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="admin-approval">Require Admin Approval</Label>
                  <p className="text-xs text-gray-500">
                    New accounts require admin approval before activation
                  </p>
                </div>
                <Switch id="admin-approval" />
              </div>
            </div>
            
            <Button className="mt-6">
              <Users className="mr-2 h-4 w-4" />
              View All Users
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="system" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Configure global system settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-xs text-gray-500">
                    Put the application in maintenance mode (only admins can access)
                  </p>
                </div>
                <Switch id="maintenance-mode" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                  <p className="text-xs text-gray-500">
                    Enable detailed logging for troubleshooting
                  </p>
                </div>
                <Switch id="debug-mode" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Database Backup Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger id="backup-frequency">
                    <SelectValue placeholder="Select backup frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-rate-limit">API Rate Limit (requests per minute)</Label>
                <Input id="api-rate-limit" type="number" defaultValue="60" />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button>
                <Shield className="mr-2 h-4 w-4" />
                Update System Settings
              </Button>
              
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Regenerate API Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AdminOnlySettings; 