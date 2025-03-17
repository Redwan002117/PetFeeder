import { useState, useEffect } from 'react';

interface UseMobileNavResult {
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const useMobileNav = (breakpoint = 768): UseMobileNavResult => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      // Initial check
      setIsMobile(window.innerWidth < breakpoint);

      // Add resize listener
      const handleResize = () => {
        const mobile = window.innerWidth < breakpoint;
        setIsMobile(mobile);
        
        // Close the sidebar on larger screens
        if (!mobile) {
          setIsOpen(false);
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [breakpoint]);

  return {
    isMobile,
    isOpen,
    setIsOpen
  };
};

export default useMobileNav;
