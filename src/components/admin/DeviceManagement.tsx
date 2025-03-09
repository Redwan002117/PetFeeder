import React, { useState, useEffect, useRef } from 'react';
import { database, ref, get, update, onValue, off, push } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, Edit, Trash2, AlertTriangle, CheckCircle, Server, Plus, RefreshCw, Download, BarChart, Battery, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  lastSeen: number;
  userId: string;
  foodLevel: number;
  batteryLevel?: number;
  location?: string;
}

interface DeviceStats {
  feedingsToday: number;
  totalFeedings: number;
  averageFoodPerDay: number;
  lastMaintenanceDate?: number;
  uptime: number;
}

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [deviceStatus, setDeviceStatus] = useState<'online' | 'offline' | 'error' | 'maintenance'>('online');
  const [deviceLocation, setDeviceLocation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [addDeviceDialogOpen, setAddDeviceDialogOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('');
  const [newDeviceSerial, setNewDeviceSerial] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const devicesRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up real-time listener for devices
    devicesRef.current = ref(database, 'devices');
    
    const devicesListener = onValue(devicesRef.current, (snapshot) => {
      if (!snapshot.exists()) {
        setDevices([]);
        setLoading(false);
        return;
      }
      
      const devicesData = snapshot.val();
      
      // Convert to array
      const devicesArray = Object.entries(devicesData || {}).map(([id, data]: [string, any]) => ({
        id,
        ...data,
        lastSeen: data.lastSeen || 0
      }));
      
      // Sort devices by name
      devicesArray.sort((a, b) => a.name.localeCompare(b.name));
      
      setDevices(devicesArray);
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => {
      if (devicesRef.current) {
        off(devicesRef.current);
      }
    };
  }, []);

  const fetchDeviceStats = async (deviceId: string) => {
    setStatsLoading(true);
    try {
      // Fetch device stats from Firebase
      const statsRef = ref(database, `deviceStats/${deviceId}`);
      const statsSnapshot = await get(statsRef);
      
      if (!statsSnapshot.exists()) {
        // Create default stats if none exist
        const defaultStats: DeviceStats = {
          feedingsToday: 0,
          totalFeedings: 0,
          averageFoodPerDay: 0,
          uptime: 0
        };
        setDeviceStats(defaultStats);
      } else {
        setDeviceStats(statsSnapshot.val());
      }
    } catch (error) {
      console.error('Error fetching device stats:', error);
      toast({
        title: "Error",
        description: "Failed to load device statistics.",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    fetchDeviceStats(device.id);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setDeviceName(device.name);
    setDeviceStatus(device.status);
    setDeviceLocation(device.location || '');
  };

  const handleSaveDevice = async () => {
    if (!editingDevice) return;
    
    try {
      // Update device in Firebase Realtime Database
      const deviceRef = ref(database, `devices/${editingDevice.id}`);
      await update(deviceRef, {
        name: deviceName,
        status: deviceStatus,
        location: deviceLocation
      });
      
      // Update local state
      setDevices(devices.map(device => 
        device.id === editingDevice.id 
          ? { ...device, name: deviceName, status: deviceStatus, location: deviceLocation } 
          : device
      ));
      
      toast({
        title: "Device Updated",
        description: "Device information has been updated successfully.",
        variant: "default",
      });
      
      setEditingDevice(null);
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update device information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (device: Device) => {
    setDeviceToDelete(device);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    
    try {
      // Delete device from Firebase Realtime Database
      const deviceRef = ref(database, `devices/${deviceToDelete.id}`);
      await update(deviceRef, null);
      
      // Update local state
      setDevices(devices.filter(device => device.id !== deviceToDelete.id));
      
      toast({
        title: "Device Deleted",
        description: "Device has been deleted successfully.",
        variant: "default",
      });
      
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    } catch (error) {
      console.error('Error deleting device:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddDevice = async () => {
    if (!newDeviceName || !newDeviceModel || !newDeviceSerial) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create new device in Firebase
      const newDeviceRef = push(ref(database, 'devices'));
      const newDevice = {
        name: newDeviceName,
        model: newDeviceModel,
        serialNumber: newDeviceSerial,
        status: 'offline',
        firmwareVersion: '1.0.0',
        lastSeen: Date.now(),
        foodLevel: 100,
        batteryLevel: 100,
        location: 'Default Location'
      };
      
      await update(newDeviceRef, newDevice);
      
      toast({
        title: "Device Added",
        description: "New device has been added successfully.",
        variant: "default",
      });
      
      // Reset form
      setNewDeviceName('');
      setNewDeviceModel('');
      setNewDeviceSerial('');
      setAddDeviceDialogOpen(false);
    } catch (error) {
      console.error('Error adding device:', error);
      toast({
        title: "Add Failed",
        description: "Failed to add new device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!selectedDevice) return;
    
    try {
      // Update device status and add maintenance record
      const deviceRef = ref(database, `devices/${selectedDevice.id}`);
      await update(deviceRef, {
        status: 'maintenance'
      });
      
      // Add maintenance record
      const maintenanceRef = push(ref(database, `maintenance/${selectedDevice.id}`));
      await update(maintenanceRef, {
        date: Date.now(),
        notes: maintenanceNotes,
        completed: false
      });
      
      toast({
        title: "Maintenance Scheduled",
        description: "Device has been scheduled for maintenance.",
        variant: "default",
      });
      
      setMaintenanceDialogOpen(false);
      setMaintenanceNotes('');
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast({
        title: "Schedule Failed",
        description: "Failed to schedule maintenance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportDeviceData = () => {
    if (!selectedDevice) return;
    
    // Create CSV data
    const headers = Object.keys(selectedDevice).join(',');
    const values = Object.values(selectedDevice).join(',');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${values}`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `device_${selectedDevice.id}_data.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "Device data has been exported successfully.",
      variant: "default",
    });
  };

  // Filter devices based on search term and status filter
  const filteredDevices = devices.filter(device => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = (
      device.name.toLowerCase().includes(searchTermLower) ||
      device.model.toLowerCase().includes(searchTermLower) ||
      device.serialNumber.toLowerCase().includes(searchTermLower) ||
      (device.location && device.location.toLowerCase().includes(searchTermLower))
    );
    
    // Apply status filter
    if (filterStatus === 'all') {
      return matchesSearch;
    } else {
      return matchesSearch && device.status === filterStatus;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Online</Badge>;
      case 'offline':
        return <Badge variant="secondary" className="flex items-center gap-1"><Server className="h-3 w-3" /> Offline</Badge>;
      case 'error':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Error</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-500"><AlertTriangle className="h-3 w-3" /> Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatLastSeen = (timestamp: number) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const fetchDevices = async () => {
    try {
      setLoading(true);
      
      // Fetch devices from Firebase Realtime Database
      const devicesRef = ref(database, 'devices');
      const devicesSnapshot = await get(devicesRef);
      
      if (!devicesSnapshot.exists()) {
        setDevices([]);
        setLoading(false);
        return;
      }
      
      const devicesData = devicesSnapshot.val();
      
      // Convert to array
      const devicesArray = Object.entries(devicesData || {}).map(([id, data]: [string, any]) => ({
        id,
        ...data,
        lastSeen: data.lastSeen || 0
      }));
      
      // Sort devices by name
      devicesArray.sort((a, b) => a.name.localeCompare(b.name));
      
      setDevices(devicesArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to load devices. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center w-full">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
      </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddDeviceDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Device
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDevices()}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {selectedDevice ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{selectedDevice.name}</h2>
            <Button variant="outline" onClick={() => setSelectedDevice(null)}>
              Back to List
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedDevice.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Model</p>
                  <p>{selectedDevice.model}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Serial Number</p>
                  <p>{selectedDevice.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Firmware Version</p>
                  <p>{selectedDevice.firmwareVersion}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Seen</p>
                  <p>{formatLastSeen(selectedDevice.lastSeen)}</p>
                    </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p>{selectedDevice.location || 'Not specified'}</p>
                    </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Status Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Food Level</p>
                    <p className="text-sm font-medium">{selectedDevice.foodLevel}%</p>
                  </div>
                  <Progress value={selectedDevice.foodLevel} className="h-2" />
                  </div>
                
                {selectedDevice.batteryLevel !== undefined && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">Battery Level</p>
                      <p className="text-sm font-medium">{selectedDevice.batteryLevel}%</p>
                    </div>
                    <Progress 
                      value={selectedDevice.batteryLevel} 
                      className={`h-2 ${selectedDevice.batteryLevel < 20 ? 'bg-red-200' : ''}`}
                    />
                  </div>
                )}
                
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setMaintenanceDialogOpen(true)}
                  >
                    <Zap className="h-4 w-4" /> Schedule Maintenance
                  </Button>
                </div>
                
                <div>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleExportDeviceData}
                  >
                    <Download className="h-4 w-4" /> Export Device Data
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Device Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : deviceStats ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Feedings Today</p>
                      <p className="text-2xl font-bold">{deviceStats.feedingsToday}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Feedings</p>
                      <p className="text-2xl font-bold">{deviceStats.totalFeedings}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Avg. Food Per Day</p>
                      <p className="text-2xl font-bold">{deviceStats.averageFoodPerDay.toFixed(1)} g</p>
                    </div>
                    {deviceStats.lastMaintenanceDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Maintenance</p>
                        <p>{formatLastSeen(deviceStats.lastMaintenanceDate)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Uptime</p>
                      <p>{Math.round(deviceStats.uptime)}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No statistics available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Device Management</CardTitle>
            <CardDescription>Manage and monitor all connected PetFeeder devices</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDevices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>No devices found.</p>
                {searchTerm && <p className="text-sm mt-2">Try changing your search criteria.</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Firmware</TableHead>
                      <TableHead>Food Level</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.map((device) => (
                      <TableRow key={device.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => handleDeviceSelect(device)}>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>{getStatusBadge(device.status)}</TableCell>
                        <TableCell>{device.model}</TableCell>
                        <TableCell>{device.serialNumber}</TableCell>
                        <TableCell>{device.firmwareVersion}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={device.foodLevel} className="h-2 w-16" />
                            <span className="text-xs">{device.foodLevel}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatLastSeen(device.lastSeen)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditDevice(device); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteClick(device); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Edit Device Dialog */}
      <Dialog open={editingDevice !== null} onOpenChange={(open) => !open && setEditingDevice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device information and settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deviceStatus">Status</Label>
              <Select value={deviceStatus} onValueChange={(value: any) => setDeviceStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deviceLocation">Location</Label>
              <Input
                id="deviceLocation"
                value={deviceLocation}
                onChange={(e) => setDeviceLocation(e.target.value)}
                placeholder="e.g. Kitchen, Living Room"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDevice(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDevice}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Device Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this device? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDevice}>
              Delete Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Device Dialog */}
      <Dialog open={addDeviceDialogOpen} onOpenChange={setAddDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Enter the details for the new PetFeeder device.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newDeviceName">Device Name *</Label>
              <Input
                id="newDeviceName"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g. Kitchen PetFeeder"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newDeviceModel">Model *</Label>
              <Input
                id="newDeviceModel"
                value={newDeviceModel}
                onChange={(e) => setNewDeviceModel(e.target.value)}
                placeholder="e.g. PetFeeder Pro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newDeviceSerial">Serial Number *</Label>
              <Input
                id="newDeviceSerial"
                value={newDeviceSerial}
                onChange={(e) => setNewDeviceSerial(e.target.value)}
                placeholder="e.g. PF-12345678"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDeviceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDevice}>
              Add Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>
              Schedule maintenance for this device and add notes for the technician.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maintenanceNotes">Maintenance Notes</Label>
              <textarea
                id="maintenanceNotes"
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
                placeholder="Describe the maintenance needed..."
                className="w-full min-h-[100px] p-2 border rounded-md"
              />
            </div>
      </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleMaintenance}>
              Schedule Maintenance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 