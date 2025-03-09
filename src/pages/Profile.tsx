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
import { uploadProfilePicture, database } from "@/lib/firebase";
import { safeRef, safeUpdate, safeServerTimestamp } from "@/lib/firebase-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ProfileAvatar from "@/components/ProfileAvatar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getCloudinaryUploadUrl, getCloudinaryUploadSignature } from '@/lib/cloudinary';
import { Badge } from "@/components/ui/badge";
import { updateProfile, sendEmailVerification } from "firebase/auth";
import PageHeader from "@/components/PageHeader";
import { sendAdminRequestEmail } from "@/services/email-service";
import ImageCropper from "@/components/ImageCropper";

// Add a type extension for the User type to include isAdmin property
interface UserWithAdmin {
  isAdmin?: boolean;
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  reload: () => Promise<void>;
}

const Profile = () => {
  const { currentUser, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [adminRequestLoading, setAdminRequestLoading] = useState(false);
  const [adminRequestSent, setAdminRequestSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const { toast } = useToast();
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a URL for the image to be cropped
    const imageUrl = URL.createObjectURL(file);
    setImageToEdit(imageUrl);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    try {
      setUploading(true);
      setCropperOpen(false);

      // Upload the cropped image
      const photoURL = await uploadProfilePicture(croppedImage);
      
      // Update the user's profile
      if (currentUser) {
        await updateProfile(currentUser, { photoURL });
        
        // Update the user's profile in the database
        const userRef = safeRef(database, `users/${currentUser.uid}`);
        await safeUpdate(userRef, {
          photoURL,
          updatedAt: safeServerTimestamp()
        });
        
        toast({
          title: "Profile Updated",
          description: "Your profile picture has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      
      // Clean up the object URL
      if (imageToEdit) {
        URL.revokeObjectURL(imageToEdit);
        setImageToEdit(null);
      }
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    
    // Clean up the object URL
    if (imageToEdit) {
      URL.revokeObjectURL(imageToEdit);
      setImageToEdit(null);
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePromoteToAdmin = async () => {
    // This function would be used if we had a direct way to promote users to admin
    // For now, we'll use the request admin access function
    await handleRequestAdminAccess();
  };

  const handleSendVerificationEmail = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to verify your email.",
        variant: "destructive",
      });
      return;
    }
    
    setVerificationLoading(true);
    
    try {
      await sendEmailVerification(currentUser);
      setVerificationSent(true);
      
      toast({
        title: "Verification Email Sent",
        description: "A verification email has been sent to your email address.",
      });
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!currentUser) return;
    
    setCheckingVerification(true);
    
    try {
      // Reload the user to check if email is verified
      await currentUser.reload();
      
      if (currentUser.emailVerified) {
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
      } else {
        toast({
          title: "Not Verified",
          description: "Your email has not been verified yet. Please check your inbox and follow the verification link.",
        });
      }
    } catch (error) {
      console.error("Error checking verification:", error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleRequestAdminAccess = async () => {
    if (!currentUser) return;
    
    setAdminRequestLoading(true);
    
    try {
      // Create the approval and denial URLs
      const baseUrl = window.location.origin;
      const approveUrl = `${baseUrl}/admin?action=approve&userId=${currentUser.uid}`;
      const denyUrl = `${baseUrl}/admin?action=deny&userId=${currentUser.uid}`;
      
      // Update the database to mark the request as pending using safe utilities
      const success = await safeUpdate(`users/${currentUser.uid}`, {
        adminRequestStatus: 'pending',
        adminRequestDate: safeServerTimestamp()
      });
      
      if (!success) {
        throw new Error("Failed to update database");
      }
      
      // Send the admin request email
      const userData = {
        displayName: currentUser.displayName || 'Unknown User',
        email: currentUser.email || 'no-email@example.com',
        uid: currentUser.uid
      };
      
      const emailResult = await sendAdminRequestEmail(userData, approveUrl, denyUrl);
      
      if (emailResult.success) {
        toast({
          title: "Request Sent",
          description: "Your admin access request has been sent successfully.",
        });
        setAdminRequestSent(true);
      } else {
        throw new Error(emailResult.error || "Failed to send email");
      }
    } catch (error: any) {
      console.error("Error requesting admin access:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to request admin access. Please try again later.",
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
              
              <button
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary/90 transition-colors"
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={triggerFileInput}
              className="mt-2 w-full"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Picture
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Recommended: Square image, at least 200x200 pixels
            </p>
          </CardContent>
        </Card>
        
        {/* Account Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>View and update your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Email Address</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{currentUser?.email}</span>
                </div>
                
                {currentUser?.emailVerified ? (
                  <Badge className="bg-green-100 text-green-800 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Not Verified
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSendVerificationEmail}
                      disabled={verificationLoading || verificationSent}
                    >
                      {verificationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : verificationSent ? (
                        "Sent"
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              {!currentUser?.emailVerified && verificationSent && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Verification email sent. Please check your inbox and spam folder.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm ml-2"
                      onClick={handleCheckVerification}
                      disabled={checkingVerification}
                    >
                      {checkingVerification ? "Checking..." : "I've verified my email"}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Display Name</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{currentUser?.displayName || "No display name set"}</span>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Account Type</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{isAdmin ? "Administrator" : "Regular User"}</span>
                </div>
                
                {!isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRequestAdminAccess}
                    disabled={adminRequestLoading || adminRequestSent}
                  >
                    {adminRequestLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Requesting...
                      </>
                    ) : adminRequestSent ? (
                      "Request Sent"
                    ) : (
                      "Request Admin Access"
                    )}
                  </Button>
                )}
              </div>
              
              {adminRequestSent && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your admin access request has been sent and is pending approval.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Account Security</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 text-gray-500 mr-2" />
                  <span>Password</span>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">Change Password</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <ChangePasswordForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Security Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ChangePasswordForm />
            </div>
          </CardContent>
        </Card>
        
        {/* Danger Zone Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">Delete Account</h3>
              <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account</DialogTitle>
                  </DialogHeader>
                  <DeleteAccountForm />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Image Cropper Dialog */}
      {imageToEdit && (
        <ImageCropper
          image={imageToEdit}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          open={cropperOpen}
        />
      )}
    </div>
  );
};

export default Profile;
