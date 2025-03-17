/**
 * Mock declarations for third-party libraries
 * This helps with TypeScript compilation when we don't need the full functionality
 */

// Sonner toast
declare module 'sonner' {
  export const Toaster: React.FC<any>;
  export const toast: any;
}

// Next-themes
declare module 'next-themes' {
  export const useTheme: () => {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    themes: string[];
  };
}

// React-day-picker
declare module 'react-day-picker' {
  export const DayPicker: React.FC<any>;
}

// Radix UI
declare module '@radix-ui/react-aspect-ratio' {
  export const AspectRatio: React.FC<any>;
}

declare module '@radix-ui/react-toggle-group' {
  export const Root: React.FC<any>;
  export const Item: React.FC<any>;
}

declare module '@radix-ui/react-tooltip' {
  export const Provider: React.FC<any>;
  export const Root: React.FC<any>;
  export const Trigger: React.FC<any>;
  export const Content: React.FC<any>;
}

// UUID
declare module 'uuid' {
  export function v4(): string;
}

// React-easy-crop
declare module 'react-easy-crop' {
  interface Position {
    x: number;
    y: number;
  }
  
  interface Area {
    width: number;
    height: number;
    x: number;
    y: number;
  }

  interface CropperProps {
    image: string;
    crop: Position;
    zoom: number;
    aspect: number;
    onCropChange: (position: Position) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
    [key: string]: any;
  }

  const Cropper: React.FC<CropperProps>;
  export default Cropper;
}

// CMDK
declare module 'cmdk' {
  export const Command: React.FC<any> & {
    Dialog: React.FC<any>;
    Input: React.FC<any>;
    List: React.FC<any>;
    Empty: React.FC<any>;
    Group: React.FC<any>;
    Item: React.FC<any>;
    Separator: React.FC<any>;
  };
}

// Embla Carousel
declare module 'embla-carousel-react' {
  export const useEmblaCarousel: any;
}

// Vaul
declare module 'vaul' {
  export const Drawer: React.FC<any> & {
    Portal: React.FC<any>;
    Overlay: React.FC<any>;
    Content: React.FC<any>;
    Header: React.FC<any>;
    Title: React.FC<any>;
    Description: React.FC<any>;
    Close: React.FC<any>;
    Footer: React.FC<any>;
  };
}

// Input OTP
declare module 'input-otp' {
  export const OTPInput: React.FC<any>;
  export const OTPInputContext: React.Context<any>;
}

// React-resizable-panels
declare module 'react-resizable-panels' {
  export const Panel: React.FC<any>;
  export const PanelGroup: React.FC<any>;
  export const PanelResizeHandle: React.FC<any>;
}

// React-hot-toast
declare module 'react-hot-toast' {
  export const Toaster: React.FC<any>;
  export const toast: any;
}
