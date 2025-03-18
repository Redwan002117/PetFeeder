import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { useMobileNav } from "@/hooks/use-mobile";

/**
 * Layout component that wraps content
 * @param {React.PropsWithChildren} props - Component props with children
 */
const Layout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className='flex h-screen bg-gray-100 dark:bg-gray-900'>
      {/* Sidebar */}
      <div className='w-64 bg-white dark:bg-gray-800 shadow-lg'>
        <div className='p-4'>
          <h1 className='text-2xl font-bold text-primary'>Pet Feeder</h1>
        </div>
        <nav className='mt-6'>
          <Link
            to='/'
            className={`flex items-center px-4 py-2 ${
              location.pathname === '/' 
                ? 'bg-primary bg-opacity-10 text-primary' 
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            <span>Dashboard</span>
          </Link>
          <Link
            to='/feeding-schedule'
            className={`flex items-center px-4 py-2 ${
              location.pathname === '/feeding-schedule' 
                ? 'bg-primary bg-opacity-10 text-primary' 
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            <span>Feeding Schedule</span>
          </Link>
          <Link
            to='/settings'
            className={`flex items-center px-4 py-2 ${
              location.pathname === '/settings' 
                ? 'bg-primary bg-opacity-10 text-primary' 
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            <span>Settings</span>
          </Link>
          <Link
            to='/profile'
            className={`flex items-center px-4 py-2 ${
              location.pathname === '/profile' 
                ? 'bg-primary bg-opacity-10 text-primary' 
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            <span>Profile</span>
          </Link>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className='flex-1 overflow-y-auto'>
        <main>
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default Layout;
