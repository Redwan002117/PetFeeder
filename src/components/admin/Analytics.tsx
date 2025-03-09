import React, { useEffect, useState } from 'react';
import { database, ref, get } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart2, Users, Server, AlertTriangle, PawPrint } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalDevices: number;
  activeDevices: number;
  totalFeedings: number;
  averageFoodLevel: number;
  deviceIssues: number;
  feedingsByHour: number[];
  userGrowth: {
    date: string;
    count: number;
  }[];
}

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalFeedings: 0,
    averageFoodLevel: 0,
    deviceIssues: 0,
    feedingsByHour: Array(24).fill(0),
    userGrowth: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate time range
      const now = new Date();
      let startTime = new Date();
      switch (timeRange) {
        case '24h':
          startTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
        case '90d':
          startTime.setDate(now.getDate() - 90);
          break;
      }
      
      // Fetch users data
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (!usersSnapshot.exists()) {
        setData({
          ...data,
          totalUsers: 0,
          activeUsers: 0
        });
        setLoading(false);
        return;
      }
      
      const usersData = usersSnapshot.val();
      const users = Object.values(usersData || {});
      
      // Calculate total users
      const totalUsers = users.length;
      
      // Calculate active users (users who have logged in within the time range)
      const activeUsers = users.filter((user: any) => {
        if (!user.lastLogin) return false;
        const lastLogin = new Date(user.lastLogin);
        return lastLogin >= startTime;
      }).length;
      
      // Fetch devices data
      const devicesRef = ref(database, 'devices');
      const devicesSnapshot = await get(devicesRef);
      
      let totalDevices = 0;
      let activeDevices = 0;
      let deviceIssues = 0;
      let totalFoodLevel = 0;
      
      if (devicesSnapshot.exists()) {
        const devicesData = devicesSnapshot.val();
        const devices = Object.values(devicesData || {});
        
        totalDevices = devices.length;
        
        // Calculate active devices and device issues
        devices.forEach((device: any) => {
          if (device.lastSeen && new Date(device.lastSeen) >= startTime) {
            activeDevices++;
          }
          
          if (device.status === 'error' || device.status === 'warning') {
            deviceIssues++;
          }
          
          if (typeof device.foodLevel === 'number') {
            totalFoodLevel += device.foodLevel;
          }
        });
      }
      
      // Calculate average food level
      const averageFoodLevel = totalDevices > 0 ? totalFoodLevel / totalDevices : 0;
      
      // Fetch feeding data
      const feedingsRef = ref(database, 'feedings');
      const feedingsSnapshot = await get(feedingsRef);
      
      let totalFeedings = 0;
      const feedingsByHour = Array(24).fill(0);
      
      if (feedingsSnapshot.exists()) {
        const feedingsData = feedingsSnapshot.val();
        const feedings = Object.values(feedingsData || {});
        
        // Filter feedings by time range
        const filteredFeedings = feedings.filter((feeding: any) => {
          if (!feeding.timestamp) return false;
          const feedingTime = new Date(feeding.timestamp);
          return feedingTime >= startTime;
        });
        
        totalFeedings = filteredFeedings.length;
        
        // Calculate feedings by hour
        filteredFeedings.forEach((feeding: any) => {
          const feedingTime = new Date(feeding.timestamp);
          const hour = feedingTime.getHours();
          feedingsByHour[hour]++;
        });
      }
      
      // Calculate user growth
      const userGrowth = await calculateUserGrowth(startTime);
      
      setData({
        totalUsers,
        activeUsers,
        totalDevices,
        activeDevices,
        totalFeedings,
        averageFoodLevel,
        deviceIssues,
        feedingsByHour,
        userGrowth
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const calculateUserGrowth = async (startTime: Date) => {
    try {
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (!usersSnapshot.exists()) {
        return [];
      }
      
      const usersData = usersSnapshot.val();
      const users = Object.values(usersData || {});
      
      // Group users by creation date
      const usersByDate: Record<string, number> = {};
      
      users.forEach((user: any) => {
        if (!user.createdAt) return;
        
        const creationDate = new Date(user.createdAt);
        if (creationDate < startTime) return;
        
        const dateString = creationDate.toISOString().split('T')[0];
        usersByDate[dateString] = (usersByDate[dateString] || 0) + 1;
      });
      
      // Convert to array format
      const userGrowth = Object.entries(usersByDate).map(([date, count]) => ({
        date,
        count
      }));
      
      // Sort by date
      userGrowth.sort((a, b) => a.date.localeCompare(b.date));
      
      return userGrowth;
    } catch (error) {
      console.error('Error calculating user growth:', error);
      return [];
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading analytics data...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analytics Dashboard" 
        icon={<BarChart2 size={28} />}
        description="View system analytics and statistics"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{data.totalUsers}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.activeUsers} active in last 24h
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Server className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{data.totalDevices}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.activeDevices} active in last 24h
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Feedings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <PawPrint className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{data.totalFeedings}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. food level: {data.averageFoodLevel}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Device Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{data.deviceIssues}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requiring attention
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional charts and analytics would go here */}
      <div className="text-center text-muted-foreground text-sm mt-8">
        <p>Detailed analytics charts will be implemented in a future update.</p>
      </div>
    </div>
  );
}; 