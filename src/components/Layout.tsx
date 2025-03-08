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
  Settings
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileAvatar from "@/components/ProfileAvatar";
import ErrorBoundary from "@/components/ErrorBoundary";

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
          : "text-gray-600 hover:bg-gray-100"
      }`}
      onClick={onClick}
    >
      <div className="mr-3">{icon}</div>
      <span>{text}</span>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin, currentUser } = useAuth();
  const [open, setOpen] = React.useState(false);
  const user = currentUser as ExtendedUser;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Regular user navigation items
  const regularItems: NavigationItem[] = [
    {
      icon: <LayoutDashboard size={20} />,
      text: "Dashboard",
      to: "/",
    },
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
    {
      icon: <UserIcon size={20} />,
      text: "Profile",
      to: "/profile",
    },
  ];

  // Admin-only navigation items
  const adminItems: NavigationItem[] = [
    {
      icon: <Shield size={20} />,
      text: "Admin Dashboard",
      to: "/admin",
    }
  ];

  // Determine which items to show based on user role
  const sidebarItems = isAdmin 
    ? [...regularItems, ...adminItems] 
    : regularItems;

  // Filter out hidden items
  const visibleItems = sidebarItems.filter(item => !item.hidden);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 p-2 flex items-center justify-between">
        <div className="flex items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-1 mr-2 hover:bg-gray-100 rounded-md transition-colors">
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-3 flex items-center space-x-2 border-b">
                <div className="bg-pet-primary p-1 rounded-md">
                  <span className="text-white text-xl">🐱</span>
                </div>
                <span className="font-bold text-base">PetFeeder</span>
              </div>
              <nav className="p-3 space-y-1">
                {visibleItems.map((item) => (
                  <SidebarItem
                    key={item.to}
                    icon={item.icon}
                    text={item.text}
                    to={item.to}
                    active={location.pathname === item.to}
                    onClick={() => setOpen(false)}
                  />
                ))}
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="flex items-center py-3 px-4 rounded-md transition-colors text-gray-600 hover:bg-gray-100 w-full text-left"
                >
                  <div className="mr-3">
                    <LogOut size={20} />
                  </div>
                  <span>Logout</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center space-x-2">
            <div className="bg-pet-primary p-1 rounded-md">
              <span className="text-white text-sm">🐱</span>
            </div>
            <span className="font-bold text-sm">PetFeeder</span>
          </div>
        </div>
        <Link to="/profile">
          <ErrorBoundary>
            <ProfileAvatar user={currentUser} size="sm" className="w-8 h-8" />
          </ErrorBoundary>
        </Link>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 border-r border-gray-200 bg-white">
          <div className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center space-x-2">
              <div className="bg-pet-primary p-1 rounded-md">
                <span className="text-white text-xl">🐱</span>
              </div>
              <span className="font-bold text-lg">PetFeeder</span>
            </div>
            <Link to="/profile">
              <ErrorBoundary>
                <ProfileAvatar user={currentUser} size="sm" />
              </ErrorBoundary>
            </Link>
          </div>
          <nav className="p-4 space-y-1">
            {visibleItems.map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                text={item.text}
                to={item.to}
                active={location.pathname === item.to}
              />
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center py-3 px-4 rounded-md transition-colors text-gray-600 hover:bg-gray-100 w-full text-left"
            >
              <div className="mr-3">
                <LogOut size={20} />
              </div>
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto p-3 md:p-4">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
