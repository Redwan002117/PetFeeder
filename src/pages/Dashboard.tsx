import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  HandPlatter, 
  AlertCircle, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  ArrowRight,
  PieChart
} from "lucide-react";
import { 
  getFeedingSchedule, 
  getDeviceStatus, 
  triggerManualFeed,
  getFeedingHistory
} from "@/lib/firebase";
import { format } from "date-fns";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<any>({});
  const [feedingHistory, setFeedingHistory] = useState<any[]>([]);
  const [isFeeding, setIsFeeding] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const unsubscribeSchedule = getFeedingSchedule(currentUser.uid, (data) => {
        if (data) {
          const scheduleArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setSchedule(scheduleArray);
        } else {
          setSchedule([]);
        }
      });

      const unsubscribeStatus = getDeviceStatus(currentUser.uid, (data) => {
        if (data) {
          setDeviceStatus(data);
        } else {
          setDeviceStatus({});
        }
      });

      const unsubscribeHistory = getFeedingHistory(currentUser.uid, (data) => {
        if (data) {
          const historyArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setFeedingHistory(historyArray.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
        } else {
          setFeedingHistory([]);
        }
      });

      return () => {
        unsubscribeSchedule();
        unsubscribeStatus();
        unsubscribeHistory();
      };
    }
  }, [currentUser]);

  const handleManualFeed = async () => {
    if (currentUser && !isFeeding) {
      setIsFeeding(true);
      try {
        await triggerManualFeed(currentUser.uid, 20); // 20g as default amount
        setTimeout(() => setIsFeeding(false), 3000); // Reset after 3 seconds
      } catch (error) {
        console.error("Error triggering manual feed:", error);
        setIsFeeding(false);
      }
    }
  };

  // Get the next scheduled feeding
  const getNextFeeding = () => {
    if (schedule.length === 0) return null;
    
    const now = new Date();
    const todaySchedule = schedule.filter(s => {
      const [hours, minutes] = s.time.split(':').map(Number);
      const scheduleTime = new Date();
      scheduleTime.setHours(hours, minutes, 0, 0);
      return scheduleTime > now;
    }).sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });
    
    return todaySchedule[0] || schedule[0]; // Return first of tomorrow if no more today
  };

  const nextFeeding = getNextFeeding();
  
  // Format feeding time for display
  const formatFeedingTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return format(new Date().setHours(hours, minutes, 0, 0), 'h:mm a');
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Device Status</CardTitle>
              <CardDescription>Current status of your pet feeder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {deviceStatus.online ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    <span>Device Status</span>
                  </div>
                  <span className={deviceStatus.online ? "text-green-500" : "text-amber-500"}>
                    {deviceStatus.online ? "Online" : "Offline"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {deviceStatus.wifiConnected ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500" />
                    )}
                    <span>Wi-Fi Connection</span>
                  </div>
                  <span className={deviceStatus.wifiConnected ? "text-green-500" : "text-red-500"}>
                    {deviceStatus.wifiConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    <span>Food Level</span>
                  </div>
                  <span>
                    {deviceStatus.foodLevel ? `${deviceStatus.foodLevel}%` : "Unknown"}
                  </span>
                </div>
                
                <Link to="/connectivity">
                  <Button variant="outline" className="w-full mt-4">
                    <Wifi className="mr-2 h-4 w-4" />
                    Connectivity Settings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Control your pet feeder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full bg-pet-primary hover:bg-pet-primary/90 h-16"
                  disabled={isFeeding || !deviceStatus.online}
                  onClick={handleManualFeed}
                >
                  <HandPlatter className="mr-2 h-6 w-6" />
                  {isFeeding ? "Dispensing Food..." : "Feed Now"}
                </Button>
                
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/schedule" className="w-full">
                    <Button variant="outline" className="w-full h-14">
                      <Clock className="mr-2 h-5 w-5" />
                      Schedule
                    </Button>
                  </Link>
                  <Link to="/statistics" className="w-full">
                    <Button variant="outline" className="w-full h-14">
                      <PieChart className="mr-2 h-5 w-5" />
                      Statistics
                    </Button>
                  </Link>
                </div>
                
                {nextFeeding && nextFeeding.time ? (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-pet-primary" />
                      <span className="font-medium">Next scheduled feeding</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{formatFeedingTime(nextFeeding.time)}</span>
                      <span className="text-muted-foreground">{nextFeeding.amount || 0}g</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-pet-primary" />
                      <span className="font-medium">No scheduled feedings</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Set up a feeding schedule</span>
                      <Link to="/schedule">
                        <Button variant="outline" size="sm">
                          Schedule
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events from your pet feeder</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="feedings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="feedings">Feedings</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
              <TabsContent value="feedings" className="pt-4">
                {feedingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {feedingHistory.map((feeding) => (
                      <div key={feeding.id} className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                            <HandPlatter className="h-5 w-5 text-pet-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {feeding.type === 'manual' ? 'Manual Feed' : 'Scheduled Feed'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {feeding.timestamp ? format(new Date(feeding.timestamp), 'MMM d, h:mm a') : 'Unknown time'}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">
                          {feeding.amount ? `${feeding.amount}g` : '0g'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No feeding history available</p>
                  </div>
                )}
                <Link to="/statistics">
                  <Button variant="link" className="mt-2 pl-0">
                    View all history
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </TabsContent>
              <TabsContent value="events" className="pt-4">
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No recent events</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
