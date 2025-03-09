import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  signIn, 
  signOut,
  updatePassword,
  updateUserProfile,
  deleteUserAccount,
  getUserData,
  signInWithGoogle as firebaseSignInWithGoogle,
  sendVerificationEmail,
  isEmailVerified,
  updateEmailVerificationStatus,
  registerUser as firebaseRegisterUser,
  initializeFirebase,
  database,
  handleRedirectResult
} from "@/lib/firebase";
import { safeGet, safeUpdate, safeSet } from "@/lib/firebase-utils";
import { onAuthStateChanged, User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

// Ensure Firebase is initialized
initializeFirebase();

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
  databaseAvailable: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

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
    // Check for redirect result first
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
    
    // Then set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        try {
          await fetchUserData(user);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData({
            role: 'user',
            permissions: {
              canFeed: true,
              canSchedule: true,
              canViewStats: true
            },
            email: user.email || '',
            emailVerified: user.emailVerified
          });
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to fetch user data from Firebase
  const fetchUserData = async (user: User) => {
    try {
      const userDataSnapshot = await safeGet(`users/${user.uid}`);
      
      if (userDataSnapshot && userDataSnapshot.exists()) {
        const data = userDataSnapshot.val();
        
        // Ensure role is set to 'user' unless explicitly marked as admin in the database
        const role = data.role === 'admin' ? 'admin' : 'user';
        
        // Update user data in state
        setUserData({
          ...data,
          role,
          email: user.email || data.email || '',
          emailVerified: user.emailVerified
        });
        
        // If role has changed, update it in the database
        if (role !== data.role) {
          await safeUpdate(`users/${user.uid}`, { role });
        }
        
        setDatabaseAvailable(true);
      } else {
        // Create new user data if it doesn't exist
        const newUserData = {
          role: 'user' as 'user',
          permissions: {
            canFeed: true,
            canSchedule: true,
            canViewStats: true
          },
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          emailVerified: user.emailVerified,
          createdAt: Date.now(),
          lastLogin: Date.now()
        };
        
        // Save new user data to database
        await safeSet(`users/${user.uid}`, newUserData);
        
        // Update user data in state
        setUserData(newUserData);
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
        emailVerified: user.emailVerified
      });
      
      setDatabaseAvailable(false);
    }
  };

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
      // Clear any previous auth state
      localStorage.removeItem('authMode');
      
      // Call the signInWithGoogle function
      const result = await firebaseSignInWithGoogle();
      
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
        throw new Error(result.error || "Google login failed");
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
        setUserData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            emailVerified: updatedUser.emailVerified
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
  const isVerifiedAdmin = userData?.role === 'admin' && currentUser?.emailVerified === true;

  const hasPermission = (permission: keyof UserPermissions) => {
    // If no userData, return false
    if (!userData) return false;
    
    // Admins have all permissions, but only if verified for critical operations
    if (isAdmin) {
      // For critical permissions, require email verification
      if (permission === 'canFeed' || permission === 'canSchedule') {
        return userData.emailVerified;
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
    databaseAvailable
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
