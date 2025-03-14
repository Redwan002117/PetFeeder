import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { getAllUsers, updateUserRole, deleteAllUsers } from "@/lib/admin-utils";
import { safeUpdate } from "@/lib/supabase-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Users, Search, UserCog, Info, Shield, AlertTriangle, Lock, UserPlus, BarChart, Server, FileText, Settings, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Analytics } from "@/components/admin/Analytics";
import { DeviceManagement } from "@/components/admin/DeviceManagement";
import { SystemLogs } from "@/components/admin/SystemLogs";
import { UserManagement } from "@/components/admin/UserManagement";
import AdminOnlySettings from "@/components/AdminOnlySettings";

const AdminDashboard = () => {
  const { isAdmin, isVerifiedAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{id: string, email: string, displayName: string} | null>(null);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!isAdmin || !currentUser) {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        setAdminError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, currentUser, navigate]);

  const handlePermissionChange = async (userId: string, permission: string, value: boolean) => {
    try {
      const success = await safeUpdate(`users/${userId}/permissions`, {
        [permission]: value
      });

      if (success) {
        setUsers({
          ...users,
          [userId]: {
            ...users[userId],
            permissions: {
              ...users[userId].permissions,
              [permission]: value
            }
          }
        });

        toast({
          title: "Permission Updated",
          description: `User permission has been updated successfully.`,
        });
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update user permission. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating the permission.",
        variant: "destructive"
      });
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!selectedUser) return;
    
    setPromoting(true);
    try {
      await updateUserRole(selectedUser.id, 'admin');
      
      setUsers({
        ...users,
        [selectedUser.id]: {
          ...users[selectedUser.id],
          role: 'admin'
        }
      });
      
      toast({
        title: "User Promoted",
        description: `${selectedUser.displayName || selectedUser.email} has been promoted to admin.`,
      });
      
      setPromoteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error promoting user:", error);
      toast({
        title: "Promotion Failed",
        description: "Failed to promote user to admin. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPromoting(false);
    }
  };

  const handleDeleteAllUsers = async () => {
    if (!window.confirm("Are you sure you want to delete all non-admin users? This action cannot be undone.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteAllUsers();
      
      const adminUsers = Object.entries(users).reduce((acc, [id, user]) => {
        if (user.role === 'admin') {
          acc[id] = user;
        }
        return acc;
      }, {} as Record<string, any>);
      
      setUsers(adminUsers);
      
      toast({
        title: "Users Deleted",
        description: "All non-admin users have been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting users:", error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = Object.entries(users).filter(([_, user]: [string, any]) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower) ||
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
        <div className="flex justify-center mt-4">
          {!isAdmin && (
            <Button onClick={() => navigate("/")}>
              Return to Dashboard
            </Button>
          )}
          {isAdmin && !isVerifiedAdmin && (
            <Button onClick={() => navigate("/profile")}>
              Go to Profile to Verify Email
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Shield className="mr-2 h-6 w-6 text-indigo-600" />
        Admin Dashboard
      </h1>

      {adminError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{adminError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-6 max-w-4xl">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center">
            <Server className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Devices</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">System Logs</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Email Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{getUserCount()}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {getAdminCount()} admins, {getRegularUserCount()} regular users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-xs text-gray-500 mt-1">
                  3 offline, 9 online
                </p>
          </CardContent>
        </Card>
        
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Feedings Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">48</div>
                <p className="text-xs text-gray-500 mt-1">
                  32 scheduled, 16 manual
                </p>
          </CardContent>
        </Card>
        
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-gray-500 mt-1">
                  All systems operational
                </p>
          </CardContent>
        </Card>
      </div>

          {/* Rest of the overview content */}
        </TabsContent>

        <TabsContent value="users">
          <Card className="mb-6">
        <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-indigo-600" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
        </CardHeader>
        <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5 text-indigo-600" />
                Device Management
              </CardTitle>
              <CardDescription>
                Manage connected devices and their settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceManagement />
            </CardContent>
          </Card>
            </TabsContent>
            
        <TabsContent value="analytics">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5 text-indigo-600" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                View system analytics and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Analytics />
            </CardContent>
          </Card>
            </TabsContent>
            
        <TabsContent value="logs">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-indigo-600" />
                System Logs
              </CardTitle>
              <CardDescription>
                View and analyze system logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemLogs />
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure system-wide email settings for notifications and admin requests
              </CardDescription>
        </CardHeader>
            <CardContent>
              <AdminOnlySettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
