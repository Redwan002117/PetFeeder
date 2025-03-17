import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DeviceStatusBadgeProps {
  status: string;
  className?: string;
}

const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'online':
        return {
          icon: <Wifi className="h-3 w-3 mr-1" />,
          label: 'Online',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-3 w-3 mr-1" />,
          label: 'Offline',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          label: 'Error',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
      case 'maintenance':
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: 'Maintenance',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        };
      case 'new':
        return {
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: 'New',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
        };
      default:
        return {
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          label: status || 'Unknown',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        };
    }
  };

  const { icon, label, className: statusClassName } = getStatusConfig();

  return (
    <Badge variant="outline" className={`flex items-center ${statusClassName} ${className}`}>
      {icon}
      {label}
    </Badge>
  );
};

export default DeviceStatusBadge;
