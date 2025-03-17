import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { useMobileNav } from "@/hooks/use-mobile";

/**
 * Layout component that wraps content
 * @param {React.PropsWithChildren} props - Component props with children
 */
const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { loading } = useAuth();
  const { isMobile, isOpen } = useMobileNav();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isMobile ? "ml-0" : "ml-64",
          isOpen && isMobile && "ml-64"
        )}
      >
        <main className="min-h-screen p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      
      <Toaster />
    </div>
  );
};

export default Layout;
