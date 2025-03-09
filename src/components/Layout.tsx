import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "firebase/auth";
import Footer from "@/components/Footer";
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Utensils,
  Wifi, 
  LogOut,
  User as UserIcon,
  Menu,
  Shield,
  Settings,
  FileText,
  HandPlatter
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileAvatar from "@/components/ProfileAvatar";
import ErrorBoundary from "@/components/ErrorBoundary";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  active: boolean;
  onClick?: () => void;
}

interface NavigationItem {
  icon: React.ReactNode;
  text: string;
  to: string;
  hidden?: boolean;
}

interface NavigationCategory {
  title: string;
  items: NavigationItem[];
}

interface ExtendedUser extends User {
  deviceId?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, to, active, onClick }) => {
  return (
    <Link
      to={to}
      className={`flex items-center py-3 px-4 rounded-md transition-colors ${
        active
          ? "bg-pet-primary text-white"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      onClick={onClick}
    >
      <div className="mr-3">{icon}</div>
      <span>{text}</span>
    </Link>
  );
};

const SidebarCategory: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  return (
    <div className="mb-4">
      <div className="px-4 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin, currentUser } = useAuth();
  const [open, setOpen] = React.useState(false);
  const user = currentUser as ExtendedUser;

  // Function to check if a route is active
  const isRouteActive = (path: string) => {
    // Exact match for home page
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    // For other pages, check if the pathname starts with the path (for nested routes)
    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Define navigation categories
  const navigationCategories: NavigationCategory[] = [
    {
      title: "Main",
      items: [
        {
          icon: <LayoutDashboard size={20} />,
          text: "Home",
          to: "/",
        },
        {
          icon: <LayoutDashboard size={20} />,
          text: "Dashboard",
          to: "/dashboard",
        },
      ],
    },
    {
      title: "Feeding",
      items: [
        {
          icon: <Calendar size={20} />,
          text: "Schedule",
          to: "/schedule",
        },
        {
          icon: <Utensils size={20} />,
          text: "Manual Feed",
          to: "/manual-feed",
        },
        {
          icon: <BarChart3 size={20} />,
          text: "Statistics",
          to: "/statistics",
        },
        {
          icon: <FileText size={20} />,
          text: "Food Levels",
          to: "/food-levels",
        },
      ],
    },
    {
      title: "Device",
      items: [
        {
          icon: <Wifi size={20} />,
          text: "Connectivity",
          to: "/connectivity",
        },
        {
          icon: <Settings size={20} />,
          text: "Device Settings",
          to: `/device/${user?.deviceId || ''}`,
          hidden: !user?.deviceId,
        },
      ],
    },
    {
      title: "Help",
      items: [
        {
          icon: <FileText size={20} />,
          text: "Documentation",
          to: "/documentation",
        },
      ],
    },
  ];

  // Add admin category if user is admin
  if (isAdmin) {
    navigationCategories.push({
      title: "Admin",
      items: [
        {
          icon: <Shield size={20} />,
          text: "Admin Dashboard",
          to: "/admin",
        },
      ],
    });
  }

  // Render sidebar content with categories
  const renderSidebarContent = (onClick?: () => void) => (
    <>
      {navigationCategories.map((category) => {
        const visibleItems = category.items.filter((item) => !item.hidden);
        if (visibleItems.length === 0) return null;

        return (
          <SidebarCategory key={category.title} title={category.title}>
            {visibleItems.map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                text={item.text}
                to={item.to}
                active={isRouteActive(item.to)}
                onClick={onClick}
              />
            ))}
          </SidebarCategory>
        );
      })}
    </>
  );

  // Profile dropdown component
  const ProfileDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none">
          <ErrorBoundary>
            <ProfileAvatar user={currentUser} size="sm" />
          </ErrorBoundary>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start p-2">
          <div className="flex items-center space-x-2">
            <ProfileAvatar user={currentUser} size="sm" />
            <div className="flex flex-col">
              <p className="text-sm font-medium truncate max-w-[180px]">{currentUser?.displayName || 'User'}</p>
              <p className="text-xs text-gray-500 truncate max-w-[180px]">{currentUser?.email}</p>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-1 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <Menu size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-pet-primary rounded-full flex items-center justify-center">
                      <HandPlatter className="text-white h-5 w-5" />
                    </div>
                    <span className="font-bold text-lg dark:text-white">PetFeeder</span>
                  </div>
                </div>
              </div>
              <nav className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                {renderSidebarContent(() => setOpen(false))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-pet-primary rounded-full flex items-center justify-center">
              <HandPlatter className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-lg dark:text-white">PetFeeder</span>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <ProfileDropdown />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 sticky top-0 h-screen overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-pet-primary rounded-full flex items-center justify-center mr-2">
                <HandPlatter className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">PetFeeder</span>
            </Link>
          </div>
          <nav className="space-y-4">
            {renderSidebarContent()}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto">
          <div className="hidden md:flex items-center justify-end p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <ProfileDropdown />
            </div>
          </div>
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
