import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if user is an admin (you might want to add this field to your user object)
  if (!user || !user.email?.endsWith('@admin.com')) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
} 