import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
    const fetchAnalytics = async () => {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data);
    };

    fetchAnalytics();
  }, [timeRange]);

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