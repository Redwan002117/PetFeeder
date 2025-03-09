import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface ThemeToggleProps {
  variant?: 'icon' | 'switch';
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'icon',
  showLabel = false 
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { toast } = useToast();

  const handleToggle = () => {
    toggleDarkMode();
    toast({
      title: darkMode ? "Light Mode Enabled" : "Dark Mode Enabled",
      description: `The application theme has been updated.`,
    });
  };

  if (variant === 'switch') {
    return (
      <div className="flex items-center space-x-2">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {darkMode ? 'Dark' : 'Light'} Mode
          </span>
        )}
        <div className="flex items-center space-x-2">
          <Sun className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`} />
          <Switch
            checked={darkMode}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-indigo-600"
          />
          <Moon className={`h-4 w-4 ${darkMode ? 'text-indigo-400' : 'text-gray-400'}`} />
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="rounded-full w-9 h-9 p-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      {darkMode ? (
        <Moon className="h-5 w-5 text-indigo-400 transition-all duration-300 rotate-12" />
      ) : (
        <Sun className="h-5 w-5 text-amber-500 transition-all duration-300 rotate-12" />
      )}
    </Button>
  );
};

export default ThemeToggle; 