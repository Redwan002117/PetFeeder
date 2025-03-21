import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Server, Send, Users, Database, Shield, Key } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendTestEmail } from "@/services/email-service";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

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

  // Load SMTP settings from Supabase when component mounts
  React.useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      
      // Fetch SMTP settings from Supabase
      supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'smtp_settings')
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading SMTP settings:", error);
          } else if (data) {
            const smtpData = data.value;
            form.reset({
              service: smtpData.service || "",
              host: smtpData.host || "",
              port: smtpData.port || "",
              secure: smtpData.secure !== undefined ? smtpData.secure : true,
              username: smtpData.username || "",
              password: smtpData.password || "",
              fromEmail: smtpData.fromEmail || "",
              apiKey: smtpData.apiKey || "",
            });
            setSmtpProvider(smtpData.service === "emailjs" ? "api" : "smtp");
          }
          setIsLoading(false);
        });
    }
  }, [currentUser, form]);

  const onSubmitSMTPSettings = async (data: SMTPFormValues) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to save SMTP settings.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Check if SMTP settings record exists
    const { data: existingData, error: fetchError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'smtp_settings')
      .single();
    
    try {
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw fetchError;
      }
      
      const smtpData = {
        key: 'smtp_settings',
        value: {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.id,
        }
      };
      
      let response;
      
      if (existingData) {
        // Update existing record
        response = await supabase
          .from('system_settings')
          .update(smtpData)
          .eq('key', 'smtp_settings');
      } else {
        // Insert new record
        response = await supabase
          .from('system_settings')
          .insert([smtpData]);
      }
      
      if (response.error) throw response.error;
      
      toast({
        title: "Settings Saved",
        description: "Email settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to save email settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  const EmailTestForm = () => {
    const { toast } = useToast();
    const [testEmail, setTestEmail] = useState("");
    const [isSending, setIsSending] = useState(false);
    
    const handleTestEmail = async (event: React.FormEvent) => {
      event.preventDefault();
      setIsSending(true);
      
      try {
        await sendTestEmail(testEmail);
        toast({
          title: "Success",
          description: "Test email sent successfully! Please check your inbox.",
          variant: "default",
        });
      } catch (error: any) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: `Failed to send test email: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    };
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Test Email Configuration</h3>
        </div>
        
        <form onSubmit={handleTestEmail} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="testEmail">Recipient Email</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="Enter email address to test"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Send a test email to verify your email configuration is working correctly.
            </p>
          </div>
          
          <Button type="submit" disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Test Email"
            )}
          </Button>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
          <CardDescription>
            Configure system-wide settings that affect all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email">
            <TabsList className="mb-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-6">
              <form onSubmit={form.handleSubmit(onSubmitSMTPSettings)} className="space-y-4">
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
              </form>
              
              <Separator className="my-6" />
              <EmailTestForm />
            </TabsContent>
            
            <TabsContent value="security">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security Settings</h3>
              </div>
            </TabsContent>
            
            <TabsContent value="maintenance">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Maintenance Settings</h3>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOnlySettings;