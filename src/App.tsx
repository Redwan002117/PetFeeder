import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminRegister from "@/pages/AdminRegister";
import VerifyEmail from "@/pages/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import Schedule from "@/pages/Schedule";
import ManualFeed from "@/pages/ManualFeed";
import Statistics from "@/pages/Statistics";
import Connectivity from "@/pages/Connectivity";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import UsernameSetup from "@/pages/UsernameSetup";
import "./App.css";

// Get the base URL from the environment or use a default
// For custom domain, we want to use '/' as the base URL
const basename = '/';

function App() {
  return (
    <ErrorBoundary>
      <Router basename={basename}>
        <ErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-register" element={<AdminRegister />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/username-setup" element={<UsernameSetup />} />
                <Route
                  path="/"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute requiredPermission="canSchedule">
                        <Schedule />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/manual-feed"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute requiredPermission="canFeed">
                        <ManualFeed />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/statistics"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute requiredPermission="canViewStats">
                        <Statistics />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/connectivity"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute>
                        <Connectivity />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute adminOnly={true} requireVerification={true}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
