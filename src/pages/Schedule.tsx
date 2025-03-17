import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Calendar, Loader2, CalendarClock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import DeviceScheduleItem from '@/components/DeviceScheduleItem';
import ScheduleForm from '@/components/ScheduleForm';

interface Schedule {
  id: string;
  device_id: string;
  time: string;
  days: boolean[];
  amount: number;
  enabled: boolean;
}

const Schedule = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  
  // New schedule form state
  const [newSchedule, setNewSchedule] = useState({
    time: "08:00",
    amount: 25,
    enabled: true,
    days: [true, true, true, true, true, true, true] // Sunday to Saturday
  });
  
  // Fetch devices and schedules on component mount
  useEffect(() => {
    if (currentUser) {
      fetchDevices();
    }
  }, [currentUser]);
  
  // Fetch schedules when selectedDevice changes
  useEffect(() => {
    if (selectedDevice) {
      fetchSchedules(selectedDevice);
    }
  }, [selectedDevice]);
  
  const fetchDevices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, status')
        .eq('owner_id', currentUser?.id);
      
      if (error) throw error;
      
      setDevices(data || []);
      
      // Auto-select first device if available
      if (data && data.length > 0) {
        setSelectedDevice(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to load your devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSchedules = async (deviceId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('feeding_schedules')
        .select('*')
        .eq('device_id', deviceId)
        .order('time');
      
      if (error) throw error;
      
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load feeding schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    if (currentUser) {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('feeding_schedules')
          .update({ enabled: !enabled })
          .eq('id', scheduleId);
          
        if (error) throw error;
        
        // Update local state
        setSchedules(schedules.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, enabled: !enabled } 
            : schedule
        ));
        
        toast({
          title: enabled ? "Schedule Disabled" : "Schedule Enabled",
          description: `Feeding schedule has been ${enabled ? "disabled" : "enabled"} successfully`,
        });
      } catch (error) {
        console.error("Error toggling schedule:", error);
        toast({
          title: "Error",
          description: "Failed to update feeding schedule",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (currentUser) {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('feeding_schedules')
          .delete()
          .eq('id', scheduleId);
          
        if (error) throw error;
        
        // Update local state
        setSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
        
        toast({
          title: "Schedule Deleted",
          description: "Feeding schedule has been deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting schedule:", error);
        toast({
          title: "Error",
          description: "Failed to delete feeding schedule",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Feeding Schedule"
        icon={<CalendarClock className="h-6 w-6" />}
        description="Set up and manage automatic feeding schedules"
      />
      
      {devices.length === 0 ? (
        <Alert className="my-6">
          <AlertDescription>
            You need to set up a device before you can create feeding schedules.
            <Button variant="link" className="p-0 ml-2" onClick={() => window.location.href = '/connectivity'}>
              Set up a device
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Device selector */}
          {devices.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {devices.map(device => (
                <Button
                  key={device.id}
                  variant={selectedDevice === device.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDevice(device.id)}
                >
                  {device.name}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Schedules for {devices.find(d => d.id === selectedDevice)?.name}
            </h2>
            <Button onClick={() => {
              setEditingSchedule(null);
              setDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </div>
          
          {/* Show schedules or loading state */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <DeviceScheduleItem
                  key={schedule.id}
                  id={schedule.id}
                  time={schedule.time}
                  days={schedule.days}
                  amount={schedule.amount}
                  enabled={schedule.enabled}
                  onToggle={handleToggleSchedule}
                  onEdit={() => handleEditSchedule(schedule)}
                  onDelete={handleDeleteSchedule}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No schedules yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a schedule to automatically feed your pet at specific times
              </p>
              <Button onClick={() => {
                setEditingSchedule(null);
                setDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Schedule
              </Button>
            </div>
          )}
          
          {/* Schedule Form Dialog */}
          {selectedDevice && (
            <ScheduleForm
              open={dialogOpen}
              onClose={() => {
                setDialogOpen(false);
                setEditingSchedule(null);
              }}
              onSubmit={async (schedule) => {
                try {
                  setLoading(true);
                  
                  if (editingSchedule) {
                    await supabase
                      .from('feeding_schedules')
                      .update(schedule)
                      .eq('id', editingSchedule.id);
                    
                    toast({
                      title: "Schedule Updated",
                      description: "Your feeding schedule has been updated successfully",
                    });
                  } else {
                    await supabase
                      .from('feeding_schedules')
                      .insert([{
                        ...schedule,
                        device_id: selectedDevice
                      }]);
                    
                    toast({
                      title: "Schedule Created",
                      description: "Your feeding schedule has been created successfully",
                    });
                  }
                  
                  // Refresh schedules
                  fetchSchedules(selectedDevice);
                  setDialogOpen(false);
                  setEditingSchedule(null);
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to save schedule",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              initialData={editingSchedule ? {
                time: editingSchedule.time,
                days: editingSchedule.days,
                amount: editingSchedule.amount,
                enabled: editingSchedule.enabled
              } : undefined}
              deviceId={selectedDevice}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Schedule;
