import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Spinner } from "./ui/spinner";
import { ErrorDisplay } from "./ErrorDisplay";
import Layout from "./Layout";
import ErrorBoundary from "./ErrorBoundary";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: "canFeed" | "canSchedule" | "canViewStats";
  adminOnly?: boolean;
  requireVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  adminOnly = false,
  requireVerification = true
}) => {
  const [error, setError] = useState<Error | null>(null);
  
  // Always call hooks at the top level
  const authData = useAuth();
  
  // Handle any errors that might occur when using auth data
  try {
    const { currentUser, loading, hasPermission, isAdmin, isVerifiedAdmin } = authData;
    
    if (error) {
      return <ErrorDisplay error={error} />;
    }
    
    if (loading) {
      return <Spinner size="lg" className="mx-auto my-12" />;
    }
    
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    
    if (requireVerification && !currentUser.emailVerified) {
      return <Navigate to="/verify-email" />;
    }
    
    if (adminOnly && !isAdmin) {
      return <Navigate to="/dashboard" />;
    }
    
    if (adminOnly && requireVerification && !isVerifiedAdmin) {
      return <Navigate to="/admin-verification" />;
    }
    
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return <Navigate to="/dashboard" />;
    }
    
    return (
      <ErrorBoundary>
        <Layout>
          {children}
        </Layout>
      </ErrorBoundary>
    );
  } catch (err) {
    console.error("Error in ProtectedRoute:", err);
    setError(err instanceof Error ? err : new Error(String(err)));
    // Redirect to login if there's an auth error
    return <Navigate to="/login" />;
  }
};

export default ProtectedRoute;
