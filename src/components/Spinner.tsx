import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  withText?: boolean;
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  className = "",
  withText = false,
  text = "Loading..."
}) => {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
      {withText && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

export default Spinner;