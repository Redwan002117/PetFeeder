import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart2, Users, Server, AlertTriangle, PawPrint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { supabase } from '@/lib/supabase';

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
      const startTimestamp = startTime.toISOString();

      // Fetch users from Supabase
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');
      
      if (usersError) throw usersError;
      const users = usersData || [];
      
      // Fetch devices from Supabase
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*');
      
      if (devicesError) throw devicesError;
      const devices = devicesData || [];
      
      // Fetch feedings from Supabase
      const { data: feedingsData, error: feedingsError } = await supabase
        .from('feeding_history')
        .select('*')
        .gte('timestamp', startTimestamp);
      
      if (feedingsError) throw feedingsError;
      const feedings = feedingsData || [];
      
      // Calculate analytics
      const totalUsers = users.length;
      const activeUsers = users.filter(user => 
        user.last_sign_in && new Date(user.last_sign_in) >= startTime
      ).length;
      
      const totalDevices = devices.length;
      const activeDevices = devices.filter(device => 
        device.last_seen && new Date(device.last_seen) >= startTime
      ).length;
      
      const totalFeedings = feedings.length;
      
      // Calculate average food level
      const foodLevels = devices.map(device => device.food_level || 0);
      const averageFoodLevel = foodLevels.length > 0 
        ? foodLevels.reduce((sum, level) => sum + level, 0) / foodLevels.length 
        : 0;
      
      // Count device issues
      const deviceIssues = devices.filter(device => 
        device.status === 'error' || device.status === 'maintenance'
      ).length;
      
      // Calculate feedings by hour
      const feedingsByHour = Array(24).fill(0);
      feedings.forEach(feeding => {
        const hour = new Date(feeding.timestamp).getHours();
        feedingsByHour[hour]++;
      });
      
      // Calculate user growth
      const usersByDate: Record<string, number> = {};
      users.forEach(user => {
        if (user.created_at && new Date(user.created_at) >= startTime) {
          const date = new Date(user.created_at).toISOString().split('T')[0];
          usersByDate[date] = (usersByDate[date] || 0) + 1;
        }
      });
      
      const userGrowth = Object.entries(usersByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Update state with calculated data
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
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
              Avg. food level: {data.averageFoodLevel.toFixed(1)}%
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