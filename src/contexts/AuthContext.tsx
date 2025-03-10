import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  signIn, 
  signOut,
  signUp,
  updateUserProfile as updateFirebaseUserProfile,
  getUserData,
  signInWithGoogle,
  sendVerificationEmail,
  isEmailVerified,
  updateEmailVerificationStatus,
  handleRedirectResult
} from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface UserPermissions {
  manualFeed: boolean;
  scheduleFeeding: boolean;
  viewHistory: boolean;
  deviceSettings: boolean;
  userManagement: boolean;
}

interface UserData {
  role: 'admin' | 'user';
  permissions: UserPermissions;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextProps {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: { displayName?: string, photoURL?: string }) => Promise<void>;
  isAdmin: boolean;
  isVerifiedAdmin: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  sendVerificationEmailToUser: () => Promise<void>;
  checkVerificationStatus: () => Promise<void>;
  databaseAvailable: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const [databaseAvailable, setDatabaseAvailable] = useState(true);
  const { toast } = useToast();

  // Check if user is admin
  const checkAdminStatus = (user: User, userData: UserData | null) => {
    console.log("Admin status check:", userData);
    
    // For testing purposes, allow a specific test account to always be admin
    if (user.email === 'admin@example.com') {
      return true;
    }
    
    return userData?.role === 'admin';
  };

  const fetchUserData = async (user: User) => {
    try {
      const snapshot = await getUserData(user.uid);
      if (snapshot.exists()) {
        const userData = snapshot.val() as UserData;
        
        // Ensure permissions object exists
        if (!userData.permissions) {
          userData.permissions = {
            manualFeed: true,
            scheduleFeeding: true,
            viewHistory: true,
            deviceSettings: false,
            userManagement: false,
          };
        }
        
        // Ensure all required permissions exist with defaults
        if (userData.permissions.manualFeed === undefined) userData.permissions.manualFeed = true;
        if (userData.permissions.scheduleFeeding === undefined) userData.permissions.scheduleFeeding = true;
        if (userData.permissions.viewHistory === undefined) userData.permissions.viewHistory = true;
        if (userData.permissions.deviceSettings === undefined) userData.permissions.deviceSettings = false;
        if (userData.permissions.userManagement === undefined) userData.permissions.userManagement = false;
        
        setUserData(userData);
        setDatabaseAvailable(true);
        
        // Check if user is a verified admin
        if (checkAdminStatus(user, userData)) {
          const isVerified = user.emailVerified;
          setIsVerifiedAdmin(isVerified);
          
          // Update verification status in database if needed
          if (isVerified && !userData.emailVerified) {
            await updateEmailVerificationStatus(user.uid, true);
          }
        }
      } else {
        const defaultUserData = {
          email: user.email || '',
          role: 'user',
          permissions: {
            manualFeed: true,
            scheduleFeeding: true,
            viewHistory: true,
            deviceSettings: false,
            userManagement: false,
          },
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
        };
        
        setUserData(defaultUserData);
        setDatabaseAvailable(true);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Set default user data if database is unavailable
      const defaultUserData = {
        email: user.email || '',
        role: 'user',
        permissions: {
          manualFeed: true,
          scheduleFeeding: true,
          viewHistory: true,
          deviceSettings: false,
          userManagement: false,
        },
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      };
      
      setUserData(defaultUserData);
      setDatabaseAvailable(false);
      
      toast({
        title: "Database Connection Issue",
        description: "Unable to connect to the database. Some features may be limited.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Check for redirect result on component mount
    const checkRedirectResult = async () => {
      try {
        const result = await handleRedirectResult();
        if (result) {
          toast({
            title: "Sign in successful",
            description: `Welcome back, ${result.user.displayName || result.user.email}!`,
          });
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
        toast({
          title: "Sign in failed",
          description: "There was an error signing in with Google. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    checkRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signIn(email, password);
      
      toast({
        title: "Sign in successful",
        description: `Welcome back, ${userCredential.user.displayName || email}!`,
      });
      
      await fetchUserData(userCredential.user);
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Failed to sign in. Please check your credentials and try again.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later or reset your password.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      }
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Clear any previous auth state to prevent loops
      localStorage.removeItem('authMode');
      
      await signInWithGoogle();
      
      toast({
        title: "Google Sign-in",
        description: "Signing in with Google...",
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
      
      toast({
        title: "Google Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, isAdmin = false) => {
    try {
      await signUp(email, password, isAdmin);
      
      if (isAdmin) {
        toast({
          title: "Registration successful",
          description: "Your admin account has been created! Please check your email to verify your account.",
        });
      } else {
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
        });
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
      await updateFirebaseUserProfile(currentUser, profileData);
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
      if (permission === 'manualFeed' || permission === 'scheduleFeeding') {
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
    databaseAvailable,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
