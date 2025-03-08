import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useState, useEffect } from "react";

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
  
  // Use try-catch to handle potential errors with useAuth
  let authData = {
    currentUser: null,
    loading: true,
    hasPermission: () => false,
    isAdmin: false,
    isVerifiedAdmin: false
  };
  
  try {
    authData = useAuth();
  } catch (err) {
    console.error("Error in ProtectedRoute:", err);
    setError(err instanceof Error ? err : new Error(String(err)));
    // Redirect to login if there's an auth error
    return <Navigate to="/login" />;
  }
  
  const { currentUser, loading, hasPermission, isAdmin, isVerifiedAdmin } = authData;

  // If there's an error, show a fallback UI
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-4">
            There was a problem with authentication. Please try logging in again.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-pet-primary text-white py-2 px-4 rounded hover:bg-pet-primary-dark transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pet-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if the route is admin-only
  if (adminOnly) {
    // First check if user is an admin
    if (!isAdmin) {
      return <Navigate to="/" />;
    }
    
    // Then check if verification is required and if admin is verified
    if (requireVerification && !isVerifiedAdmin) {
      return <Navigate to="/profile" />;
    }
  }

  // Check if user has required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" />;
  }

  return (
    <ErrorBoundary>
      <Layout>{children}</Layout>
    </ErrorBoundary>
  );
};

export default ProtectedRoute;
