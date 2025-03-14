import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HandPlatter, Mail, Lock, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/lib/supabase-config';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn: login, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a message in the location state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (session) {
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error("Error checking session:", error);
        toast({
          title: "Error",
          description: "Failed to check login status",
          variant: "destructive",
        });
      }
    };

    checkSession();
  }, [navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check if input is an email or username
      const isEmail = emailOrUsername.includes('@');
      
      let authResponse;
      
      if (isEmail) {
        // If it's an email, use it directly
        authResponse = await supabase.auth.signInWithPassword({
          email: emailOrUsername,
          password: password,
        });
      } else {
        // If it's a username, we need to find the corresponding email from the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailOrUsername)
          .single();
        
        if (profileError || !profileData?.email) {
          throw new Error('Username not found. Please check your username or use your email address.');
        }
        
        // Now use the email from the profile to authenticate
        authResponse = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password: password,
        });
      }
      
      const { data, error } = authResponse;

      if (error) throw error;

      if (data?.session) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
              <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in to access your pet feeder dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="emailOrUsername" className="text-sm font-medium">
                      Email or Username
                    </label>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="emailOrUsername"
                      type="text"
                      placeholder="name@example.com or username"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-pet-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
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
              mode="signin" 
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
              Don't have an account?{" "}
              <Link to="/register" className="text-pet-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
