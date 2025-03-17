import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { getDevices } from "@/lib/supabase-api";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { supabase } from '@/lib/supabase';

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
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data: userDevices } = await supabase
        .from('devices')
        .select('*')
        .eq('owner_id', currentUser.id);
      
      if (userDevices && userDevices.length > 0) {
        const validDevices = userDevices.map(device => ({
          id: device.id,
          name: device.name || `Device ${device.id.substring(0, 6)}`,
          foodLevel: device.foodLevel || 0,
          lastUpdated: device.lastSeen || Date.now()
        }));
        
        setDevices(validDevices);
      } else {
        // If no devices found, use mock data
        setDevices([
          {
            id: 'mock-device-1',
            name: 'Pet Feeder 1',
            foodLevel: 75,
            lastUpdated: Date.now() - 3600000 // 1 hour ago
          },
          {
            id: 'mock-device-2',
            name: 'Pet Feeder 2',
            foodLevel: 25,
            lastUpdated: Date.now() - 86400000 // 1 day ago
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch device data. Using sample data instead.",
        variant: "destructive",
      });
      
      // Use mock data on error
      setDevices([
        {
          id: 'mock-device-1',
          name: 'Pet Feeder 1',
          foodLevel: 75,
          lastUpdated: Date.now() - 3600000 // 1 hour ago
        },
        {
          id: 'mock-device-2',
          name: 'Pet Feeder 2',
          foodLevel: 25,
          lastUpdated: Date.now() - 86400000 // 1 day ago
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Food Levels"
        icon={<AlertCircle size={28} />}
        description="Monitor food levels in your pet feeders"
      />
      
      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading devices...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No devices found.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleRefresh}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          ) : (
            devices.map((device) => (
              <Card key={device.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{device.name}</CardTitle>
                  <CardDescription>
                    Last updated: {formatLastUpdated(device.lastUpdated)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Food Level:</span>
                      <span className="text-sm font-medium">{device.foodLevel}%</span>
                    </div>
                    <Progress 
                      value={device.foodLevel} 
                      className={getProgressColor(device.foodLevel)} 
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {device.foodLevel < 20 ? (
                        <span className="text-red-500 font-medium">Low food level! Please refill soon.</span>
                      ) : device.foodLevel < 50 ? (
                        <span className="text-yellow-500 font-medium">Food level is getting low.</span>
                      ) : (
                        <span className="text-green-500 font-medium">Food level is good.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FoodLevels;