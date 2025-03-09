import React, { useEffect, useState } from 'react';
import { database, ref, get, update, remove } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, UserPlus, Trash2, Shield, PawPrint } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import ProfileAvatar from "@/components/ProfileAvatar";

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  createdAt: number;
  lastLogin: number;
  isActive: boolean;
  permissions: {
    canSchedule: boolean;
    canFeed: boolean;
    canViewStats: boolean;
    canManageDevices: boolean;
  };
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users from Firebase Realtime Database
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (!usersSnapshot.exists()) {
        setUsers([]);
        setLoading(false);
        return;
      }
      
      const usersData = usersSnapshot.val();
      
      // Convert to array
      const usersArray = Object.entries(usersData || {}).map(([id, data]: [string, any]) => ({
        id,
        email: data.email || '',
        displayName: data.displayName || 'Unknown User',
        photoURL: data.photoURL || '',
        role: data.role || 'user',
        createdAt: data.createdAt || 0,
        lastLogin: data.lastLogin || 0,
        isActive: data.isActive !== false, // Default to true if not specified
        permissions: {
          canSchedule: data.permissions?.canSchedule !== false,
          canFeed: data.permissions?.canFeed !== false,
          canViewStats: data.permissions?.canViewStats !== false,
          canManageDevices: data.permissions?.canManageDevices !== false,
        }
      }));
      
      // Sort users by role (admin first) and then by display name
      usersArray.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      
      setUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (userId: string, permission: string, value: boolean) => {
    try {
      // Update the permission in Firebase
      const userRef = ref(database, `users/${userId}/permissions`);
      await update(userRef, {
        [permission]: value
      });
      
      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            permissions: {
              ...user.permissions,
              [permission]: value
            }
          };
        }
        return user;
      }));
      
      toast({
        title: "Permission Updated",
        description: `User permission has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Prevent users from changing their own role
    if (currentUser && userId === currentUser.uid) {
      toast({
        title: "Action Denied",
        description: "You cannot change your own role.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update the role in Firebase
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        role: newRole
      });
      
      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            role: newRole
          };
        }
        return user;
      }));
      
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}.`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    // Prevent users from deleting themselves
    if (currentUser && deleteUserId === currentUser.uid) {
      toast({
        title: "Action Denied",
        description: "You cannot delete your own account from here.",
        variant: "destructive",
      });
      setDeleteUserId(null);
      return;
    }
    
    try {
      // Delete the user from Firebase
      const userRef = ref(database, `users/${deleteUserId}`);
      await remove(userRef);
      
      // Update local state
      setUsers(users.filter(user => user.id !== deleteUserId));
      
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteUserId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Setup real-time updates for user login status
  useEffect(() => {
    const usersRef = ref(database, 'users');
    
    // Set up a listener for changes to the users node
    const unsubscribe = get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        // Set up individual listeners for each user's lastLogin
        Object.keys(snapshot.val()).forEach((userId) => {
          const userLoginRef = ref(database, `users/${userId}/lastLogin`);
          
          // Listen for changes to lastLogin
          const onLoginChange = (snapshot: any) => {
            if (snapshot.exists()) {
              const lastLogin = snapshot.val();
              
              // Update the user in our local state
              setUsers(prevUsers => 
                prevUsers.map(user => 
                  user.id === userId ? { ...user, lastLogin } : user
                )
              );
            }
          };
          
          // Attach the listener
          get(userLoginRef).then(onLoginChange);
        });
      }
    });
    
    // Clean up the listeners when the component unmounts
    return () => {
      // Cleanup would be more complex in a real implementation
      // as we'd need to track all the individual listeners
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        icon={<Users size={28} />}
        description="Manage users and their permissions"
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Users ({users.length})</h2>
          <p className="text-sm text-gray-500">
            {users.filter(u => u.role === 'admin').length} admins, {users.filter(u => u.role !== 'admin').length} regular users
          </p>
        </div>
        
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">No users found</p>
            <p className="text-sm text-gray-400">Add users to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium">User</th>
                    <th className="text-left py-2 px-4 font-medium">Role</th>
                    <th className="text-left py-2 px-4 font-medium">Permissions</th>
                    <th className="text-left py-2 px-4 font-medium">Last Login</th>
                    <th className="text-left py-2 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                            {user.photoURL ? (
                              <img 
                                src={user.photoURL} 
                                alt={user.displayName} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-indigo-100 flex items-center justify-center">
                                <PawPrint className="h-5 w-5 text-indigo-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          {user.role === 'admin' ? (
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                          {(!currentUser || user.id !== currentUser.uid) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-2"
                              onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Schedule</span>
                            <Switch 
                              checked={user.permissions.canSchedule}
                              onCheckedChange={(checked) => handlePermissionChange(user.id, 'canSchedule', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Feed</span>
                            <Switch 
                              checked={user.permissions.canFeed}
                              onCheckedChange={(checked) => handlePermissionChange(user.id, 'canFeed', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">View Stats</span>
                            <Switch 
                              checked={user.permissions.canViewStats}
                              onCheckedChange={(checked) => handlePermissionChange(user.id, 'canViewStats', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Manage Devices</span>
                            <Switch 
                              checked={user.permissions.canManageDevices}
                              onCheckedChange={(checked) => handlePermissionChange(user.id, 'canManageDevices', checked)}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="py-4 px-4">
                        {(!currentUser || user.id !== currentUser.uid) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteUserId(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user
                                  and remove their data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteUserId(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 