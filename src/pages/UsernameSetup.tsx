import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getGoogleAuthProvider, signInWithGoogle } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { FaUser } from "react-icons/fa";
import { Loader2 } from "lucide-react";

const UsernameSetup = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [nameError, setNameError] = useState('');
  const [googleUser, setGoogleUser] = useState<any>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're coming from Google sign-in
    const authMode = sessionStorage.getItem('authMode');
    
    if (authMode === 'signup') {
      handleGoogleAuth();
    }
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const { provider, auth } = getGoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Store the Google user data
      setGoogleUser(result.user);
      
      // Pre-fill the name field if available
      if (result.user.displayName) {
        setName(result.user.displayName);
      }
      
      // Clear the session storage
      sessionStorage.removeItem('authMode');
    } catch (error: any) {
      console.error("Error during Google authentication:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive",
      });
      navigate('/signup');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!googleUser) {
      toast({
        title: "Error",
        description: "Google authentication is required. Please try again.",
        variant: "destructive",
      });
      navigate('/signup');
      return;
    }
    
    try {
      setLoading(true);
      
      // Complete the sign-in process with the username
      await signInWithGoogle(username);
      
      toast({
        title: "Account created",
        description: "Your account has been successfully created!",
        variant: "default",
      });
      
      // Redirect to the profile page
      navigate('/profile');
    } catch (error: any) {
      console.error("Error during username setup:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up username",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Set Up Your Username</CardTitle>
            <CardDescription className="text-center">
              Please choose a unique username for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  disabled={!!googleUser?.displayName}
                  className={nameError ? "border-red-500" : ""}
                />
                {nameError && <p className="text-sm text-red-500">{nameError}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FaUser className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a unique username"
                    className={`pl-10 ${usernameError ? "border-red-500" : ""}`}
                  />
                </div>
                {usernameError ? (
                  <p className="text-sm text-red-500">{usernameError}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Username must be at least 3 characters and can only contain letters, numbers, and underscores.
                  </p>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Registration
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/signup')}
              disabled={loading}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default UsernameSetup; 