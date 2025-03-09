import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HandPlatter, Mail, Lock, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useToast } from "@/components/ui/use-toast";
import { signIn, handleRedirectResult } from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
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
    // Check if there's a redirect result from Google authentication
    const checkRedirectResult = async () => {
      try {
        console.log("Login page: Checking for redirect result");
        const result = await handleRedirectResult();
        console.log("Redirect result:", result);
        
        if (result.success) {
          // If successful login, show success message and redirect
          toast({
            title: "Login Successful",
            description: "You have been successfully logged in.",
            variant: "default",
          });
          
          // Redirect to username setup if new user, otherwise to dashboard
          if (result.newUser) {
            navigate("/username-setup");
          } else {
            navigate("/dashboard");
          }
        } else if (result.error) {
          // Show error message if there was an error
          toast({
            title: "Login Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking redirect result:", error);
      }
    };
    
    // Check if user is already logged in
    if (currentUser) {
      console.log("User already logged in:", currentUser);
      navigate("/dashboard");
      return;
    }
    
    checkRedirectResult();
  }, [navigate, toast, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError("");
      setLoading(true);
      await login(emailOrUsername, password);
      toast({
        title: "Login Successful",
        description: "You have been successfully logged in.",
        variant: "default",
      });
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
      toast({
        title: "Login Failed",
        description: "Failed to log in. Please check your credentials.",
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
            <form onSubmit={handleSubmit} className="space-y-5">
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
