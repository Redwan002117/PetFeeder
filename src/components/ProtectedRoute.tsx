import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  adminOnly = false
}) => {
  const { currentUser, loading, isAdmin, isVerifiedAdmin, hasPermission } = useAuth();

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no user is logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check for admin access if required
  if (adminOnly) {
    // If admin verification is required and user is not a verified admin
    const isAuthorizedAdmin = adminOnly === true ? isVerifiedAdmin : isAdmin;
    
    if (!isAuthorizedAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check for required permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;
