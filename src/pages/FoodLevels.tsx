import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getDevices } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Device {
  id: string;
  name: string;
  foodLevel: number;
  lastUpdated: number;
}

const FoodLevels = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userDevices = await getDevices(currentUser.uid);
      
      if (userDevices) {
        const deviceList = Object.entries(userDevices).map(([id, data]: [string, any]) => ({
          id,
          name: data.name || `Device ${id.substring(0, 6)}`,
          foodLevel: data.foodLevel || 0,
          lastUpdated: data.lastSeen || Date.now()
        }));
        
        setDevices(deviceList);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch device data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Set up interval to refresh data every minute
    const interval = setInterval(fetchDevices, 60000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const getProgressColor = (level: number) => {
    if (level < 20) return "bg-red-500";
    if (level < 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatLastUpdated = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60000) return "Just now";
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // More than a day
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Food Levels</h1>
        <Button 
          variant="outline" 
          onClick={fetchDevices}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {devices.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No Devices Found</h3>
              <p className="text-gray-500 mt-2">
                You don't have any devices connected to your account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id}>
              <CardHeader>
                <CardTitle>{device.name}</CardTitle>
                <CardDescription>
                  Last updated: {formatLastUpdated(device.lastUpdated)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Food Level</span>
                    <span className="text-sm font-medium">{device.foodLevel || 0}%</span>
                  </div>
                  <Progress 
                    value={device.foodLevel || 0} 
                    className={`h-2 ${getProgressColor(device.foodLevel || 0)}`} 
                  />
                  {device.foodLevel !== undefined && device.foodLevel < 20 && (
                    <div className="flex items-center text-red-500 text-sm mt-2">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Low food level! Please refill soon.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodLevels; 