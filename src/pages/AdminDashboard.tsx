import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers, updateUserPermissions, updateUserRole } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Users, Search, UserCog, Info, Shield, AlertTriangle, Lock, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
      return;
    }

    // Check if admin is verified
    if (currentUser && isAdmin && !isVerifiedAdmin && !loading) {
      setAdminError("Your admin account is not verified. Please verify your email to access admin features.");
      // Don't navigate away immediately to show the error message
      setTimeout(() => {
        navigate("/profile");
      }, 3000);
      return;
    }

    // Fetch users data if user is admin and verified
    if (currentUser && isAdmin && isVerifiedAdmin) {
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
  }, [currentUser, isAdmin, isVerifiedAdmin, navigate, loading]);

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

  const handlePromoteToAdmin = async () => {
    if (!selectedUser) return;
    
    try {
      setPromoting(true);
      await updateUserRole(selectedUser.id, 'admin');
      
      toast({
        title: "User promoted",
        description: `${selectedUser.displayName || selectedUser.email} has been promoted to admin.`,
      });
      
      setPromoteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Promotion failed",
        description: error.message || "Failed to promote user to admin",
        variant: "destructive",
      });
    } finally {
      setPromoting(false);
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
    <div className="container mx-auto py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="h-6 w-6 mr-2 text-pet-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <Badge variant="outline" className="bg-pet-primary text-white border-pet-primary">
          Admin Mode
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{getUserCount()}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Admin Users</p>
                <p className="text-2xl font-bold">{getAdminCount()}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Regular Users</p>
                <p className="text-2xl font-bold">{getRegularUserCount()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserCog className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </div>
            <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <UserPlus size={16} />
                  <span>Promote User</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Promote User to Admin</DialogTitle>
                  <DialogDescription>
                    Select a user to promote to administrator role. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <label className="text-sm font-medium mb-2 block">Select User</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => {
                      const userId = e.target.value;
                      if (userId) {
                        const user = users[userId];
                        setSelectedUser({
                          id: userId,
                          email: user.email,
                          displayName: user.displayName || user.email
                        });
                      } else {
                        setSelectedUser(null);
                      }
                    }}
                    value={selectedUser?.id || ""}
                  >
                    <option value="">Select a user</option>
                    {Object.entries(users)
                      .filter(([id, user]: [string, any]) => user.role !== "admin" && id !== currentUser?.uid)
                      .map(([id, user]: [string, any]) => (
                        <option key={id} value={id}>
                          {user.displayName || user.email}
                        </option>
                      ))}
                  </select>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setPromoteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePromoteToAdmin}
                    disabled={!selectedUser || promoting}
                  >
                    {promoting ? "Promoting..." : "Promote to Admin"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users by email, username or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="animate-fadeIn">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
              <TabsTrigger value="regular">Regular Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(([userId, user]: [string, any]) => (
                        <TableRow key={userId} className="transition-colors hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.displayName || "No username"}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400 truncate">{userId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.role === "admin" ? (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                Admin
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                User
                              </Badge>
                            )}
                            {user.emailVerified ? (
                              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                                Unverified
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Can Feed</span>
                                <Switch
                                  checked={user.permissions?.canFeed ?? true}
                                  onCheckedChange={(checked) => handlePermissionChange(userId, "canFeed", checked)}
                                  disabled={user.role === "admin" || userId === currentUser?.uid}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Can Schedule</span>
                                <Switch
                                  checked={user.permissions?.canSchedule ?? true}
                                  onCheckedChange={(checked) => handlePermissionChange(userId, "canSchedule", checked)}
                                  disabled={user.role === "admin" || userId === currentUser?.uid}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Can View Stats</span>
                                <Switch
                                  checked={user.permissions?.canViewStats ?? true}
                                  onCheckedChange={(checked) => handlePermissionChange(userId, "canViewStats", checked)}
                                  disabled={user.role === "admin" || userId === currentUser?.uid}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          No users found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="admin">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers
                      .filter(([_, user]: [string, any]) => user.role === "admin")
                      .map(([userId, user]: [string, any]) => (
                        <TableRow key={userId} className="transition-colors hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.displayName || "No username"}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400 truncate">{userId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              Admin
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.emailVerified ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Unverified
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="regular">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers
                      .filter(([_, user]: [string, any]) => user.role !== "admin")
                      .map(([userId, user]: [string, any]) => (
                        <TableRow key={userId} className="transition-colors hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.displayName || "No username"}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400 truncate">{userId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Can Feed</span>
                                <Switch
                                  checked={user.permissions?.canFeed ?? true}
                                  onCheckedChange={(checked) => handlePermissionChange(userId, "canFeed", checked)}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Can Schedule</span>
                                <Switch
                                  checked={user.permissions?.canSchedule ?? true}
                                  onCheckedChange={(checked) => handlePermissionChange(userId, "canSchedule", checked)}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Can View Stats</span>
                                <Switch
                                  checked={user.permissions?.canViewStats ?? true}
                                  onCheckedChange={(checked) => handlePermissionChange(userId, "canViewStats", checked)}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          As an admin, you can manage user permissions and promote regular users to admin role. Admin accounts cannot have their permissions modified.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AdminDashboard;
