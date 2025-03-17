import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface NotificationPreferences {
  low_food_level: boolean;
  low_battery: boolean;
  device_offline: boolean;
  feeding_completed: boolean;
  schedule_changes: boolean;
  device_updates: boolean;
  weekly_summary: boolean;
}

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    low_food_level: true,
    low_battery: true,
    device_offline: true,
    feeding_completed: true,
    schedule_changes: false,
    device_updates: true,
    weekly_summary: false
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchNotificationSettings = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          throw error;
        }
        
        // Update state if we have data
        if (data) {
          setPreferences({
            low_food_level: data.low_food_level ?? true,
            low_battery: data.low_battery ?? true,
            device_offline: data.device_offline ?? true,
            feeding_completed: data.feeding_completed ?? true,
            schedule_changes: data.schedule_changes ?? false,
            device_updates: data.device_updates ?? true,
            weekly_summary: data.weekly_summary ?? false
          });
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotificationSettings();
  }, [currentUser]);
  
  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const savePreferences = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: currentUser.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Notification Settings</CardTitle>
          <CardDescription>
            Choose which events you want to be notified about
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Notification Settings</CardTitle>
        <CardDescription>
          Choose which events you want to be notified about
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pref-low-food">Low Food Level</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your pet feeder is running low on food
              </p>
            </div>
            <Switch
              id="pref-low-food"
              checked={preferences.low_food_level}
              onCheckedChange={() => handleToggle('low_food_level')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pref-low-battery">Low Battery</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your pet feeder's battery is low
              </p>
            </div>
            <Switch
              id="pref-low-battery"
              checked={preferences.low_battery}
              onCheckedChange={() => handleToggle('low_battery')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pref-offline">Device Offline</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your device goes offline
              </p>
            </div>
            <Switch
              id="pref-offline"
              checked={preferences.device_offline}
              onCheckedChange={() => handleToggle('device_offline')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pref-feeding">Feeding Completed</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a feeding is completed
              </p>
            </div>
            <Switch
              id="pref-feeding"
              checked={preferences.feeding_completed}
              onCheckedChange={() => handleToggle('feeding_completed')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pref-schedule">Schedule Changes</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when feeding schedules are changed
              </p>
            </div>
            <Switch
              id="pref-schedule"
              checked={preferences.schedule_changes}
              onCheckedChange={() => handleToggle('schedule_changes')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pref-updates">Device Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about firmware updates and device status
              </p>
            </div>
            <Switch
              id="pref-updates"
              checked={preferences.device_updates}
              onCheckedChange={() => handleToggle('device_updates')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pref-summary">Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your pet's feeding activity
              </p>
            </div>
            <Switch
              id="pref-summary"
              checked={preferences.weekly_summary}
              onCheckedChange={() => handleToggle('weekly_summary')}
            />
          </div>
        </div>
        
        <Button 
          onClick={savePreferences} 
          disabled={saving || !currentUser}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;