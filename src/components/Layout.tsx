
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Utensils,
  Wifi, 
  LogOut,
  User
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, to, active }) => {
  return (
    <Link
      to={to}
      className={`flex items-center py-3 px-4 rounded-md transition-colors ${
        active
          ? "bg-pet-primary text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <div className="mr-3">{icon}</div>
      <span>{text}</span>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const sidebarItems = [
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
      icon: <User size={20} />,
      text: "Profile",
      to: "/profile",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="p-4 flex items-center space-x-2 border-b">
          <div className="bg-pet-primary p-1 rounded-md">
            <span className="text-white text-xl">🐱</span>
          </div>
          <span className="font-bold text-lg">PetFeeder</span>
        </div>
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
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
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
