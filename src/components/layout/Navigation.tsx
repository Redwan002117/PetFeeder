import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  PawPrint,
  LayoutDashboard,
  Calendar,
  LineChart,
  Crown,
  Users,
  Bot,
  FileText,
  BarChart,
  HandPlatter,
  Wifi,
  HelpCircle
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { name: 'Pet Profiles', path: '/pet-profiles', icon: <PawPrint className="h-5 w-5" /> },
  { name: 'Feeding Schedule', path: '/schedule', icon: <Calendar className="h-5 w-5" /> },
  { name: 'Manual Feed', path: '/manual-feed', icon: <HandPlatter className="h-5 w-5" /> },
  { name: 'Food Levels', path: '/food-levels', icon: <LineChart className="h-5 w-5" /> },
  { name: 'Statistics', path: '/statistics', icon: <BarChart className="h-5 w-5" /> },
  { name: 'Connectivity', path: '/connectivity', icon: <Wifi className="h-5 w-5" /> },
  { name: 'Help', path: '/documentation', icon: <HelpCircle className="h-5 w-5" /> },
  { name: 'Admin Dashboard', path: '/admin', icon: <Crown className="h-5 w-5" />, adminOnly: true },
  { name: 'User Management', path: '/admin/users', icon: <Users className="h-5 w-5" />, adminOnly: true },
  { name: 'Device Management', path: '/admin/devices', icon: <Bot className="h-5 w-5" />, adminOnly: true },
  { name: 'System Logs', path: '/admin/logs', icon: <FileText className="h-5 w-5" />, adminOnly: true },
  { name: 'Analytics', path: '/admin/analytics', icon: <BarChart className="h-5 w-5" />, adminOnly: true },
];

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  // Only show admin items if the user is an admin
  const filteredNavItems = navItems.filter(item => !item.adminOnly || (item.adminOnly && isAdmin));

  const isActive = (path: string) => {
    // For exact matches
    if (location.pathname === path) return true;

    // For nested routes (e.g., /admin/users should highlight /admin)
    if (path !== '/' && location.pathname.startsWith(path)) return true;

    // Special case for dashboard
    if (path === '/dashboard' && location.pathname === '/') return true;

    return false;
  };

  return (
    <nav className="bg-white shadow-lg dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <PawPrint className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
                <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">PetFeeder</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {filteredNavItems.slice(0, 6).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    isActive(item.path)
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}

              {/* More dropdown for additional items */}
              {filteredNavItems.length > 6 && (
                <div className="relative group">
                  <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    <span className="mr-2">•••</span>
                    More
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50">
                    {filteredNavItems.slice(6).map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`${
                          isActive(item.path)
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        } block px-4 py-2 text-sm`}
                      >
                        <span className="inline-flex items-center">
                          <span className="mr-2">{item.icon}</span>
                          {item.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${
                isActive(item.path)
                  ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-800 dark:hover:text-white'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              <span className="inline-flex items-center">
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}; 