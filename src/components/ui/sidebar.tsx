
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Clock,
  HandPlatter,
  BarChart2,
  Wifi,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";
import { useMobileNav } from "@/hooks/use-mobile";

const Sidebar = () => {
  const { pathname } = useLocation();
  const { logout, currentUser, isAdmin, hasPermission } = useAuth();
  const { toast } = useToast();
  const { isMobile, isOpen, setIsOpen } = useMobileNav();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sidebarItems = [
    {
      title: "Dashboard",
      icon: <Home size={20} />,
      href: "/",
      visible: true,
    },
    {
      title: "Schedule",
      icon: <Clock size={20} />,
      href: "/schedule",
      visible: hasPermission("canSchedule"),
    },
    {
      title: "Manual Feed",
      icon: <HandPlatter size={20} />,
      href: "/manual-feed",
      visible: hasPermission("canFeed"),
    },
    {
      title: "Statistics",
      icon: <BarChart2 size={20} />,
      href: "/statistics",
      visible: hasPermission("canViewStats"),
    },
    {
      title: "Connectivity",
      icon: <Wifi size={20} />,
      href: "/connectivity",
      visible: true,
    },
    {
      title: "Profile",
      icon: <User size={20} />,
      href: "/profile",
      visible: true,
    },
    {
      title: "Admin",
      icon: <Shield size={20} />,
      href: "/admin",
      visible: isAdmin,
    },
  ];

  const navContent = (
    <div className="h-full flex flex-col py-4">
      <div className="flex items-center justify-center py-3">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-pet-primary flex items-center justify-center">
            <HandPlatter size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold">PetFeeder</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col flex-1 overflow-hidden">
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {sidebarItems
            .filter((item) => item.visible)
            .map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent/50"
                )}
                onClick={() => isMobile && setIsOpen(false)}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
        </nav>

        <div className="mt-auto px-3 py-2">
          <div className="mb-2 flex items-center px-2 py-1.5">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium uppercase">
                {currentUser?.email?.[0] || "U"}
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {currentUser?.email || "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {isAdmin ? "Administrator" : "User"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
        <div className="flex-1 flex flex-col min-h-0 border-r bg-background">
          {navContent}
        </div>
      </div>

      {/* Mobile sidebar */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 z-20 transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              "absolute top-0 left-0 bottom-0 w-64 bg-background transition-transform duration-200 ease-in-out",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
