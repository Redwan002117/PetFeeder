import React, { useState, useEffect } from 'react';
import { database, ref, get, update } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, Edit, Trash2, AlertTriangle, CheckCircle, Server } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [deviceStatus, setDeviceStatus] = useState<'online' | 'offline' | 'error' | 'maintenance'>('online');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
  }, []);

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

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setDeviceName(device.name);
    setDeviceStatus(device.status);
  };

  const handleSaveDevice = async () => {
    if (!editingDevice) return;
    
    try {
      // Update device in Firebase Realtime Database
      const deviceRef = ref(database, `devices/${editingDevice.id}`);
      await update(deviceRef, {
        name: deviceName,
        status: deviceStatus
      });
      
      // Update local state
      setDevices(devices.map(device => 
        device.id === editingDevice.id 
          ? { ...device, name: deviceName, status: deviceStatus } 
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

  // Filter devices based on search term
  const filteredDevices = devices.filter(device => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      device.name.toLowerCase().includes(searchTermLower) ||
      device.model.toLowerCase().includes(searchTermLower) ||
      device.serialNumber.toLowerCase().includes(searchTermLower) ||
      (device.location && device.location.toLowerCase().includes(searchTermLower))
    );
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
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDevices}
        >
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Device Management</CardTitle>
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
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.name}</TableCell>
                      <TableCell>{getStatusBadge(device.status)}</TableCell>
                      <TableCell>{device.model}</TableCell>
                      <TableCell>{device.serialNumber}</TableCell>
                      <TableCell>{device.firmwareVersion}</TableCell>
                      <TableCell>{formatLastSeen(device.lastSeen)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDevice(device)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(device)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
      
      {/* Edit Device Dialog */}
      {editingDevice && (
        <Dialog open={!!editingDevice} onOpenChange={(open) => !open && setEditingDevice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Device</DialogTitle>
              <DialogDescription>
                Update device information. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="deviceName" className="text-sm font-medium">Device Name</label>
                <Input
                  id="deviceName"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="deviceStatus" className="text-sm font-medium">Status</label>
                <select
                  id="deviceStatus"
                  value={deviceStatus}
                  onChange={(e) => setDeviceStatus(e.target.value as any)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="error">Error</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDevice(null)}>Cancel</Button>
              <Button onClick={handleSaveDevice}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the device "{deviceToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteDevice}>Delete Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 