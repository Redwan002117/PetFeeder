
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: "canFeed" | "canSchedule" | "canViewStats";
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  adminOnly = false
}) => {
  const { currentUser, loading, hasPermission, isAdmin } = useAuth();

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
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  // Check if user has required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
