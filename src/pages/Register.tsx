import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HandPlatter, User, Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useToast } from "@/components/ui/use-toast";
import { validateAdminKey } from '@/config/adminKey';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/lib/supabase';
import { testConnection } from '@/lib/supabase-config';
import { handleSupabaseError } from '@/lib/supabase-config';
import { toast } from 'sonner';

const Register = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate input first
      if (!email || !password || !confirmPassword || !username || !name) {
        setError("All fields are required");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      // Test connection before attempting registration
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error("Unable to connect to the server. Please check your internet connection.");
      }

      console.log("Attempting registration...");
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: name,
            email: email,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Registration failed - no user data received");
      }

      // Use the toast component correctly
      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });

      navigate('/login');
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = handleSupabaseError(error, 'registration');
      setError(errorMessage);
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
                <HandPlatter className="text-white h-8 w-8" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
              <CardDescription className="text-base">
                Sign up to start managing your pet feeder
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
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10"
                      required
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
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <GoogleSignInButton 
              mode="signup" 
              username={username} 
              className="w-full"
              onSuccess={() => {
                toast({
                  title: "Google Authentication Started",
                  description: "Please complete the Google authentication process.",
                  variant: "default",
                });
              }}
              onError={(error) => {
                setError(error.message || "Failed to authenticate with Google");
              }}
            />
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-pet-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
