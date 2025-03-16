import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { applyActionCode, sendVerificationEmail } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  // Parse the URL parameters to check if we have an oobCode (verification code)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const oobCode = queryParams.get('oobCode');
    const mode = queryParams.get('mode');
    
    if (oobCode && mode === 'verifyEmail') {
      setVerificationCode(oobCode);
      verifyEmailWithCode(oobCode);
    }
  }, [location]);

  // Check if user is already verified
  useEffect(() => {
    if (currentUser?.emailVerified) {
      setVerified(true);
    }
  }, [currentUser]);

  const verifyEmailWithCode = async (code: string) => {
    setVerifying(true);
    setError(null);
    
    try {
      // Supabase handles verification automatically via URL
      // This is just to update the UI state
      await applyActionCode(null, code);
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
      await sendVerificationEmail(currentUser);
      setEmailSent(true);
      setCountdown(60); // Start a 60-second countdown
      
      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your email address.",
      });
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      setError(error.message || "Failed to send verification email. Please try again later.");
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // If user is not logged in, redirect to login
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              {verified ? (
                <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
              ) : (
                <Mail className="mr-2 h-6 w-6 text-indigo-500" />
              )}
              {verified ? "Email Verified" : "Verify Your Email"}
            </CardTitle>
            <CardDescription>
              {verified 
                ? "Your email has been successfully verified. You can now access all features of the application."
                : `We've sent a verification email to ${currentUser.email}. Please check your inbox and follow the instructions to verify your email address.`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {verified ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-6"
              >
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  You will be redirected to the dashboard shortly...
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}
                
                {emailSent && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        A new verification email has been sent to your inbox.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <div className="flex">
                    <Mail className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        If you don't see the email in your inbox, please check your spam folder.
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        The verification link will expire after 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Didn't receive the email? Click the button below to resend.
                  </p>
                  <Button 
                    onClick={handleResendVerification} 
                    disabled={loading || countdown > 0}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Email ({countdown}s)
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            
            {!verified && (
              <Button onClick={() => navigate('/dashboard')}>
                Continue to Dashboard
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;