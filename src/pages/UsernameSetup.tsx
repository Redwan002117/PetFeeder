import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AtSign, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const UsernameSetup = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checking, setChecking] = useState(false);
  
  const { currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Prefill name from Google or other OAuth providers
  useEffect(() => {
    if (currentUser?.user_metadata?.full_name) {
      setName(currentUser.user_metadata.full_name);
    } else if (currentUser?.user_metadata?.name) {
      setName(currentUser.user_metadata.name);
    }
    
    // Check localStorage for username (from OAuth signup flow)
    const storedUsername = localStorage.getItem('signup_username');
    if (storedUsername) {
      setUsername(storedUsername);
      localStorage.removeItem('signup_username'); // Clean up
    } else if (currentUser?.email) {
      // Generate suggested username from email
      const emailUsername = currentUser.email.split('@')[0];
      setUsername(emailUsername);
    }
  }, [currentUser]);
  
  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(true);
      return;
    }
    
    const timer = setTimeout(async () => {
      checkUsernameAvailability(username);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username]);
  
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) return;
    
    try {
      setChecking(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      
      // If data is null, the username is available
      setUsernameAvailable(!data);
    } catch (error) {
      console.error('Error checking username availability:', error);
    } finally {
      setChecking(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (!usernameAvailable) {
      setError('Username is already taken');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }
    
    if (!currentUser) {
      setError('You must be logged in to set up your profile');
      return;
    }
    
    setLoading(true);
    
    try {
      // Update user metadata in Supabase Auth
      await supabase.auth.updateUser({
        data: {
          username,
          full_name: name || username
        }
      });
      
      // Create or update user data in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select()
        .eq('id', currentUser.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = "no rows found", which is fine if profile doesn't exist yet
        throw profileError;
      }
      
      if (!profile) {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: currentUser.id,
            username: username,
            full_name: name || username,
            email: currentUser.email,
            created_at: new Date().toISOString()
          }]);
          
        if (insertError) throw insertError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username,
            full_name: name || username
          })
          .eq('id', currentUser.id);
          
        if (updateError) throw updateError;
      }
      
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
      setError(error.message || "Failed to update username");
      
      toast({
        title: "Error",
        description: error.message || "Failed to update username",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
          <CardDescription>Choose a username to complete your account setup</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="Your name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="flex justify-between">
                <span>Username</span>
                {checking ? (
                  <span className="text-xs text-muted-foreground">Checking...</span>
                ) : username && username.length >= 3 ? (
                  usernameAvailable ? (
                    <span className="text-xs text-green-600">Available</span>
                  ) : (
                    <span className="text-xs text-red-600">Already taken</span>
                  )
                ) : null}
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="pl-10"
                  placeholder="Choose a username"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Username must be at least 3 characters and contain only letters, numbers, and underscores.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || checking || !usernameAvailable || username.length < 3}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up...
                </>
              ) : "Continue"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            You can change your username later in your profile settings.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UsernameSetup;