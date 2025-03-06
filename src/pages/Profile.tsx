
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ChangePasswordForm from "@/components/ChangePasswordForm";

const Profile = () => {
  const { currentUser } = useAuth();
  
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
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-2xl">
                  {currentUser?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
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
