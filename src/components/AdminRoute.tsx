import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './ui/spinner';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return <Spinner size="md" className="mx-auto my-12" />;
  }

  // Check if user is an admin
  if (!currentUser || !userData || userData.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
} 