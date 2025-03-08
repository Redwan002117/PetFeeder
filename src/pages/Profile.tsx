import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Upload, AlertCircle, Shield, Mail, CheckCircle, User as UserIcon, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import NotificationSettings from "@/components/NotificationSettings";
import { uploadProfilePicture, database, ref, update } from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ProfileAvatar from "@/components/ProfileAvatar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getCloudinaryUploadUrl, getCloudinaryUploadSignature } from '@/lib/cloudinary';
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { currentUser, updateUserProfile, userData, isAdmin, isVerifiedAdmin, sendVerificationEmailToUser, checkVerificationStatus } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminPromotionOpen, setAdminPromotionOpen] = useState(false);
  const [adminPromotionLoading, setAdminPromotionLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or GIF image.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a FormData object to send the file to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'petfeeder_profile_pics'); // Create this preset in your Cloudinary dashboard
      formData.append('public_id', `profile_pictures/user_${currentUser.uid}`);
      
      // Get the Cloudinary upload URL
      const uploadUrl = getCloudinaryUploadUrl();
      
      // Upload the file to Cloudinary
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }
      
      const data = await response.json();
      
      // Update user profile with new photo URL
      await updateUserProfile({ photoURL: data.secure_url });
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Admin key for demonstration purposes
  const ADMIN_KEY = "admin123";

  const handlePromoteToAdmin = async () => {
    if (!currentUser) return;
    
    if (adminKey !== ADMIN_KEY) {
      toast({
        title: "Invalid admin key",
        description: "The admin key you entered is incorrect.",
        variant: "destructive",
      });
      return;
    }
    
    setAdminPromotionLoading(true);
    try {
      // Update user role to admin
      await update(ref(database, `users/${currentUser.uid}`), {
        role: "admin",
      });
      
      toast({
        title: "Success!",
        description: "You have been promoted to admin. Please refresh the page to see changes.",
      });
      
      setAdminPromotionOpen(false);
    } catch (error: any) {
      toast({
        title: "Promotion failed",
        description: error.message || "Failed to promote to admin.",
        variant: "destructive",
      });
    } finally {
      setAdminPromotionLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setVerificationLoading(true);
    try {
      await sendVerificationEmailToUser();
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send verification email",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setVerificationLoading(true);
    try {
      await checkVerificationStatus();
    } catch (error: any) {
      toast({
        title: "Failed to check verification status",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <ErrorBoundary>
                <ProfileAvatar user={currentUser} size="xl" />
              </ErrorBoundary>
              {uploadSuccess && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <CheckCircle size={16} />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <Button 
              onClick={triggerFileInput} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Change Picture"}
              <Upload className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        {/* Account Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Email</label>
                {currentUser?.emailVerified ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertCircle className="mr-1 h-3 w-3" /> Unverified
                  </Badge>
                )}
              </div>
              <div className="flex items-center">
                <div className="flex-1 p-3 bg-gray-50 rounded-md text-gray-700">
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{currentUser?.email}</span>
                  </div>
                </div>
                {!currentUser?.emailVerified && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2"
                    onClick={handleSendVerificationEmail}
                    disabled={verificationLoading}
                  >
                    {verificationLoading ? "Sending..." : "Verify"}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Username - now read-only */}
            <div>
              <label className="text-sm font-medium mb-2 block">Username</label>
              <div className="flex items-center">
                <div className="flex-1 p-3 bg-gray-50 rounded-md text-gray-700">
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{currentUser?.displayName || "No username set"}</span>
                    <Lock className="ml-2 h-3 w-3 text-gray-400" title="Username cannot be changed" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Username is set during registration and cannot be changed.</p>
            </div>
            
            {/* Role */}
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                <div className="flex items-center">
                  <Shield className="mr-2 h-4 w-4 text-gray-500" />
                  <span>{isAdmin ? "Administrator" : "Regular User"}</span>
                  {isAdmin && !isVerifiedAdmin && (
                    <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                      <AlertCircle className="mr-1 h-3 w-3" /> Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Admin Verification */}
            {isAdmin && !isVerifiedAdmin && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your admin account is not verified. Please check your email for a verification link or click the button below to verify your email.
                </AlertDescription>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCheckVerification}
                  >
                    Check Verification Status
                  </Button>
                </div>
              </Alert>
            )}
            
            {/* Admin Promotion (for regular users) */}
            {!isAdmin && (
              <div className="mt-4">
                <AlertDialog open={adminPromotionOpen} onOpenChange={setAdminPromotionOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Shield className="mr-2 h-4 w-4" />
                      Request Admin Access
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Request Admin Access</AlertDialogTitle>
                      <AlertDialogDescription>
                        Enter the admin key to request admin access. This will require email verification.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        placeholder="Enter admin key"
                        type="password"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handlePromoteToAdmin}
                        disabled={adminPromotionLoading}
                      >
                        {adminPromotionLoading ? "Processing..." : "Submit"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Security Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
        
        {/* Notification Settings Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettings />
          </CardContent>
        </Card>
        
        {/* Delete Account Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
