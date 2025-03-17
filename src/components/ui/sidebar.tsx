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
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";

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

  // Filter out items that shouldn't be visible
  const visibleItems = sidebarItems.filter(item => item.visible);

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-40 h-full w-64 bg-background border-r border-border transition-transform duration-300",
      isMobile && (isOpen ? "translate-x-0" : "-translate-x-full")
    )}>
      <div className="h-16 flex items-center justify-center border-b">
        <Link to="/" className="flex items-center space-x-2 font-bold text-lg">
          <HandPlatter className="h-6 w-6 text-primary" />
          <span>PetFeeder</span>
        </Link>
      </div>
      
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="px-3 py-4">
          <nav className="space-y-1 mb-6">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => isMobile && setIsOpen(false)}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>

          <Separator className="my-4" />

          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
