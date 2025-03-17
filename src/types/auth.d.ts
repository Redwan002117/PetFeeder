/**
 * Type definitions for Supabase Auth
 */
import { User } from "@supabase/supabase-js";

// Extend User with common fields we need
declare module '@supabase/supabase-js' {
  interface User {
    uid?: string; // Compatibility property that returns the user's id
    displayName?: string; // Compatibility property that returns user_metadata.name
    emailVerified?: boolean; // Compatibility property that returns user_metadata.email_verified

    // Add convenience methods for compatibility
    reload?: () => Promise<void>;
  }

  // Fix admin.listUserSessions method
  interface GoTrueAdminApi {
    listUserSessions: (userId: string) => Promise<{
      data: any;
      error: any;
    }>;
  }
}

// Result types for our API calls
interface AuthResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
}

interface EmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Type for auth context
interface AuthContextType {
  currentUser: User | null;
  userData: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVerifiedAdmin: boolean;
  checkingSession?: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string, isAdmin?: boolean, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  sendVerificationEmail: () => Promise<EmailResult>;
  checkVerificationStatus: () => Promise<boolean>;
  databaseAvailable: boolean;
}
