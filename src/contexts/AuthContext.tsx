import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  signIn, 
  signOut,
  updatePassword,
  updateUserProfile,
  deleteUserAccount,
  getUserData,
  signInWithGoogle,
  sendVerificationEmail,
  isEmailVerified,
  updateEmailVerificationStatus,
  registerUser as firebaseRegisterUser,
} from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

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

interface AuthContextProps {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string, isAdmin?: boolean, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: { displayName?: string, photoURL?: string }) => Promise<void>;
  isAdmin: boolean;
  isVerifiedAdmin: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  sendVerificationEmailToUser: () => Promise<void>;
  checkVerificationStatus: () => Promise<void>;
  registerUser: (email: string, password: string, name: string, username: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const { toast } = useToast();

  const fetchUserData = async (user: User) => {
    try {
      const userData = await getUserData(user.uid);
      if (userData) {
        // Ensure permissions object exists
        if (!userData.permissions) {
          userData.permissions = {
            canFeed: true,
            canSchedule: true,
            canViewStats: true,
          };
        }
        
        // Ensure all required permissions exist
        if (userData.permissions.canFeed === undefined) userData.permissions.canFeed = true;
        if (userData.permissions.canSchedule === undefined) userData.permissions.canSchedule = true;
        if (userData.permissions.canViewStats === undefined) userData.permissions.canViewStats = true;
        
        setUserData(userData);
        
        // Check if user is a verified admin
        if (userData.role === 'admin') {
          const isVerified = user.emailVerified;
          setIsVerifiedAdmin(isVerified);
          
          // Update verification status in database if needed
          if (isVerified && !userData.emailVerified) {
            await updateEmailVerificationStatus(user.uid, true);
          }
        }
      } else {
        const defaultUserData: UserData = {
          email: user.email || '',
          role: 'user' as const,
          permissions: {
            canFeed: true,
            canSchedule: true,
            canViewStats: true,
          }
        };
        setUserData(defaultUserData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Set default user data even on error
      const defaultUserData: UserData = {
        email: user.email || '',
        role: 'user' as const,
        permissions: {
          canFeed: true,
          canSchedule: true,
          canViewStats: true,
        }
      };
      setUserData(defaultUserData);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
        setIsVerifiedAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
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
      await signInWithGoogle();
      toast({
        title: "Login successful",
        description: "Welcome!",
      });
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
        // For regular users, use the new registerUser function
        await firebaseRegisterUser(email, password, name, username);
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
      await signOut();
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
      await updateUserProfile(currentUser, profileData);
      setCurrentUser(prev => {
        if (!prev) return null;
        return Object.assign(Object.create(Object.getPrototypeOf(prev)), {
          ...prev,
          ...profileData
        });
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
      await sendVerificationEmail(currentUser);
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
      
      // Reload user to get the latest emailVerified status
      await currentUser.reload();
      const updatedUser = auth.currentUser;
      
      if (updatedUser && updatedUser.emailVerified) {
        setIsVerifiedAdmin(userData?.role === 'admin' && updatedUser.emailVerified);
        
        // Update verification status in database
        if (userData?.role === 'admin') {
          await updateEmailVerificationStatus(updatedUser.uid, true);
        }
        
        toast({
          title: "Email verified",
          description: "Your email has been verified successfully.",
        });
      }
    } catch (error: any) {
      console.error("Error checking verification status:", error);
    }
  };

  const isAdmin = userData?.role === 'admin';
  
  const hasPermission = (permission: keyof UserPermissions) => {
    // If no userData, return false
    if (!userData) return false;
    
    // Admins have all permissions, but only if verified for critical operations
    if (isAdmin) {
      // For critical permissions, require email verification
      if (permission === 'canFeed' || permission === 'canSchedule') {
        return isVerifiedAdmin;
      }
      // For non-critical permissions, allow even without verification
      return true;
    }
    
    // Check if permissions object exists
    if (!userData.permissions) return false;
    
    // Check the specific permission
    return !!userData.permissions[permission];
  };

  const registerUser = async (email: string, password: string, name: string, username: string) => {
    return await firebaseRegisterUser(email, password, name, username);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
