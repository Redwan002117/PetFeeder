
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarTrigger,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import { 
  Home, 
  Clock, 
  HandPlatter, 
  Wifi, 
  BarChart, 
  LogOut, 
  Bell, 
  Menu 
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/schedule", icon: Clock, label: "Feeding Schedule" },
    { path: "/manual-feed", icon: HandPlatter, label: "Manual Feed" },
    { path: "/connectivity", icon: Wifi, label: "Connectivity" },
    { path: "/statistics", icon: BarChart, label: "Statistics" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-pet-primary rounded-md flex items-center justify-center">
                <HandPlatter className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold">PetFeeder</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <Link to={item.path} className={location.pathname === item.path ? "text-pet-primary" : ""}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="bg-white border-b">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <SidebarTrigger>
                  <Menu className="h-6 w-6" />
                </SidebarTrigger>
                <h1 className="ml-4 text-xl font-medium">
                  {menuItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
                </h1>
              </div>
              <Button size="sm" variant="outline">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
