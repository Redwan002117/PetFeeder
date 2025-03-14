import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFeedingHistory, getDeviceStatistics } from "@/lib/statistics-utils";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, 
         startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, BarChart2, PieChartIcon, TrendingUp, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import PageHeader from "@/components/PageHeader";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Statistics = () => {
  const { currentUser } = useAuth();
  const [feedingHistory, setFeedingHistory] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("week");
  const [loading, setLoading] = useState(false);
  const [deviceStats, setDeviceStats] = useState(null);
  
  useEffect(() => {
    if (!currentUser) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await getFeedingHistory(currentUser.id, startDate, endDate);
        setFeedingHistory(data);

        const stats = await getDeviceStatistics(currentUser.id);
        setDeviceStats(stats);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch feeding history',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser, startDate, endDate]);
  
  const getFilteredData = () => {
    const today = new Date();
    let startDate, endDate;
    
    switch (timeRange) {
      case "day":
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case "week":
        startDate = startOfWeek(today, { weekStartsOn: 1 });
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
      const date = new Date(item.timestamp);
      return date >= startDate && date <= endDate;
    });
  };
  
  const getDailyAmounts = () => {
    const filteredData = getFilteredData();
    const today = new Date();
    let startDate, endDate;
    
    switch (timeRange) {
      case "day":
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case "week":
        startDate = startOfWeek(today, { weekStartsOn: 1 });
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
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayData = filteredData.filter(item => {
        const date = new Date(item.timestamp);
        return date >= dayStart && date <= dayEnd;
      });
      
      const totalAmount = dayData.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      return {
        date: format(day, "EEE"),
        fullDate: format(day, "MMM dd"),
        amount: totalAmount,
        count: dayData.length
      };
    });
  };
  
  const getFeedingTypeData = () => {
    const filteredData = getFilteredData();
    
    const typeCount = {
      scheduled: 0,
      manual: 0
    };
    
    filteredData.forEach(item => {
      if (item.type === 'scheduled') {
        typeCount.scheduled++;
      } else {
        typeCount.manual++;
      }
    });
    
    return [
      { name: 'Scheduled', value: typeCount.scheduled },
      { name: 'Manual', value: typeCount.manual }
    ];
  };
  
  const getHourlyDistribution = () => {
    const filteredData = getFilteredData();
    const hourlyData = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
    
    filteredData.forEach(item => {
      const date = new Date(item.timestamp);
      const hour = date.getHours();
      hourlyData[hour].count += 1;
    });
    
    return hourlyData;
  };
  
  const getTotalFeedings = () => {
    return getFilteredData().length;
  };
  
  const getTotalAmount = () => {
    return getFilteredData().reduce((sum, item) => sum + (item.amount || 0), 0);
  };
  
  const getAverageAmount = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return 0;
    return getTotalAmount() / filteredData.length;
  };
  
  const dailyData = getDailyAmounts();
  const feedingTypeData = getFeedingTypeData();
  const hourlyData = getHourlyDistribution();
  const maxAmount = Math.max(...dailyData.map(d => d.amount), 1);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name.includes('Amount') ? 'g' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Feeding Statistics" 
        icon={<BarChart size={28} />}
        description="Track and analyze your pet's feeding patterns over time"
      />
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="history">Feeding History</TabsTrigger>
        </TabsList>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <Badge 
              className={`cursor-pointer ${timeRange === 'day' ? 'bg-primary' : 'bg-secondary'}`}
              onClick={() => setTimeRange('day')}
            >
              Today
            </Badge>
            <Badge 
              className={`cursor-pointer ${timeRange === 'week' ? 'bg-primary' : 'bg-secondary'}`}
              onClick={() => setTimeRange('week')}
            >
              This Week
            </Badge>
            <Badge 
              className={`cursor-pointer ${timeRange === 'month' ? 'bg-primary' : 'bg-secondary'}`}
              onClick={() => setTimeRange('month')}
            >
              This Month
            </Badge>
          </div>
        </div>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Feedings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalFeedings()}</div>
                <p className="text-xs text-muted-foreground">
                  {timeRange === 'day' ? 'Today' : timeRange === 'week' ? 'This week' : 'This month'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalAmount().toFixed(1)} g</div>
                <p className="text-xs text-muted-foreground">
                  {timeRange === 'day' ? 'Today' : timeRange === 'week' ? 'This week' : 'This month'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getAverageAmount().toFixed(1)} g</div>
                <p className="text-xs text-muted-foreground">Per feeding</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Daily Feeding Amounts</CardTitle>
              <CardDescription>
                Amount of food dispensed per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyData.map((day, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{day.fullDate}</span>
                      <span>{day.amount.toFixed(1)} g</span>
                    </div>
                    <Progress value={(day.amount / maxAmount) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Feeding Types</CardTitle>
              <CardDescription>
                Distribution of scheduled vs manual feedings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-around">
                <div className="text-center">
                  <div className="text-2xl font-bold">{feedingTypeData[0].value}</div>
                  <div className="text-sm text-muted-foreground">Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{feedingTypeData[1].value}</div>
                  <div className="text-sm text-muted-foreground">Manual</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5 text-indigo-500" />
                  <CardTitle>Daily Feeding Amounts</CardTitle>
                </div>
                <CardDescription>
                  Amount of food dispensed each day
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={dailyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="amount" name="Amount (g)" fill="#8884d8" />
                      <Bar dataKey="count" name="Feedings" fill="#82ca9d" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5 text-indigo-500" />
                  <CardTitle>Feeding Types</CardTitle>
                </div>
                <CardDescription>
                  Distribution of scheduled vs manual feedings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feedingTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {feedingTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-indigo-500" />
                  <CardTitle>Hourly Distribution</CardTitle>
                </div>
                <CardDescription>
                  Number of feedings by hour of day
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={hourlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="hour" 
                        tickFormatter={(hour) => `${hour}:00`}
                        ticks={[0, 6, 12, 18, 23]}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        name="Feedings" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5 text-indigo-500" />
                  <CardTitle>Feeding Trend</CardTitle>
                </div>
                <CardDescription>
                  Feeding pattern over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="amount" 
                        name="Amount (g)" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="count" 
                        name="Feedings" 
                        stroke="#82ca9d" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Feeding History</CardTitle>
              <CardDescription>
                Recent feeding events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getFilteredData().length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {getFilteredData().map((item, index) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {item.type === 'scheduled' ? 'Scheduled Feeding' : 'Manual Feeding'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <Badge variant={item.type === 'scheduled' ? 'default' : 'secondary'}>
                            {item.amount} g
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No feeding data</h3>
                  <p className="text-muted-foreground">
                    No feeding data available for the selected time period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistics;

