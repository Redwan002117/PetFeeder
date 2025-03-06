
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { HandPlatter, Clock, PawPrint, Info } from "lucide-react";
import { triggerManualFeed, getFeedingHistory, getDeviceStatus } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ManualFeed = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [feedAmount, setFeedAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedingHistory, setFeedingHistory] = useState<any[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<any>({});

  useEffect(() => {
    if (currentUser) {
      const unsubscribeHistory = getFeedingHistory(currentUser.uid, (data) => {
        if (data) {
          const historyArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          // Sort by timestamp (most recent first) and filter manual feeds only
          const manualFeeds = historyArray
            .filter(item => item.type === 'manual')
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
          setFeedingHistory(manualFeeds);
        } else {
          setFeedingHistory([]);
        }
      });

      const unsubscribeStatus = getDeviceStatus(currentUser.uid, (data) => {
        if (data) {
          setDeviceStatus(data);
        } else {
          setDeviceStatus({});
        }
      });

      return () => {
        unsubscribeHistory();
        unsubscribeStatus();
      };
    }
  }, [currentUser]);

  const handleFeedNow = async () => {
    if (currentUser && !loading && !feeding) {
      setLoading(true);
      try {
        await triggerManualFeed(currentUser.uid, feedAmount);
        
        // Show feeding animation
        setFeeding(true);
        setProgress(0);
        
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setFeeding(false);
              return 0;
            }
            return prev + 5;
          });
        }, 150);
        
        toast({
          title: "Feeding initiated",
          description: `Dispensing ${feedAmount}g of food`,
        });
      } catch (error) {
        console.error("Error triggering manual feed:", error);
        toast({
          title: "Error",
          description: "Failed to trigger feeding",
          variant: "destructive",
        });
        setFeeding(false);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Feed</CardTitle>
          <CardDescription>Dispense food immediately for your pet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {!deviceStatus.online && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <Info className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">
                  Your device is currently offline. Manual feeding is unavailable.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="feed-amount">Amount to dispense</Label>
                <span className="text-sm font-medium">{feedAmount}g</span>
              </div>
              <Slider
                id="feed-amount"
                min={5}
                max={100}
                step={5}
                value={[feedAmount]}
                onValueChange={(value) => setFeedAmount(value[0])}
                disabled={feeding || !deviceStatus.online}
              />
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>5g</span>
                <span>100g</span>
              </div>
            </div>
            
            {feeding && (
              <div className="space-y-2 py-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Dispensing food...</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            <Button 
              className="w-full h-16 text-lg bg-pet-primary hover:bg-pet-primary/90"
              onClick={handleFeedNow}
              disabled={loading || feeding || !deviceStatus.online}
            >
              <HandPlatter className="mr-2 h-6 w-6" />
              {loading ? "Processing..." : feeding ? "Dispensing..." : "Feed Now"}
            </Button>
            
            {!deviceStatus.online && !feeding && (
              <p className="text-center text-sm text-muted-foreground">
                Device is offline. Please check your device connectivity.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Manual Feedings</CardTitle>
          <CardDescription>History of your manual feeding actions</CardDescription>
        </CardHeader>
        <CardContent>
          {feedingHistory.length > 0 ? (
            <div className="space-y-4">
              {feedingHistory.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <PawPrint className="h-5 w-5 text-pet-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Manual Feed</p>
                      <p className="text-sm text-muted-foreground">
                        {feed.timestamp ? format(new Date(feed.timestamp), 'MMM d, h:mm a') : 'Unknown time'}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">{feed.amount}g</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground">No manual feeding history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Food Amount Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Small Dogs (up to 10kg)</h3>
              <p className="text-sm text-muted-foreground">20-30g per meal, 2-3 meals per day</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-medium">Medium Dogs (10-25kg)</h3>
              <p className="text-sm text-muted-foreground">30-60g per meal, 2 meals per day</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-medium">Large Dogs (25kg+)</h3>
              <p className="text-sm text-muted-foreground">60-100g per meal, 2 meals per day</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-medium">Cats</h3>
              <p className="text-sm text-muted-foreground">15-25g per meal, 2-4 meals per day</p>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Note: These are general guidelines. Adjust based on your pet's specific needs, age, and activity level.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualFeed;
