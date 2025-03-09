import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Upload, AlertCircle, Shield, Mail, CheckCircle, User as UserIcon, Lock, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import NotificationSettings from "@/components/NotificationSettings";
import { uploadProfilePicture, database, ref, update, set } from "@/lib/firebase";
import { serverTimestamp } from "firebase/database";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ProfileAvatar from "@/components/ProfileAvatar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getCloudinaryUploadUrl, getCloudinaryUploadSignature } from '@/lib/cloudinary';
import { Badge } from "@/components/ui/badge";
import { updateProfile, sendEmailVerification, User } from "firebase/auth";
import PageHeader from "@/components/PageHeader";

// Add a type extension for the User type to include isAdmin property
declare module 'firebase/auth' {
  interface User {
    isAdmin?: boolean;
  }
}

const Profile = () => {
  const { currentUser, updateUserProfile, userData, isAdmin, isVerifiedAdmin, sendVerificationEmailToUser, checkVerificationStatus } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [adminRequestLoading, setAdminRequestLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminPromotionOpen, setAdminPromotionOpen] = useState(false);
  const [adminPromotionLoading, setAdminPromotionLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [adminRequestSent, setAdminRequestSent] = useState(false);

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
      setVerificationEmailSent(true);
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

  const handleRequestAdminAccess = async () => {
    if (!currentUser) return;
    
    try {
      setAdminRequestLoading(true);
      
      // Simulate a network request delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a unique request ID
      const requestId = `req_${Date.now()}`;
      
      // Send a real email to the admin using EmailJS
      try {
        // Using EmailJS service to send an actual email
        const emailEndpoint = 'https://api.emailjs.com/api/v1.0/email/send';
        await fetch(emailEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: 'service_petfeeder',
            template_id: 'template_admin_request',
            user_id: 'GamerNo002117',
            template_params: {
              to_email: 'GamerNo002117@redwancodes.com',
              from_name: currentUser.displayName || 'PetFeeder User',
              from_email: currentUser.email,
              subject: 'PetFeeder Admin Request',
              message: `User ${currentUser.email} (${currentUser.displayName || 'Unknown User'}) has requested admin access.`,
              user_id: currentUser.uid,
              request_id: requestId,
              // HTML content with approval buttons
              html_content: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; max-width: 600px;">
                  <h2 style="color: #4f46e5;">PetFeeder Admin Access Request</h2>
                  <p>A user has requested admin access to the PetFeeder application.</p>
                  
                  <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>User Details:</strong></p>
                    <ul style="list-style-type: none; padding-left: 0;">
                      <li><strong>Name:</strong> ${currentUser.displayName || 'Unknown User'}</li>
                      <li><strong>Email:</strong> ${currentUser.email}</li>
                      <li><strong>User ID:</strong> ${currentUser.uid}</li>
                      <li><strong>Request ID:</strong> ${requestId}</li>
                      <li><strong>Requested At:</strong> ${new Date().toLocaleString()}</li>
                    </ul>
                  </div>
                  
                  <p>Please review this request and take appropriate action:</p>
                  
                  <div style="margin: 25px 0;">
                    <a href="https://petfeeder-app.web.app/admin/approve-request?userId=${currentUser.uid}&requestId=${requestId}" 
                       style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                      Approve Request
                    </a>
                    
                    <a href="https://petfeeder-app.web.app/admin/deny-request?userId=${currentUser.uid}&requestId=${requestId}" 
                       style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                      Deny Request
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 30px;">
                    This is an automated message from the PetFeeder application. Please do not reply to this email.
                  </p>
                </div>
              `
            }
          }),
        });
        
        // Log success
        console.log('Admin request email sent successfully');
        
        // Also update the database with the admin request
        const adminRequestsRef = ref(database, `adminRequests/${requestId}`);
        await set(adminRequestsRef, {
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'Unknown User',
          requestedAt: serverTimestamp(),
          status: 'pending'
        });
        
        // Show success message
        toast({
          title: "Request Sent",
          description: "Your admin access request has been sent successfully.",
          variant: "default",
        });
        
        setAdminRequestSent(true);
      } catch (error) {
        console.error('Error sending admin request email:', error);
        
        // Fallback: Log the admin request to the database even if email fails
        try {
          const adminRequestsRef = ref(database, `adminRequests/${requestId}`);
          await set(adminRequestsRef, {
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Unknown User',
            requestedAt: serverTimestamp(),
            status: 'pending',
            emailFailed: true
          });
          
          toast({
            title: "Request Recorded",
            description: "Your admin access request has been recorded, but there was an issue sending the email notification.",
            variant: "default",
          });
          
          setAdminRequestSent(true);
        } catch (dbError) {
          console.error('Error recording admin request to database:', dbError);
          toast({
            title: "Request Failed",
            description: "There was an error processing your request. Please try again later.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error in admin request process:', error);
      toast({
        title: "Request Failed",
        description: "There was an error processing your request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAdminRequestLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader 
        title="Profile Settings" 
        icon={<UserIcon size={28} />}
        description="Manage your account information and preferences"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
        
        {/* Complete Profile Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-indigo-500" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your detailed account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-medium flex items-center flex-wrap">
                    <span className="break-all">{currentUser?.email}</span>
                    {currentUser?.emailVerified ? (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800">
                        <AlertCircle className="h-3 w-3 mr-1" /> Unverified
                      </Badge>
                    )}
                  </div>
                  {!currentUser?.emailVerified && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto"
                      onClick={handleSendVerificationEmail}
                      disabled={verificationEmailSent || loading}
                    >
                      {verificationEmailSent ? "Sent" : "Verify"}
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Username</h3>
                <p className="text-base font-medium break-all">{userData?.username || currentUser?.displayName || 'Not set'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</h3>
                <p className="text-base font-medium break-all">{userData?.name || currentUser?.displayName || 'Not set'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Type</h3>
                <div className="text-base font-medium flex items-center">
                  {isAdmin ? (
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-800">
                      <Shield className="h-3 w-3 mr-1" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                      <UserIcon className="h-3 w-3 mr-1" /> Standard User
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Created</h3>
                  <p className="text-base font-medium">
                    {currentUser?.metadata?.creationTime 
                      ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                      : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Sign In</h3>
                  <p className="text-base font-medium">
                    {currentUser?.metadata?.lastSignInTime 
                      ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() 
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Admin Alert Card - Only shown for unverified admins */}
        {currentUser?.isAdmin && !currentUser?.emailVerified && (
          <Card className="md:col-span-3 border-yellow-500 dark:border-yellow-600">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20 rounded-t-lg">
              <CardTitle className="text-yellow-800 dark:text-yellow-400 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Unverified Admin Account
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                Your admin account requires email verification for full access to administrative features.
              </p>
              <Button 
                variant="outline" 
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                onClick={handleSendVerificationEmail}
                disabled={verificationEmailSent || loading}
              >
                {verificationEmailSent ? "Verification Email Sent" : "Send Verification Email"}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Admin Access Card */}
        {!isAdmin && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-indigo-500" />
                Request Admin Access
              </CardTitle>
              <CardDescription>
                Request admin privileges for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Admin access allows you to manage all devices, users, and settings in the system.
                  Your request will be reviewed by the system administrator.
                </p>
                
                {adminRequestSent ? (
                  <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-600 dark:text-green-400">
                      Your admin access request has been sent. You will be notified when it's approved.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-600 dark:text-blue-400">
                        An email will be sent to the administrator with your request details.
                      </AlertDescription>
                    </Alert>
                    
                    <Button
                      onClick={handleRequestAdminAccess}
                      disabled={adminRequestLoading}
                      className="w-full md:w-auto"
                    >
                      {adminRequestLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Request...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Request Admin Access
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Account Deletion */}
        <div className="md:col-span-3 mt-6">
          <DeleteAccountForm />
        </div>
      </div>
    </div>
  );
};

export default Profile;
