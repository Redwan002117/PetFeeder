import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Weight } from 'lucide-react';

interface DeviceScheduleItemProps {
  id: string;
  time: string;
  days: boolean[];
  amount: number;
  enabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export const DeviceScheduleItem: React.FC<DeviceScheduleItemProps> = ({
  id,
  time,
  days,
  amount,
  enabled,
  onToggle,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const handleToggle = (checked: boolean) => {
    onToggle(id, checked);
  };
  
  return (
    <Card className={`${!enabled && 'opacity-70'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">{time}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{amount}g</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {dayNames.map((day, index) => (
                  <Badge 
                    key={index} 
                    variant={days[index] ? "default" : "outline"} 
                    className={`w-6 h-6 p-0 flex items-center justify-center text-xs ${!days[index] && 'text-muted-foreground'}`}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Switch 
              checked={enabled} 
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
            
            {onEdit && onDelete && (
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(id)} 
                  className="text-xs text-blue-500 hover:underline"
                  disabled={isLoading}
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(id)} 
                  className="text-xs text-red-500 hover:underline"
                  disabled={isLoading}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceScheduleItem;
