import React, { useEffect, useState } from 'react';
import { database, ref, get, onValue, off } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, AlertCircle, Info, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  details?: string;
}

export const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [limit, setLimit] = useState(50);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [filter, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch logs from Firebase Realtime Database
      const logsRef = ref(database, 'logs');
      
      // Get all logs and then filter/sort them
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const logsData = snapshot.val();
        
        // Convert the object to an array and sort by timestamp (newest first)
        let logsArray = Object.keys(logsData).map(key => ({
          id: key,
          ...logsData[key]
        })) as LogEntry[];
        
        // Sort by timestamp (newest first)
        logsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply filter if needed
        if (filter !== 'all') {
          logsArray = logsArray.filter(log => log.level === filter);
        }
        
        // Apply limit
        logsArray = logsArray.slice(0, limit);
        
        setLogs(logsArray);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Info</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Logs" 
        icon={<FileText size={28} />}
        description="View and analyze system logs and events"
      />
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Filter by Level</label>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Limit</label>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 entries</SelectItem>
                <SelectItem value="100">100 entries</SelectItem>
                <SelectItem value="200">200 entries</SelectItem>
                <SelectItem value="500">500 entries</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={fetchLogs} className="mt-4 sm:mt-0">
          <PawPrint className="mr-2 h-4 w-4" />
          Refresh Logs
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">No logs found</p>
            <p className="text-sm text-gray-400">Try changing your filters or increasing the limit</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>System Logs ({logs.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium">Time</th>
                    <th className="text-left py-2 px-4 font-medium">Level</th>
                    <th className="text-left py-2 px-4 font-medium">Source</th>
                    <th className="text-left py-2 px-4 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-2 px-4 text-sm">{formatTimestamp(log.timestamp)}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          {getLevelIcon(log.level)}
                          <span className="ml-2">{getLevelBadge(log.level)}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-sm">{log.source}</td>
                      <td className="py-2 px-4 text-sm">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 