import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Upload, AlertCircle, Shield, Mail, CheckCircle } from "lucide-react";
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
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative mb-4 group">
                <ErrorBoundary>
                  <ProfileAvatar
                    user={currentUser}
                    size="xl"
                    className="border-2 border-white shadow-md"
                  />
                </ErrorBoundary>
                
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute bottom-0 right-0 rounded-full bg-primary text-white h-8 w-8 p-1"
                      onClick={triggerFileInput}
                      disabled={false}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Profile Picture</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <ErrorBoundary>
                          <ProfileAvatar
                            user={currentUser}
                            size="xl"
                            className="border-2 border-white shadow-md"
                          />
                        </ErrorBoundary>
                      </div>
                      
                      <Input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden"
                      />
                      
                      <Button 
                        className="w-full" 
                        onClick={triggerFileInput}
                        disabled={loading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {loading ? "Uploading..." : "Upload new picture"}
                      </Button>
                      
                      {uploadSuccess && (
                        <p className="text-sm text-green-600">
                          Profile picture updated successfully!
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-2 w-full">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium">{currentUser?.email}</p>
                  
                  {isAdmin && (
                    <div className="mt-2 flex items-center justify-center">
                      {isVerifiedAdmin ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Email verified</span>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={handleSendVerificationEmail}
                          disabled={verificationLoading}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          {verificationLoading ? "Sending..." : "Verify email"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Account ID</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser?.uid}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Account Created</p>
                  <p className="text-sm">
                    {currentUser?.metadata?.creationTime 
                      ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                      : "N/A"}
                  </p>
                </div>
                
                {isAdmin && !isVerifiedAdmin && (
                  <div className="mt-4 pt-4 border-t w-full">
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-800" />
                      <AlertDescription className="text-amber-800 text-xs">
                        Your admin account is not verified. Some admin features are restricted until you verify your email.
                        <Button 
                          variant="link" 
                          className="text-amber-800 p-0 h-auto text-xs underline"
                          onClick={handleCheckVerification}
                        >
                          I've already verified my email
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t w-full">
                  <AlertDialog open={adminPromotionOpen} onOpenChange={setAdminPromotionOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Shield className="mr-2 h-4 w-4" />
                        Become Admin
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
                        <AlertDialogDescription>
                          Enter the admin key to promote yourself to admin status.
                          <div className="mt-4">
                            <Input
                              type="password"
                              placeholder="Enter admin key"
                              value={adminKey}
                              onChange={(e) => setAdminKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              For demonstration purposes, the admin key is: "admin123"
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            handlePromoteToAdmin();
                          }}
                          disabled={adminPromotionLoading}
                        >
                          {adminPromotionLoading ? "Promoting..." : "Promote to Admin"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <div className="space-y-6">
            <NotificationSettings />
            <ChangePasswordForm />
            <DeleteAccountForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
