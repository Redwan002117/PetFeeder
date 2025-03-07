
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers, updateUserPermissions } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { isAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-admin users
    if (!isAdmin && !loading) {
      navigate("/");
      toast({
        title: "Access denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
    }

    const unsubscribe = getAllUsers((usersData) => {
      if (usersData) {
        setUsers(usersData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, navigate, toast, loading]);

  const handlePermissionChange = async (userId: string, permission: string, value: boolean) => {
    try {
      await updateUserPermissions(userId, { [permission]: value });
      toast({
        title: "Permission updated",
        description: "User permissions have been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user permissions",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pet-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Badge variant="secondary" className="px-3 py-1">
          <span className="mr-1">Admin</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user permissions and roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(users).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Can Feed</TableHead>
                  <TableHead>Can Schedule</TableHead>
                  <TableHead>Can View Stats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(users).map(([userId, user]: [string, any]) => (
                  <TableRow key={userId} className={userId === currentUser?.uid ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">
                      {user.email}
                      {userId === currentUser?.uid && (
                        <Badge variant="outline" className="ml-2">You</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role || "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.permissions?.canFeed ?? false}
                        onCheckedChange={(checked) => handlePermissionChange(userId, "canFeed", checked)}
                        disabled={userId === currentUser?.uid} // Can't change own permissions
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.permissions?.canSchedule ?? false}
                        onCheckedChange={(checked) => handlePermissionChange(userId, "canSchedule", checked)}
                        disabled={userId === currentUser?.uid}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.permissions?.canViewStats ?? true}
                        onCheckedChange={(checked) => handlePermissionChange(userId, "canViewStats", checked)}
                        disabled={userId === currentUser?.uid}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            <strong>User Permissions:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Can Feed:</strong> Allows users to use the manual feed function</li>
            <li><strong>Can Schedule:</strong> Allows users to create and modify feeding schedules</li>
            <li><strong>Can View Stats:</strong> Allows users to view feeding statistics and history</li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            Note: Admins always have all permissions. You cannot modify your own permissions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
