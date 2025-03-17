import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { validateAdminKey } from '@/config/adminKey';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';

interface LocationState {
  email: string;
  password: string;
  name: string;
  username: string;
}

export default function AdminRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state as LocationState;

  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate admin key
      if (!adminKey.trim()) {
        throw new Error("Admin key is required");
      }

      if (!validateAdminKey(adminKey)) {
        throw new Error("Invalid admin key");
      }

      if (!state?.email || !state?.password) {
        throw new Error("Registration information is missing");
      }

      // Register user with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: state.email,
        password: state.password,
        options: {
          data: {
            full_name: state.name,
            username: state.username,
            is_admin: true
          }
        }
      });
      
      if (signUpError) throw signUpError;

      // Create admin profile in the database
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user?.id,
          username: state.username,
          full_name: state.name,
          email: state.email,
          is_admin: true,
          created_at: new Date().toISOString()
        }]);
      
      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Admin account created successfully",
      });

      // Navigate to login
      navigate('/login');
    } catch (error: any) {
      console.error('Admin registration error:', error);
      setError(error.message || "Failed to create admin account");
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create admin account",
      });
    } finally {
      setLoading(false);
    }
  };

  // If no state is passed, redirect to regular registration
  if (!state?.email) {
    navigate('/register');
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Admin Registration
            </CardTitle>
            <CardDescription className="text-center">
              Complete your admin account setup
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={state.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={state.name}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={state.username}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="adminKey">Admin Key</Label>
                  <div className="relative">
                    <Input
                      id="adminKey"
                      type={showAdminKey ? "text" : "password"}
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      placeholder="Enter your admin key"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminKey(!showAdminKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      {showAdminKey ? (
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
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Complete Registration"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to regular registration
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}