import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  username?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  mode = 'signin', 
  username, 
  onSuccess, 
  onError,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    // For signup mode, validate username first
    if (mode === 'signup') {
      if (!username || username.trim().length < 3) {
        toast({
          title: "Username Required",
          description: "Please enter a valid username (at least 3 characters) before continuing with Google.",
          variant: "destructive",
        });
        return;
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        toast({
          title: "Invalid Username",
          description: "Username can only contain letters, numbers, and underscores.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setLoading(true);
    try {
      console.log(`Starting Google ${mode} with username:`, username);
      
      // Call the signInWithGoogle function with username if in signup mode
      const result = await signInWithGoogle(mode === 'signup' ? username : undefined);
      
      console.log("Google sign-in result:", result);
      
      if (result.success) {
        toast({
          title: "Authentication Successful",
          description: mode === 'signin' ? "You have been signed in successfully." : "Your account has been created successfully.",
          variant: "default",
        });
        
        if (onSuccess) onSuccess();
        
        // If we have a user object, we can navigate directly
        if (result.user) {
          if (result.newUser) {
            navigate("/username-setup");
          } else {
            navigate("/dashboard");
          }
        } else {
          // Otherwise, wait for redirect to complete
          toast({
            title: "Redirecting...",
            description: "Please wait while we redirect you to Google for authentication.",
            variant: "default",
          });
        }
      } else if (result.error) {
        toast({
          title: "Authentication Failed",
          description: result.error,
          variant: "destructive",
        });
        if (onError) onError(new Error(result.error));
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate with Google. Please try again.",
        variant: "destructive",
      });
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`flex items-center justify-center gap-2 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
        )}
        {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
      </Button>
    </ErrorBoundary>
  );
};

export default GoogleSignInButton; 