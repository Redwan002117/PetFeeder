import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmailWithCode = async () => {
      const oobCode = searchParams.get("oobCode");
      
      if (!oobCode) {
        setError("No verification code provided");
        setVerifying(false);
        return;
      }
      
      try {
        await verifyEmail(oobCode);
        setSuccess(true);
      } catch (error: any) {
        console.error("Verification error:", error);
        setError(error.message || "Failed to verify email");
      } finally {
        setVerifying(false);
      }
    };
    
    verifyEmailWithCode();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
              <Shield className="text-white h-7 w-7" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            Verifying your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {verifying ? (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p>Verifying your email address...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Email Verified!</h3>
              <p className="mb-6">Your email has been successfully verified. You can now access all admin features.</p>
              <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verification Failed</h3>
              <p className="text-muted-foreground mb-2">{error}</p>
              <p className="mb-6">The verification link may have expired or is invalid.</p>
              <Button onClick={() => navigate("/login")}>Back to Login</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail; 