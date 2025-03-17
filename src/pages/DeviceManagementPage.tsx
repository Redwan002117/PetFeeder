import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDeviceData } from '@/hooks/use-device-data';
import { useFeedingHistory } from '@/hooks/use-feeding-history';
import { useDeviceSchedules } from '@/hooks/use-device-schedules';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import DeviceStatusBadge from '@/components/DeviceStatusBadge';
import DeviceDetailsHeader from '@/components/DeviceDetailsHeader';
import DeviceFeedControl from '@/components/DeviceFeedControl';
import DeviceScheduleItem from '@/components/DeviceScheduleItem';
import ScheduleForm from '@/components/ScheduleForm';
import DeviceSettingsForm from '@/components/DeviceSettingsForm';
import FeedingHistoryChart from '@/components/FeedingHistoryChart';
import { 
  ArrowLeft, Battery, Clock, Calendar, Plus, Wifi, AlertTriangle,
  RefreshCw, Settings, BarChart2, Loader2, CheckCircle
} from 'lucide-react';

const DeviceManagementPage = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tab, setTab] = useState('overview');
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  
  // Fetch device data using our custom hook
  const { 
    device, 
    loading, 
    error, 
    isOnline, 
    refreshData, 
    updateDevice 
  } = useDeviceData(deviceId || '');
  
  // Fetch device feeding history
  const {
    history,
    stats,
    loading: historyLoading,
    refresh: refreshHistory
  } = useFeedingHistory(deviceId || '');
  
  // Fetch device schedules
  const {
    schedules,
    loading: schedulesLoading,
    toggleSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule
  } = useDeviceSchedules(deviceId || '');
  
  // Set initial device name when data loads
  useEffect(() => {
    if (device?.name) {
      setNewName(device.name);
    }
  }, [device]);
  
  // Handle device not found
  if (error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
          <h2 className="text-2xl font-bold">Device Not Found</h2>
          <p className="text-muted-foreground">
            The device you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  // Handle loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <h2 className="text-xl font-medium">Loading Device Data...</h2>
        </div>
      </div>
    );
  }
  
  // Handle updating device name
  const handleUpdateName = async () => {
    if (!newName.trim() || newName === device?.name) {
      setEditNameOpen(false);
      return;
    }
    
    try {
      await updateDevice({ name: newName });
      toast({
        title: "Success",
        description: "Device name updated successfully",
      });
      setEditNameOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update device name",
        variant: "destructive",
      });
    }
  };
  
  // Handle schedule actions
  const handleCreateSchedule = async (schedule: any) => {
    try {
      await createSchedule({
        device_id: deviceId || '',
        time: schedule.time,
        days: schedule.days,
        amount: schedule.amount,
        enabled: schedule.enabled,
      });
      
      toast({
        title: "Schedule Created",
        description: "Feeding schedule has been created successfully",
      });
      
      setScheduleFormOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateSchedule = async (id: string, updates: any) => {
    try {
      await updateSchedule(id, updates);
      
      toast({
        title: "Schedule Updated",
        description: "Feeding schedule has been updated successfully",
      });
      
      setScheduleFormOpen(false);
      setEditingSchedule(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }
    
    try {
      await deleteSchedule(id);
      
      toast({
        title: "Schedule Deleted",
        description: "Feeding schedule has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };
  
  const handleEditSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    setScheduleFormOpen(true);
  };
  
  const handleScheduleFormSubmit = async (schedule: any) => {
    if (editingSchedule) {
      await handleUpdateSchedule(editingSchedule.id, schedule);
    } else {
      await handleCreateSchedule(schedule);
    }
  };
  
  const handleFeedSuccess = () => {
    // Add a small delay before refreshing history data
    setTimeout(() => {
      refreshHistory();
    }, 2000);
  };
  
  if (!device) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-6">
      <DeviceDetailsHeader
        id={device.id}
        name={device.name}
        status={device.status}
        batteryLevel={device.battery_level || 0}
        lastSeen={device.last_seen}
        onEditName={() => setEditNameOpen(true)}
      />
      
      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="history">Feeding History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Status Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-muted p-6">
                  <h3 className="text-lg font-medium mb-4">Device Status</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Status</span>
                        <DeviceStatusBadge status={device.status} />
                      </div>
                      
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Food Level</span>
                        <span>{device.food_level || 0}%</span>
                      </div>
                      <Progress 
                        value={device.food_level || 0} 
                        className={`h-2 ${device.food_level && device.food_level < 20 ? 'bg-red-500' : ''}`}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Battery className="h-4 w-4 mr-1" />
                        <span className="text-sm">{device.battery_level || 100}%</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Wifi className="h-4 w-4 mr-1" />
                        <span className="text-sm">{device.wifi_strength || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>
                          Last seen {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={refreshData}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Feed Control Card */}
            <DeviceFeedControl 
              deviceId={device.id} 
              disabled={!isOnline}
              onFeedSuccess={handleFeedSuccess}
            />
          </div>
          
          {/* Recent Feedings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Recent Feedings</h3>
            
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {history.slice(0, 5).map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <p className="font-medium">{event.amount}g of food dispensed</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="bg-muted text-muted-foreground text-xs py-1 px-2 rounded-full uppercase">
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="text-center">
                  <Button variant="link" onClick={() => setTab('history')}>
                    View All Feeding History
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No feeding history available
              </div>
            )}
          </div>
          
          {/* Next Scheduled Feedings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Next Scheduled Feedings</h3>
            
            {schedulesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : schedules.filter(s => s.enabled).length > 0 ? (
              <div className="space-y-4">
                {schedules
                  .filter(s => s.enabled)
                  .slice(0, 3)
                  .map((schedule) => (
                    <Card key={schedule.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-primary mr-2" />
                            <div>
                              <p className="font-medium">{schedule.time}</p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.amount}g • {getDayNames(schedule.days)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                
                <div className="text-center">
                  <Button variant="link" onClick={() => setTab('schedules')}>
                    View All Schedules
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active feeding schedules
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="schedules" className="space-y-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Feeding Schedules</h3>
            <Button onClick={() => {
              setEditingSchedule(null);
              setScheduleFormOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </div>
          
          {schedulesLoading ? (
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
                  onToggle={toggleSchedule}
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
                setScheduleFormOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Schedule
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Feeding History</h3>
            <Button variant="outline" onClick={refreshHistory}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Feedings</p>
                <p className="text-3xl font-bold">{stats?.totalFeedings || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-3xl font-bold">{stats?.totalAmount || 0}g</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Today's Feedings</p>
                <p className="text-3xl font-bold">{stats?.feedingsToday || 0}</p>
              </CardContent>
            </Card>
          </div>
          
          <FeedingHistoryChart history={history} loading={historyLoading} />
          
          <div className="mt-6">
            <h4 className="text-lg font-medium mb-4">Detailed Feeding Log</h4>
            
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : history.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium">Date & Time</th>
                      <th className="py-3 px-4 text-left font-medium">Amount</th>
                      <th className="py-3 px-4 text-left font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((event) => (
                      <tr key={event.id}>
                        <td className="py-3 px-4">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">{event.amount}g</td>
                        <td className="py-3 px-4">
                          <span className="bg-muted text-muted-foreground text-xs py-1 px-2 rounded-full uppercase">
                            {event.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No feeding history available
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6 mt-6">
          <div className="max-w-2xl mx-auto">
            <DeviceSettingsForm 
              deviceId={device.id} 
              onSaved={refreshData}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit Name Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Schedule Form Dialog */}
      <ScheduleForm
        open={scheduleFormOpen}
        onClose={() => {
          setScheduleFormOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={handleScheduleFormSubmit}
        initialData={editingSchedule}
        deviceId={device.id}
      />
    </div>
  );
};

// Helper function to format days
function getDayNames(days: boolean[]) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days
    .map((enabled, index) => enabled ? dayNames[index] : null)
    .filter(Boolean)
    .join(', ');
}

export default DeviceManagementPage;
