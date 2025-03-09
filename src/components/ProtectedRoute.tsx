import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useState, useEffect, Children, isValidElement } from "react";

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
      return <Navigate to="/dashboard" />;
    }
    
    // Then check if verification is required and if admin is verified
    if (requireVerification && !isVerifiedAdmin) {
      // Show a warning instead of redirecting to profile
      return (
        <ErrorBoundary>
          <Layout>
            <div className="container mx-auto py-8">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Your admin account requires email verification. Please check your profile page to verify your email.
                    </p>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          onClick={() => window.location.href = '/profile'}
                          className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                        >
                          Go to Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {children}
            </div>
          </Layout>
        </ErrorBoundary>
      );
    }
  }

  // Check if user has required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" />;
  }

  return (
    <ErrorBoundary>
      <Layout>
        {children}
      </Layout>
    </ErrorBoundary>
  );
};

export default ProtectedRoute;
