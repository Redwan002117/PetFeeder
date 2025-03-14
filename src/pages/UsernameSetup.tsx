import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { FaUser } from "react-icons/fa";
import { Loader2, User } from "lucide-react";
import { supabase } from '@/lib/supabase';
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";

const UsernameSetup = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is coming from Google sign-in
    const authMode = localStorage.getItem('authMode');
    const pendingUsername = localStorage.getItem('pendingUsername');
    
    console.log("UsernameSetup: Current user:", currentUser);
    console.log("UsernameSetup: Auth mode:", authMode);
    console.log("UsernameSetup: Pending username:", pendingUsername);
    
    if (authMode === 'signup' && pendingUsername) {
      // Pre-fill the username field
      setUsername(pendingUsername);
      
      // Clear the local storage
      localStorage.removeItem('authMode');
      localStorage.removeItem('pendingUsername');
    }
    
    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Pre-fill name if available
    if (currentUser.displayName) {
      setName(currentUser.displayName);
    }
    
    // Check if user already has a username in the database
    const checkExistingUsername = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', currentUser.id);

        if (error) throw error;

        if (data && data.length > 0 && data[0].username) {
          console.log("User already has a username, redirecting to dashboard");
          // User already has a username, redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error checking existing username:", error);
      }
    };
    
    checkExistingUsername();
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      setError('');

      // Validate username
      if (!username) {
        setError("Username is required");
        return;
      }

      if (username.length < 3) {
        setError("Username must be at least 3 characters long");
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError("Username can only contain letters, numbers, and underscores");
        return;
      }

      // Check if username is already taken
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('username')
        .neq('id', currentUser.id);

      if (fetchError) throw fetchError;

      if (data && data.some(user => user.username === username)) {
        setError("Username is already taken. Please choose a different username.");
        return;
      }

      // Update user profile with the provided username
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username,
          full_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Show success message
      toast({
        title: "Profile updated",
        description: "Your username has been set successfully",
        variant: "default",
      });

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error: any) {
      console.error("Error setting username:", error);
      setError(error.message || "Failed to set username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-pet-primary rounded-full flex items-center justify-center shadow-md">
                <User className="text-white h-8 w-8" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold">Complete Your Profile</CardTitle>
              <CardDescription className="text-base">
                Set up your username to continue
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name (Optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Username must be at least 3 characters and can only contain letters, numbers, and underscores.
                  </p>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-pet-primary hover:bg-pet-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Username...
                  </>
                ) : (
                  "Continue to Dashboard"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsernameSetup;