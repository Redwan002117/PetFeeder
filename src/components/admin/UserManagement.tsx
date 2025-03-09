import React, { useState, useEffect } from 'react';
import { database, ref, get, update } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, Edit, Trash2, Shield, User, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: number;
  lastLogin?: number;
  permissions: {
    canFeed: boolean;
    canSchedule: boolean;
    canViewStats: boolean;
  };
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editPermissions, setEditPermissions] = useState<{
    canFeed: boolean;
    canSchedule: boolean;
    canViewStats: boolean;
  }>({
    canFeed: true,
    canSchedule: true,
    canViewStats: true
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const { toast } = useToast();

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
        ...data,
        createdAt: data.createdAt || 0,
        lastLogin: data.lastLogin || 0,
        permissions: {
          canFeed: data.permissions?.canFeed ?? true,
          canSchedule: data.permissions?.canSchedule ?? true,
          canViewStats: data.permissions?.canViewStats ?? true
        }
      }));
      
      // Sort users by name
      usersArray.sort((a, b) => a.displayName.localeCompare(b.displayName));
      
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

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setEditPermissions(user.permissions);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      // Update user in Firebase Realtime Database
      const userRef = ref(database, `users/${editingUser.id}`);
      await update(userRef, {
        permissions: editPermissions
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, permissions: editPermissions } 
          : user
      ));
      
      toast({
        title: "User Updated",
        description: "User permissions have been updated successfully.",
        variant: "default",
      });
      
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update user permissions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Delete user from Firebase Realtime Database
      const userRef = ref(database, `users/${userToDelete.id}`);
      await update(userRef, null);
      
      // Update local state
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
        variant: "default",
      });
      
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="flex items-center gap-1 bg-purple-500"><Shield className="h-3 w-3" /> Admin</Badge>;
      case 'user':
      default:
        return <Badge variant="secondary" className="flex items-center gap-1"><User className="h-3 w-3" /> User</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
        >
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No users found.</p>
              {searchTerm && <p className="text-sm mt-2">Try changing your search criteria.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            disabled={user.role === 'admin'}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Permissions</DialogTitle>
              <DialogDescription>
                Update permissions for {editingUser.displayName}. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Can Feed</label>
                  <p className="text-xs text-muted-foreground">Allow user to manually feed pets</p>
                </div>
                <Switch
                  checked={editPermissions.canFeed}
                  onCheckedChange={(checked) => setEditPermissions({...editPermissions, canFeed: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Can Schedule</label>
                  <p className="text-xs text-muted-foreground">Allow user to create feeding schedules</p>
                </div>
                <Switch
                  checked={editPermissions.canSchedule}
                  onCheckedChange={(checked) => setEditPermissions({...editPermissions, canSchedule: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Can View Stats</label>
                  <p className="text-xs text-muted-foreground">Allow user to view feeding statistics</p>
                </div>
                <Switch
                  checked={editPermissions.canViewStats}
                  onCheckedChange={(checked) => setEditPermissions({...editPermissions, canViewStats: checked})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button onClick={handleSaveUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user "{userToDelete?.displayName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 