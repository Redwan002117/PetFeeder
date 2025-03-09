import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import ManualFeed from './pages/ManualFeed';
import Statistics from './pages/Statistics';
import Connectivity from './pages/Connectivity';
import Documentation from './pages/Documentation';
import AdminDashboard from './pages/AdminDashboard';
import DeviceManagement from './pages/DeviceManagement';
import NotFound from './pages/NotFound';
import VerifyEmail from './pages/VerifyEmail';
import UsernameSetup from './pages/UsernameSetup';
import Settings from './pages/Settings';
import FoodLevels from './pages/FoodLevels';
import PetProfiles from './pages/PetProfiles';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { DeviceProvider } from './contexts/DeviceContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useEffect } from 'react';

// Determine if we're using a custom domain by checking if we're at the root path
const isCustomDomain = window.location.pathname.indexOf('/PetFeeder') === -1;
const Router = isCustomDomain ? BrowserRouter : HashRouter;

export function AppRouter() {
  // Apply dark mode class based on localStorage preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DeviceProvider>
            <Router>
              <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/username-setup" element={<UsernameSetup />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/schedule" element={
                    <ProtectedRoute requiredPermission="canSchedule">
                      <Schedule />
                    </ProtectedRoute>
                  } />
                  <Route path="/manual-feed" element={
                    <ProtectedRoute requiredPermission="canFeed">
                      <ManualFeed />
                    </ProtectedRoute>
                  } />
                  <Route path="/statistics" element={
                    <ProtectedRoute requiredPermission="canViewStats">
                      <Statistics />
                    </ProtectedRoute>
                  } />
                  <Route path="/connectivity" element={
                    <ProtectedRoute>
                      <Connectivity />
                    </ProtectedRoute>
                  } />
                  <Route path="/device/:deviceId" element={
                    <ProtectedRoute>
                      <DeviceManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/food-levels" element={
                    <ProtectedRoute>
                      <FoodLevels />
                    </ProtectedRoute>
                  } />
                  <Route path="/pets" element={
                    <ProtectedRoute>
                      <PetProfiles />
                    </ProtectedRoute>
                  } />
                  <Route path="/pet-profiles" element={
                    <ProtectedRoute>
                      <PetProfiles />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* 404 route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster position="top-right" />
              </div>
            </Router>
          </DeviceProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 