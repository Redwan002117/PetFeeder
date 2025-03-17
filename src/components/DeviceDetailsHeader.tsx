import React from 'react';
import { Battery, Clock, MoreVertical, Settings, ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import DeviceStatusBadge from './DeviceStatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DeviceDetailsHeaderProps {
  id: string;
  name: string;
  status: string;
  batteryLevel?: number;
  lastSeen?: string;
  onEditName?: () => void;
}

export const DeviceDetailsHeader: React.FC<DeviceDetailsHeaderProps> = ({
  id,
  name,
  status,
  batteryLevel = 0,
  lastSeen,
  onEditName
}) => {
  const lastSeenFormatted = lastSeen ? 
    formatDistanceToNow(new Date(lastSeen), { addSuffix: true }) : 
    'Never';

  const getBatteryColor = () => {
    if (batteryLevel > 50) return 'text-green-500';
    if (batteryLevel > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent" asChild>
          <Link to="/devices">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Devices</span>
          </Link>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Device Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEditName}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Rename Device</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/devices/${id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Device Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" asChild>
              <Link to={`/devices/${id}/remove`}>Remove Device</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold mb-1">{name}</h1>
          <div className="flex items-center">
            <DeviceStatusBadge status={status} />
            <div className="flex items-center ml-3">
              <Battery className={`h-4 w-4 mr-1 ${getBatteryColor()}`} />
              <span className="text-sm">{batteryLevel}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center mt-2 sm:mt-0">
          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
          <span className="text-sm text-muted-foreground">Last seen {lastSeenFormatted}</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailsHeader;
