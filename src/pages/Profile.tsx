
import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { uploadProfilePicture, getProfilePictureUrl } from "@/lib/firebase";

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (currentUser?.uid) {
        try {
          const url = await getProfilePictureUrl(currentUser.uid);
          setPhotoURL(url);
        } catch (error) {
          console.error("Error fetching profile picture:", error);
        }
      }
    };
    
    fetchProfilePicture();
  }, [currentUser]);

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

    setLoading(true);
    try {
      const downloadURL = await uploadProfilePicture(currentUser.uid, file);
      await updateUserProfile({ photoURL: downloadURL });
      setPhotoURL(downloadURL);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile picture.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
                <Avatar className="h-24 w-24">
                  {photoURL ? (
                    <AvatarImage src={photoURL} alt="Profile" />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {currentUser?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <button 
                      className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full text-white hover:bg-primary/90"
                      aria-label="Change profile picture"
                    >
                      <Pencil size={16} />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Profile Picture</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <Avatar className="h-32 w-32">
                          {photoURL ? (
                            <AvatarImage src={photoURL} alt="Profile" />
                          ) : (
                            <AvatarFallback className="text-4xl">
                              {currentUser?.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
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
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-2 w-full">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium">{currentUser?.email}</p>
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
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
};

export default Profile;
