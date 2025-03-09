import React, { useEffect, useState } from 'react';
import { database, ref, get } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  userId?: string;
  deviceId?: string;
  details?: string;
}

export const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [timeRange]);

  const fetchLogs = async () => {
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
      }
      
      // Fetch logs from Firebase Realtime Database
      const logsRef = ref(database, 'logs');
      const logsSnapshot = await get(logsRef);
      
      if (!logsSnapshot.exists()) {
        setLogs([]);
        setLoading(false);
        return;
      }
      
      const logsData = logsSnapshot.val();
      
      // Convert to array and filter by time range
      const logsArray = Object.entries(logsData || {}).map(([id, data]: [string, any]) => ({
        id,
        ...data,
        timestamp: data.timestamp || 0
      }));
      
      // Filter logs by time range
      const filteredLogs = logsArray.filter(log => 
        log.timestamp >= startTime.getTime()
      );
      
      // Sort logs by timestamp (newest first)
      filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
      
      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to load system logs. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search term
  const filteredLogs = logs.filter(log => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      log.message.toLowerCase().includes(searchTermLower) ||
      log.source.toLowerCase().includes(searchTermLower) ||
      (log.details && log.details.toLowerCase().includes(searchTermLower)) ||
      (log.userId && log.userId.toLowerCase().includes(searchTermLower)) ||
      (log.deviceId && log.deviceId.toLowerCase().includes(searchTermLower))
    );
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500 text-white"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
      case 'info':
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Info className="h-3 w-3" /> Info</Badge>;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={timeRange === '24h' ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange('24h')}
          >
            24h
          </Button>
          <Button
            variant={timeRange === '7d' ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7d
          </Button>
          <Button
            variant={timeRange === '30d' ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30d
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No logs found for the selected time period.</p>
              <p className="text-sm mt-2">Try changing the time range or search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-full">Message</TableHead>
                    <TableHead>User/Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        {getLevelBadge(log.level)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {log.source}
                      </TableCell>
                      <TableCell>
                        <div>
                          {log.message}
                          {log.details && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-md overflow-hidden text-ellipsis">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {log.userId && (
                          <div className="text-xs">User: {log.userId}</div>
                        )}
                        {log.deviceId && (
                          <div className="text-xs">Device: {log.deviceId}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 