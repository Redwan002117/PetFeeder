import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Clock, Plus, Trash2, Check, X, AlertCircle } from "lucide-react";
import { getFeedingSchedule, saveFeedingSchedule } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const Schedule = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    time: "08:00",
    amount: 25,
    enabled: true,
    days: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = getFeedingSchedule(currentUser.uid, (data) => {
        if (data) {
          const scheduleArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setSchedules(scheduleArray.sort((a, b) => {
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
          }));
        } else {
          setSchedules([]);
        }
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleAddSchedule = async () => {
    if (currentUser) {
      setLoading(true);
      try {
        // Create a new schedule object with a unique ID
        const newScheduleWithId = {
          ...newSchedule,
          id: Date.now().toString(),
        };

        // Add to current schedules
        const updatedSchedules = [...schedules, newScheduleWithId];
        
        // Create object from array for Firebase
        const scheduleObject = updatedSchedules.reduce((acc, schedule) => {
          acc[schedule.id] = { ...schedule };
          // Remove the id from the nested object since it's already the key
          delete acc[schedule.id].id;
          return acc;
        }, {});

        // Save to Firebase
        await saveFeedingSchedule(currentUser.uid, scheduleObject);
        
        // Reset form and close dialog
        setNewSchedule({
          time: "08:00",
          amount: 25,
          enabled: true,
          days: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true
          }
        });
        setDialogOpen(false);
        
        toast({
          title: "Schedule Added",
          description: "Your feeding schedule has been added successfully",
        });
      } catch (error) {
        console.error("Error adding schedule:", error);
        toast({
          title: "Error",
          description: "Failed to add feeding schedule",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    if (currentUser) {
      try {
        const updatedSchedules = schedules.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, enabled: !enabled } 
            : schedule
        );
        
        // Create object from array for Firebase
        const scheduleObject = updatedSchedules.reduce((acc, schedule) => {
          acc[schedule.id] = { ...schedule };
          delete acc[schedule.id].id;
          return acc;
        }, {});

        await saveFeedingSchedule(currentUser.uid, scheduleObject);
        
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
      }
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (currentUser) {
      try {
        const updatedSchedules = schedules.filter(schedule => schedule.id !== scheduleId);
        
        // Create object from array for Firebase
        const scheduleObject = updatedSchedules.reduce((acc, schedule) => {
          acc[schedule.id] = { ...schedule };
          delete acc[schedule.id].id;
          return acc;
        }, {});

        await saveFeedingSchedule(currentUser.uid, scheduleObject);
        
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
      }
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const dayAbbreviations = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun"
  };

  const getDayLabel = (schedule: any) => {
    const days = Object.entries(schedule.days)
      .filter(([_, enabled]) => enabled)
      .map(([day]) => dayAbbreviations[day as keyof typeof dayAbbreviations]);
    
    if (days.length === 7) return "Every day";
    if (days.length === 0) return "Never";
    if (days.length === 5 && !schedule.days.saturday && !schedule.days.sunday) return "Weekdays";
    if (days.length === 2 && schedule.days.saturday && schedule.days.sunday) return "Weekends";
    
    return days.join(", ");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Feeding Schedule</CardTitle>
            <CardDescription>Set up automatic feeding times for your pet</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="schedule-dialog-description">
              <DialogHeader>
                <DialogTitle>Add Feeding Schedule</DialogTitle>
                <DialogDescription id="schedule-dialog-description">
                  Set up a new automatic feeding schedule for your pet.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="time">Feeding Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="amount">Amount (grams)</Label>
                    <span className="text-sm font-medium">{newSchedule.amount}g</span>
                  </div>
                  <Slider
                    id="amount"
                    min={5}
                    max={100}
                    step={5}
                    value={[newSchedule.amount]}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, amount: value[0] })}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Repeat on days</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {Object.entries(dayAbbreviations).map(([day, abbr]) => (
                      <div 
                        key={day} 
                        className={`text-center cursor-pointer p-2 rounded-md ${
                          newSchedule.days[day as keyof typeof newSchedule.days] 
                            ? "bg-pet-primary text-white" 
                            : "bg-muted"
                        }`}
                        onClick={() => setNewSchedule({
                          ...newSchedule,
                          days: {
                            ...newSchedule.days,
                            [day]: !newSchedule.days[day as keyof typeof newSchedule.days]
                          }
                        })}
                      >
                        {abbr}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSchedule} disabled={loading}>
                  {loading ? "Adding..." : "Add Schedule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${schedule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Clock className={`h-5 w-5 ${schedule.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{formatTime(schedule.time)}</p>
                      <p className="text-sm text-muted-foreground">{getDayLabel(schedule)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium mr-2">{schedule.amount}g</span>
                    <Switch 
                      checked={schedule.enabled} 
                      onCheckedChange={() => handleToggleSchedule(schedule.id, schedule.enabled)} 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No feeding schedules</h3>
              <p className="text-muted-foreground mb-4">
                Set up automatic feeding times for your pet
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Schedule Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-pet-primary mt-0.5" />
              <p className="text-sm">
                Adult dogs usually need to be fed twice a day, while puppies might need 3-4 smaller meals.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-pet-primary mt-0.5" />
              <p className="text-sm">
                Adult cats often prefer multiple small meals throughout the day rather than 1-2 larger meals.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-pet-primary mt-0.5" />
              <p className="text-sm">
                Keep feeding times consistent to help pets maintain healthy digestive routines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
