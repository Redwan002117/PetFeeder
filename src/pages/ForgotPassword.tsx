import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        setError("No account found with this email address");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address format");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many attempts. Please try again later");
      } else {
        setError(error.message || "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="w-full max-w-md">
        <Card className="border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <CardHeader className="space-y-4 pb-6">
            <motion.div variants={itemVariants} className="flex justify-center">
              <div className="h-16 w-16 bg-pet-primary rounded-full flex items-center justify-center shadow-md">
                {success ? (
                  <CheckCircle className="text-white h-8 w-8" />
                ) : (
                  <Mail className="text-white h-8 w-8" />
                )}
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold">
                {success ? "Email Sent" : "Reset Password"}
              </CardTitle>
              <CardDescription className="text-base">
                {success 
                  ? "Check your email for password reset instructions" 
                  : "Enter your email to receive a password reset link"}
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {!success ? (
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-5"
                variants={itemVariants}
              >
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
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
                      Sending Reset Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.div 
                className="text-center space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-green-700 dark:text-green-300">
                    We've sent a password reset link to <strong>{email}</strong>. 
                    Please check your email and follow the instructions to reset your password.
                  </p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  If you don't see the email, check your spam folder or try again.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                >
                  Try Again
                </Button>
              </motion.div>
            )}
          </CardContent>
          
          <motion.div variants={itemVariants}>
            <CardFooter className="flex justify-center pt-2 pb-6">
              <Link 
                to="/login" 
                className="text-pet-primary font-medium hover:underline inline-flex items-center"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Login
              </Link>
            </CardFooter>
          </motion.div>
        </Card>
      </div>
    </motion.div>
  );
};

export default ForgotPassword; 