import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 24, className = '' }) => {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[100px]">
      <Loader2 
        className={`animate-spin text-primary ${className}`} 
        size={size} 
      />
    </div>
  );
};

export default Spinner; 