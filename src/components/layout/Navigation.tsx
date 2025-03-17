import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { 
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui";
import { 
  Bell, 
  LogOut, 
  User, 
  Settings,
  Menu,
  Home,
  Calendar,
  BarChart2, 
  Wifi,
  Shield,
  HandPlatter
} from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import ThemeToggle from "@/components/ThemeToggle";

interface NavigationProps {
  toggleSidebar?: () => void;
  showMenuButton?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ 
  toggleSidebar,
  showMenuButton = false
}) => {
  const { pathname } = useLocation();
  const { currentUser, logout, isAdmin } = useAuth();
  const { notifications, markAllAsRead, unreadCount } = useNotifications();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center">
        {showMenuButton && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
        
        <div className="hidden md:flex items-center">
          <HandPlatter className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-lg">PetFeeder</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Navigation links for larger screens */}
        <nav className="hidden md:flex items-center space-x-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className={pathname === "/" ? "text-primary" : ""}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/schedule" className={pathname.startsWith("/schedule") ? "text-primary" : ""}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/statistics" className={pathname.startsWith("/statistics") ? "text-primary" : ""}>
              <BarChart2 className="h-4 w-4 mr-2" />
              Statistics
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin" className={pathname.startsWith("/admin") ? "text-primary" : ""}>
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Link>
            </Button>
          )}
        </nav>
        
        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2">
              <span className="text-sm font-medium">Notifications</span>
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-auto text-xs py-1"
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <DropdownMenuItem key={notification.id} className={cn(
                    "p-3 cursor-default",
                    !notification.read && "bg-muted/50"
                  )}>
                    <div>
                      <div className="font-medium mb-1">{notification.title}</div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No notifications
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Theme toggle */}
        <ThemeToggle />
        
        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ProfileAvatar user={currentUser} size="sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start p-2">
              <div className="flex items-center space-x-2">
                <ProfileAvatar user={currentUser} size="sm" />
                <div className="flex flex-col">
                  <p className="text-sm font-medium truncate max-w-[180px]">
                    {currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer flex items-center">
                <User className="mr-2 h-4 w-4" />
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
      </div>
    </header>
  );
};

export default Navigation;