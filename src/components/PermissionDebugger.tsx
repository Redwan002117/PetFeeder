import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PermissionDebugger = () => {
  const { userData, isAdmin, hasPermission } = useAuth();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Permission Debugger
          <Badge variant={isAdmin ? "default" : "outline"}>
            {isAdmin ? "Admin" : "User"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">User Data:</h3>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Permissions:</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${hasPermission('canFeed') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>canFeed: {hasPermission('canFeed') ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${hasPermission('canSchedule') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>canSchedule: {hasPermission('canSchedule') ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${hasPermission('canViewStats') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>canViewStats: {hasPermission('canViewStats') ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionDebugger; 