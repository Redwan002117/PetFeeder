
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         PieChart, Pie, Cell } from "recharts";
import { getFeedingHistory } from "@/lib/firebase";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, 
         startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Statistics = () => {
  const { currentUser } = useAuth();
  const [feedingHistory, setFeedingHistory] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("week");
  
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = getFeedingHistory(currentUser.uid, (data) => {
        if (data) {
          const historyArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            timestamp: data[key].timestamp || Date.now()
          }));
          
          // Sort by timestamp (most recent first)
          const sortedHistory = historyArray.sort((a, b) => b.timestamp - a.timestamp);
          setFeedingHistory(sortedHistory);
        } else {
          setFeedingHistory([]);
        }
      });
      
      return () => unsubscribe();
    }
  }, [currentUser]);
  
  const getFilteredData = () => {
    const today = new Date();
    let startDate, endDate;
    
    switch (timeRange) {
      case "day":
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case "week":
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday as first day
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      default:
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
    }
    
    return feedingHistory.filter(item => {
      const timestamp = new Date(item.timestamp);
      return timestamp >= startDate && timestamp <= endDate;
    });
  };
  
  const getDailyAmounts = () => {
    const filteredData = getFilteredData();
    const today = new Date();
    let dateInterval;
    
    switch (timeRange) {
      case "day":
        // For day view, we show hourly data
        return Array.from({ length: 24 }, (_, i) => {
          const hour = i;
          const hourData = filteredData.filter(item => {
            const date = new Date(item.timestamp);
            return date.getHours() === hour;
          });
          
          const totalAmount = hourData.reduce((sum, item) => sum + (item.amount || 0), 0);
          
          return {
            name: `${hour}:00`,
            amount: totalAmount,
          };
        });
      case "week":
        dateInterval = eachDayOfInterval({ start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) });
        break;
      case "month":
        dateInterval = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
        break;
      default:
        dateInterval = eachDayOfInterval({ start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) });
    }
    
    return dateInterval.map(date => {
      const dayData = filteredData.filter(item => {
        const itemDate = new Date(item.timestamp);
        return (
          itemDate.getDate() === date.getDate() &&
          itemDate.getMonth() === date.getMonth() &&
          itemDate.getFullYear() === date.getFullYear()
        );
      });
      
      const totalAmount = dayData.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      return {
        name: format(date, timeRange === "month" ? "dd" : "EEE"),
        amount: totalAmount,
      };
    });
  };
  
  const getFeedingTypeData = () => {
    const filteredData = getFilteredData();
    
    // Calculate total for each type
    const scheduledAmount = filteredData
      .filter(item => item.type === "scheduled")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
      
    const manualAmount = filteredData
      .filter(item => item.type === "manual")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    return [
      { name: "Scheduled", value: scheduledAmount },
      { name: "Manual", value: manualAmount },
    ];
  };
  
  const getTotalFeedings = () => {
    const filteredData = getFilteredData();
    return filteredData.length;
  };
  
  const getTotalAmount = () => {
    const filteredData = getFilteredData();
    return filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
  };
  
  const getAverageAmount = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return 0;
    return Math.round(getTotalAmount() / filteredData.length);
  };
  
  const barChartData = getDailyAmounts();
  const pieChartData = getFeedingTypeData();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feeding Statistics</CardTitle>
          <CardDescription>Track your pet's feeding patterns</CardDescription>
          <Tabs
            defaultValue="week"
            value={timeRange}
            onValueChange={setTimeRange}
            className="mt-2"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {feedingHistory.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold">{getTotalFeedings()}</div>
                    <p className="text-sm text-muted-foreground mt-2">Total Feedings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold">{getTotalAmount()}g</div>
                    <p className="text-sm text-muted-foreground mt-2">Total Food Dispensed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold">{getAverageAmount()}g</div>
                    <p className="text-sm text-muted-foreground mt-2">Average Portion Size</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5 text-pet-primary" />
                      <CardTitle className="text-lg">Food Dispensed Over Time</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={barChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          unit="g"
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}g`, "Amount"]}
                          contentStyle={{ 
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            border: "1px solid #ddd",
                            borderRadius: "4px"
                          }}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="var(--pet-primary)"
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <PieChartIcon className="mr-2 h-5 w-5 text-pet-primary" />
                      <CardTitle className="text-lg">Feeding Types</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[300px]">
                      {pieChartData.some(item => item.value > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value}g`, "Amount"]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          No feeding data available for this period
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center space-x-4 mt-4">
                      {pieChartData.map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">{entry.name}: {entry.value}g</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Feeding History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {getFilteredData().slice(0, 20).map((feed) => (
                        <div key={feed.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <div className="flex items-center">
                              <Badge variant={feed.type === "scheduled" ? "secondary" : "default"}>
                                {feed.type === "scheduled" ? "Scheduled" : "Manual"}
                              </Badge>
                              <span className="ml-2 font-medium">{format(new Date(feed.timestamp), 'MMM d, h:mm a')}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {feed.status === "completed" 
                                ? "Successfully dispensed food" 
                                : feed.status === "pending" 
                                  ? "Dispensing in progress" 
                                  : "Failed to dispense food"}
                            </p>
                          </div>
                          <span className="font-medium">{feed.amount}g</span>
                        </div>
                      ))}
                      {getFilteredData().length === 0 && (
                        <div className="text-center py-12">
                          <AlertCircle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-muted-foreground">No feeding history for this period</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No feeding data available</h3>
              <p className="text-muted-foreground mb-4">
                Start feeding your pet to see statistics
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;
