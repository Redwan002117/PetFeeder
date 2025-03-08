import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { getGoogleAuthProvider, signInWithGoogle } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ErrorBoundary";

interface GoogleSignInButtonProps {
  mode: 'signin' | 'signup';
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ mode, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      
      if (mode === 'signup') {
        // For signup, store the auth mode and redirect to username setup
        sessionStorage.setItem('authMode', 'signup');
        navigate('/username-setup');
      } else {
        // For signin, attempt to sign in directly
        await signInWithGoogle();
        navigate('/profile');
      }
    } catch (error: any) {
      console.error("Error during Google authentication:", error);
      
      // If the error is about setting up username, redirect to username setup
      if (error.message === "Please set up your username first") {
        sessionStorage.setItem('authMode', 'signup');
        navigate('/username-setup');
        return;
      }
      
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Button
        variant="outline"
        className={`w-full flex items-center justify-center ${className}`}
        onClick={handleGoogleAuth}
        disabled={loading}
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
        {loading ? "Processing..." : mode === 'signin' ? "Sign In with Google" : "Continue with Google"}
      </Button>
    </ErrorBoundary>
  );
};

export default GoogleSignInButton; 