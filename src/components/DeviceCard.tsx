import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Battery, Signal, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import DeviceStatusBadge from './DeviceStatusBadge';

interface DeviceCardProps {
  id: string;
  name: string;
  status: string;
  foodLevel?: number;
  batteryLevel?: number;
  wifiStrength?: number;
  lastSeen?: string;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  id,
  name,
  status,
  foodLevel = 0,
  batteryLevel = 0,
  wifiStrength,
  lastSeen,
}) => {
  const isOnline = status === 'online' && lastSeen && 
    new Date(lastSeen) > new Date(Date.now() - 5 * 60 * 1000);
  
  const lastSeenFormatted = lastSeen ? 
    formatDistanceToNow(new Date(lastSeen), { addSuffix: true }) : 
    'Never';

  const getBatteryColor = () => {
    if (batteryLevel > 50) return 'text-green-500';
    if (batteryLevel > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFoodLevelColor = () => {
    if (foodLevel > 50) return 'bg-green-500';
    if (foodLevel > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getWifiStrengthIcon = () => {
    if (!wifiStrength) return null;
    
    if (wifiStrength > -60) {
      return <Signal className="h-4 w-4 text-green-500" />;
    } else if (wifiStrength > -80) {
      return <Signal className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Signal className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="bg-slate-50 dark:bg-slate-800 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-lg">{name}</h3>
              <DeviceStatusBadge status={status} className="mt-1" />
            </div>
            <div className="flex space-x-1 items-center text-sm">
              <Clock className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-muted-foreground">{lastSeenFormatted}</span>
            </div>
          </div>
          
          <div className="space-y-3 mt-4">
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span>Food Level</span>
                <span>{foodLevel}%</span>
              </div>
              <Progress value={foodLevel} className={getFoodLevelColor()} />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Battery className={`h-4 w-4 mr-1 ${getBatteryColor()}`} />
                <span className="text-sm">{batteryLevel}%</span>
              </div>
              
              <div className="flex items-center">
                {getWifiStrengthIcon()}
                {wifiStrength && (
                  <span className="text-sm ml-1">{wifiStrength} dBm</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between p-4">
        <Button asChild variant="outline" size="sm">
          <Link to={`/devices/${id}`}>
            View Details
          </Link>
        </Button>
        
        <Button asChild size="sm">
          <Link to={`/devices/${id}/feed`}>
            Feed Now
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeviceCard;
