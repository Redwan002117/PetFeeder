import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const AdminRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    
    try {
      setError("");
      setLoading(true);
      // Register as admin (isAdmin = true)
      await register(email, password, true);
      // Navigate to login page instead of dashboard since verification is required
      navigate("/login", { 
        state: { 
          message: "Admin account created! Please check your email to verify your account before accessing admin features." 
        } 
      });
    } catch (error: any) {
      setError(error.message || "Failed to create an admin account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
              <Shield className="text-white h-7 w-7" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Admin Account</CardTitle>
          <CardDescription className="text-center">
            This page allows direct registration of an admin account
          </CardDescription>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Email verification is required for admin accounts
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <p className="text-amber-800 text-sm">
                <strong>Warning:</strong> This page allows direct registration of an admin account.
                In a production environment, this should be protected or removed.
              </p>
              <p className="text-amber-800 text-sm mt-2">
                <strong>Note:</strong> You will need to verify your email address before accessing admin features.
              </p>
            </div>
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating Admin Account..." : "Create Admin Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRegister; 