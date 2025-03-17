import { User } from "@supabase/supabase-js";

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  isVerifiedAdmin: boolean;
  checkingSession?: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string, isAdmin?: boolean, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: { displayName?: string, photoURL?: string }) => Promise<void>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  sendVerificationEmailToUser: () => Promise<void>;
  checkVerificationStatus: () => Promise<void>;
  registerUser: (email: string, password: string, name: string, username: string) => Promise<User>;
  databaseAvailable: boolean;
}

interface UserData {
  role: 'admin' | 'user';
  permissions: UserPermissions;
  email: string;
  emailVerified?: boolean;
  deviceId?: string;
  name?: string;
  username?: string;
}

interface DeviceContextType {
  devices: Device[];
  selectedDevice: Device | null;
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  selectDevice: (deviceId: string | null) => void;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  databaseAvailable: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: number;
  link?: string;
}

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}
