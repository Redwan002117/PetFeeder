import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PawPrint, Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <PawPrint size={80} className="text-indigo-500 dark:text-indigo-400" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              404
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Oops! Page Not Found</h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          Looks like your pet wandered off to a page that doesn't exist.
        </p>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The page <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-red-500">{location.pathname}</span> could not be found.
          </p>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            This might be because:
          </p>
          
          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-2 mb-4">
            <li>The page has been moved or deleted</li>
            <li>You typed the address incorrectly</li>
            <li>The link you followed might be outdated</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" className="flex items-center gap-2">
            <Link to="/">
              <Home size={18} />
              Return Home
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link to="/dashboard">
              <ArrowLeft size={18} />
              Go to Dashboard
            </Link>
          </Button>
          
          <Button asChild variant="secondary" className="flex items-center gap-2">
            <Link to="/documentation">
              <Search size={18} />
              Browse Documentation
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
