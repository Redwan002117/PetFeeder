import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  supabase,
  signIn as supabaseSignIn,
  signOut as supabaseSignOut,
  updatePassword as supabaseUpdatePassword,
  updateUserProfile as supabaseUpdateUserProfile,
  deleteUserAccount as supabaseDeleteUserAccount,
  getUserData as supabaseGetUserData,
  signInWithGoogle as supabaseSignInWithGoogle,
  sendVerificationEmail as supabaseSendVerificationEmail,
  registerUser as supabaseRegisterUser,
  handleRedirectResult
} from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from '@supabase/supabase-js';

interface UserPermissions {
  canFeed: boolean;
  canSchedule: boolean;
  canViewStats: boolean;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Add a console log to debug admin status
const checkAdminStatus = (userData: UserData | null) => {
  const isAdmin = userData?.role === 'admin';
  console.log('Admin status check:', { 
    userData, 
    role: userData?.role, 
    isAdmin,
    emailVerified: userData?.emailVerified
  });
  
  // Always return true for admin@example.com for testing purposes
  if (userData?.email === 'admin@example.com') {
    console.log('Admin override for test account');
    return true;
  }
  
  return isAdmin;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [databaseAvailable, setDatabaseAvailable] = useState<boolean>(true);
  const { toast } = useToast();

  // Effect to handle auth state changes and redirect results
  useEffect(() => {
    // Check for redirect result first (for OAuth flows)
    const checkRedirectResult = async () => {
      try {
        const redirectResult = await handleRedirectResult();
        if (redirectResult.success && redirectResult.user) {
          console.log('Successfully handled redirect result');
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };
    
    checkRedirectResult();
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user ? `User ${session.user.id}` : 'No user');
        
        setCurrentUser(session?.user || null);
        
        if (session?.user) {
          try {
            await fetchUserData(session.user);
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Set default user data if fetching fails
            setUserData({
              role: 'user',
              permissions: {
                canFeed: true,
                canSchedule: true,
                canViewStats: true
              },
              email: session.user.email || '',
              emailVerified: session.user.email_confirmed_at ? true : false
            });
          }
        } else {
          setUserData(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchUserData(session.user);
      }
      setLoading(false);
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to fetch user data from Supabase
  const fetchUserData = async (user: User) => {
    try {
      // Fetch user profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Get user permissions
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (permissionsError && permissionsError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" which just means no custom permissions set
          console.warn('Error fetching permissions:', permissionsError);
        }
        
        // Default permissions if none found
        const permissions = permissionsData?.permissions || {
          canFeed: true,
          canSchedule: true,
          canViewStats: true
        };
        
        // Update user data in state
        setUserData({
          role: data.is_admin ? 'admin' : 'user',
          email: user.email || data.email || '',
          username: data.username,
          name: data.full_name,
          permissions,
          emailVerified: user.email_confirmed_at ? true : false
        });
        
        setDatabaseAvailable(true);
      } else {
        // Create default user data
        const newUserData = {
          role: 'user' as 'user',
          permissions: {
            canFeed: true,
            canSchedule: true,
            canViewStats: true
          },
          email: user.email || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          emailVerified: user.email_confirmed_at ? true : false
        };
        
        setUserData(newUserData);
        
        // Create profile record if it doesn't exist
        await supabase.from('profiles').insert([{
          id: user.id,
          username: newUserData.username,
          full_name: newUserData.name,
          email: user.email,
          is_admin: false,
          last_login: new Date().toISOString()
        }]);
        
        setDatabaseAvailable(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Set default user data if database is unavailable
      setUserData({
        role: 'user',
        permissions: {
          canFeed: true,
          canSchedule: true,
          canViewStats: true
        },
        email: user.email || '',
        emailVerified: user.email_confirmed_at ? true : false
      });
      
      setDatabaseAvailable(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const user = await supabaseSignIn(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      return user;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Clear any previous auth state
      localStorage.removeItem('authMode');
      
      // Call the signInWithGoogle function
      const result = await supabaseSignInWithGoogle();
      
      if (result.success) {
        if (result.redirect) {
          // If redirecting, show a message
          toast({
            title: "Redirecting to Google",
            description: "Please complete the sign-in process.",
          });
        } else {
          // If successful popup sign-in
          toast({
            title: "Login successful",
            description: "Welcome!",
          });
        }
      } else {
        throw new Error("Google login failed");
      }
    } catch (error: any) {
      // Use the user-friendly error message if available
      const errorMessage = error.message || "Google login failed";

      toast({
        title: "Google login failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Log the error for debugging
      console.error("Google login error:", error);

      throw error;
    }
  };

  const register = async (email: string, password: string, username: string, isAdmin: boolean = false, name: string = username) => {
    try {
      if (isAdmin) {
        // Handle admin registration separately
        // This should be updated to use a different function or approach
        throw new Error("Admin registration is not supported through this method");
      } else {
        // For regular users, use the registerUser function
        await supabaseRegisterUser(email, password, name, username);
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabaseSignOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateUserProfile = async (profileData: { displayName?: string, photoURL?: string }) => {
    try {
      if (!currentUser) throw new Error("No user is logged in");
      
      await supabaseUpdateUserProfile(currentUser, profileData);
      
      // Update local user state
      setCurrentUser(prev => {
        if (!prev) return null;
        
        // Create a new object that preserves the original type
        const updated = { 
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            name: profileData.displayName || prev.user_metadata?.name,
            avatar_url: profileData.photoURL || prev.user_metadata?.avatar_url
          }
        };
        
        return updated;
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendVerificationEmailToUser = async () => {
    try {
      if (!currentUser) throw new Error("No user is logged in");
      await supabaseSendVerificationEmail(currentUser);
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send verification email",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const checkVerificationStatus = async () => {
    try {
      if (!currentUser) return;
      
      // Refresh the session to get the latest user data
      const { data } = await supabase.auth.refreshSession();
      const updatedUser = data?.user;
      
      if (updatedUser && updatedUser.email_confirmed_at) {
        setUserData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            emailVerified: true
          };
        });
        
        toast({
          title: "Email verified",
          description: "Your email has been verified successfully.",
        });
      }
    } catch (error: any) {
      console.error("Error checking verification status:", error);
    }
  };

  // Update the isAdmin check to be more lenient
  const isAdmin = checkAdminStatus(userData);
  const isVerifiedAdmin = userData?.role === 'admin' && userData.emailVerified === true;

  const hasPermission = (permission: keyof UserPermissions) => {
    // If no userData, return false
    if (!userData) return false;
    
    // Admins have all permissions, but only if verified for critical operations
    if (isAdmin) {
      // For critical permissions, require email verification
      if (permission === 'canFeed' || permission === 'canSchedule') {
        return userData.emailVerified === true;
      }
      // For non-critical permissions, allow even without verification
      return true;
    }
    
    // Check if permissions object exists
    if (!userData.permissions) return false;
    
    // Check the specific permission
    return !!userData.permissions[permission];
  };

  const registerUser = async (email: string, password: string, name: string, username: string): Promise<User> => {
    const user = await supabaseRegisterUser(email, password, name, username);
    if (!user) {
      throw new Error("Failed to register user");
    }
    return user;
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserProfile: handleUpdateUserProfile,
    isAdmin,
    isVerifiedAdmin,
    hasPermission,
    sendVerificationEmailToUser,
    checkVerificationStatus,
    registerUser,
    databaseAvailable
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
