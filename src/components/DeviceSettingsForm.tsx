import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Separator } from "@/components/ui/separator";

interface DeviceSettingsFormProps {
  deviceId: string;
  initialSettings?: DeviceSettings | null;
  onSaved?: () => void;
}

interface DeviceSettings {
  max_feed_amount: number;
  min_feed_amount: number;
  default_feed_amount: number;
  low_food_level_threshold: number;
  low_battery_threshold: number;
  notification_enabled: boolean;
}

const formSchema = z.object({
  max_feed_amount: z.number().min(5).max(200),
  min_feed_amount: z.number().min(1).max(50),
  default_feed_amount: z.number().min(1).max(100),
  low_food_level_threshold: z.number().min(5).max(50),
  low_battery_threshold: z.number().min(5).max(50),
  notification_enabled: z.boolean().default(true),
});

export const DeviceSettingsForm: React.FC<DeviceSettingsFormProps> = ({
  deviceId,
  initialSettings,
  onSaved
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const defaultValues: DeviceSettings = {
    max_feed_amount: 100,
    min_feed_amount: 5,
    default_feed_amount: 20,
    low_food_level_threshold: 20,
    low_battery_threshold: 15,
    notification_enabled: true,
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialSettings || defaultValues,
  });
  
  // Update form values when initialSettings change
  useEffect(() => {
    if (initialSettings) {
      form.reset(initialSettings);
    }
  }, [initialSettings, form]);
  
  // If no initial settings, fetch from database
  useEffect(() => {
    if (!initialSettings) {
      const fetchSettings = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('device_settings')
            .select('*')
            .eq('device_id', deviceId)
            .single();
            
          if (error) {
            throw error;
          }
          
          if (data) {
            form.reset(data);
          }
        } catch (error) {
          console.error('Error fetching device settings:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSettings();
    }
  }, [deviceId, initialSettings, form]);
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      // Ensure default feed amount is within the min and max range
      data.default_feed_amount = Math.min(
        Math.max(data.default_feed_amount, data.min_feed_amount),
        data.max_feed_amount
      );
      
      const { error } = await supabase
        .from('device_settings')
        .upsert({
          device_id: deviceId,
          ...data
        });
        
      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: "Your device settings have been updated successfully.",
      });
      
      if (onSaved) onSaved();
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message || "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const minFeed = form.watch('min_feed_amount');
  const maxFeed = form.watch('max_feed_amount');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Settings</CardTitle>
        <CardDescription>
          Configure your PetFeeder device settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Feeding Settings</h3>
                <Separator />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="min_feed_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Feed Amount (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum amount for each feeding
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="max_feed_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Feed Amount (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={10}
                            max={200}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum amount for each feeding
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="default_feed_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Feed Amount (g)</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={minFeed || 5}
                            max={maxFeed || 100}
                            step={1}
                            onValueChange={(values) => field.onChange(values[0])}
                            disabled={loading}
                            className="flex-grow"
                          />
                        </FormControl>
                        <span className="w-12 text-right font-medium">{field.value}g</span>
                      </div>
                      <FormDescription>
                        Default amount used for manual feeding
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alerts & Notifications</h3>
                <Separator />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="low_food_level_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Food Level Threshold (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={50}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Trigger alert when food level is below this percentage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="low_battery_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Battery Threshold (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={50}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Trigger alert when battery level is below this percentage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notification_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Notifications</FormLabel>
                        <FormDescription>
                          Receive alerts for low food level, low battery, and feeding events
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DeviceSettingsForm;
