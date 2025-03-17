import React from "react";
import Sidebar from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useMobileNav } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isMobile, isOpen, setIsOpen } = useMobileNav();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      )}

      <div
        className={cn(
          "transition-all duration-300",
          isMobile ? "ml-0" : "ml-64",
          isOpen && isMobile && "ml-64"
        )}
      >
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
};

export default Layout;