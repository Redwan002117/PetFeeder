import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceWiFiConfig } from '@/components/DeviceWiFiConfig';
import { useDevices } from '@/contexts/DeviceContext';

const DeviceManagement = () => {
  const { device, loading } = useDevices();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pet-primary"></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-red-600">Device not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Device Management</h1>
        <p className="text-gray-600">
          {device.name} - Status: {device.status}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wifi">WiFi Configuration</TabsTrigger>
          <TabsTrigger value="schedule">Feeding Schedule</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Device Status</CardTitle>
              <CardDescription>Current status and information about your device</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Food Level:</span>
                  <span>{device.food_level}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Last Seen:</span>
                  <span>{new Date(device.last_seen ? new Date(device.last_seen).getTime() : 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wifi">
          <DeviceWiFiConfig />
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Feeding Schedule</CardTitle>
              <CardDescription>Configure automatic feeding times</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add FeedingSchedule component here */}
              <p className="text-gray-600">Feeding schedule configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Device Settings</CardTitle>
              <CardDescription>Configure device settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add DeviceSettings component here */}
              <p className="text-gray-600">Device settings configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DeviceManagement;