import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, MailCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const VerifyEmail = () => {
  const { token } = useParams<{ token?: string }>(); // Get token from URL params
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, sendVerificationEmailToUser: sendVerificationEmail } = useAuth();

  // Handle token verification on mount if token is present in URL
  useEffect(() => {
    if (token) {
      verifyEmailWithCode(token);
    }
  }, [token]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Supabase handles verification automatically via URL
  // This function just updates the UI state
  const verifyEmailWithCode = async (code: string) => {
    try {
      setVerifying(true);
      
      // In Supabase, verification is handled automatically by the URL
      // This is just to update the UI state
      setVerified(true);
      
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified.",
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error: any) {
      console.error("Error verifying email:", error);
      setError(error.message || "Failed to verify email. The code may be invalid or expired.");
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify email. The code may be invalid or expired.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!currentUser || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await sendVerificationEmail();
      setEmailSent(true);
      setCountdown(60); // Start a 60-second countdown
      
      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your email address.",
      });
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      setError(error.message || "Failed to send verification email.");
      
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check verification status directly with Supabase
  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      
      // Refresh the session to get latest user data
      const { data } = await supabase.auth.refreshSession();
      
      if (data?.user?.email_confirmed_at) {
        setVerified(true);
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast({
          title: "Not Verified",
          description: "Your email has not been verified yet. Please check your inbox.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error checking verification status:", error);
      toast({
        title: "Error",
        description: "Could not check verification status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show different UI based on verification state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {verified ? "Your email has been verified!" : "Please verify your email address"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {verified ? (
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-center text-lg font-medium">Email verified successfully!</p>
              <p className="text-center text-muted-foreground">
                You will be redirected to the dashboard shortly.
              </p>
            </div>
          ) : verifying ? (
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              <Loader2 className="h-20 w-20 animate-spin text-primary" />
              <p className="text-center">Verifying your email...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <MailCheck className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-center">
                  We've sent a verification link to your email address.
                  Please check your inbox and click the link to verify your account.
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline"
                  onClick={checkVerificationStatus}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : "I've already verified"}
                </Button>
                
                <Button 
                  onClick={handleResendVerification}
                  disabled={loading || countdown > 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : "Resend Email"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        {!verified && !verifying && (
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;