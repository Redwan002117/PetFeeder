import { ReactNode } from 'react';

// Declare types for components that might be causing errors
declare namespace Components {
  interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: ReactNode;
  }

  interface DatabaseStatusProps {
    onStatusChange?: (isAvailable: boolean) => void;
  }

  interface ProfileAvatarProps {
    user: any;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
  }
  
  interface ProtectedRouteProps {
    children: ReactNode;
    requiredPermission?: keyof UserPermissions;
    adminOnly?: boolean;
  }
  
  interface ScheduleFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    deviceId: string;
    minFeedAmount?: number;
    maxFeedAmount?: number;
  }

  interface DeviceFeedControlProps {
    deviceId: string;
    disabled?: boolean;
    onFeedSuccess?: () => void;
  }
  
  interface DeviceSettingsFormProps {
    deviceId: string;
    initialSettings?: DeviceSettings;
    onSaved?: () => void;
  }
  
  interface GoogleSignInButtonProps {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  }

  interface AdminOnlySettingsProps {}

  interface DeviceWiFiConfigProps {
    deviceId?: string;
  }
  
  interface FeedingHistoryChartProps {
    history: FeedingEvent[];
    loading?: boolean;
  }
  
  interface DeviceStatusBadgeProps {
    status: 'online' | 'offline' | 'error' | 'maintenance' | 'new' | string;
    className?: string;
  }

  interface SpinnerProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
    withText?: boolean;
    text?: string;
  }

  interface BadgeProps {
    variant?: "default" | "destructive" | "outline" | "secondary";
    className?: string;
    children: ReactNode;
  }
}

export = Components;
export as namespace Components;
