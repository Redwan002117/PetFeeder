import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers, updateUserPermissions } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Users, Search, UserCog, Info, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminDashboard = () => {
  const { isAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser && !loading) {
      navigate("/login");
      return;
    }

    // Check if user is admin
    if (currentUser && !isAdmin && !loading) {
      setAdminError("You don't have admin privileges to access this page");
      // Don't navigate away immediately to show the error message
      setTimeout(() => {
        navigate("/");
      }, 3000);
    }

    // Fetch users data if user is admin
    if (currentUser && isAdmin) {
      const unsubscribe = getAllUsers((usersData) => {
        if (usersData) {
          setUsers(usersData);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [currentUser, isAdmin, navigate, loading]);

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

  const filteredUsers = Object.entries(users).filter(([_, user]: [string, any]) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const getUserCount = () => Object.keys(users).length;
  const getAdminCount = () => Object.values(users).filter((user: any) => user.role === "admin").length;
  const getRegularUserCount = () => Object.values(users).filter((user: any) => user.role !== "admin").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pet-primary"></div>
      </div>
    );
  }

  if (adminError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{adminError}</AlertDescription>
        </Alert>
        <p className="text-center">Redirecting to home page...</p>
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
          <Shield className="h-4 w-4 mr-1" />
          <span>Admin</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getUserCount()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getAdminCount()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Regular Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getRegularUserCount()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="guide">
            <Info className="h-4 w-4 mr-2" />
            Admin Guide
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCog className="mr-2 h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user permissions and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email or role..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {filteredUsers.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
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
                      {filteredUsers.map(([userId, user]: [string, any]) => (
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
                              disabled={userId === currentUser?.uid || user.role === "admin"} // Can't change own or admin permissions
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={user.permissions?.canSchedule ?? false}
                              onCheckedChange={(checked) => handlePermissionChange(userId, "canSchedule", checked)}
                              disabled={userId === currentUser?.uid || user.role === "admin"}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={user.permissions?.canViewStats ?? true}
                              onCheckedChange={(checked) => handlePermissionChange(userId, "canViewStats", checked)}
                              disabled={userId === currentUser?.uid || user.role === "admin"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No users match your search" : "No users found"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="guide" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Guide</CardTitle>
              <CardDescription>
                Information about managing users and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">User Permissions</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Can Feed:</strong> Allows users to use the manual feed function</li>
                  <li><strong>Can Schedule:</strong> Allows users to create and modify feeding schedules</li>
                  <li><strong>Can View Stats:</strong> Allows users to view feeding statistics and history</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">User Roles</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Admin:</strong> Has full access to all features and can manage other users</li>
                  <li><strong>User:</strong> Regular user with permissions set by admins</li>
                </ul>
              </div>
              
              <div className="bg-muted p-4 rounded-md mt-4">
                <p className="text-muted-foreground">
                  <strong>Note:</strong> Admins always have all permissions. You cannot modify your own permissions or the permissions of other admin users.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
