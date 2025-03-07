import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  onAuthStateChanged, 
  signIn, 
  signOut as firebaseSignOut, 
  signUp,
  updateUserProfile,
  getUserData
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { User } from "firebase/auth";

interface UserPermissions {
  canFeed: boolean;
  canSchedule: boolean;
  canViewStats: boolean;
}

interface UserData {
  role: 'admin' | 'user';
  permissions: UserPermissions;
  email: string;
}

interface AuthContextProps {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: { displayName?: string, photoURL?: string }) => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
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
  const { toast } = useToast();

  const fetchUserData = async (user: User) => {
    try {
      const snapshot = await getUserData(user.uid);
      if (snapshot.exists()) {
        setUserData(snapshot.val() as UserData);
      } else {
        const defaultUserData = {
          email: user.email || '',
          role: 'user',
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
    }
  };

  useEffect(() => {
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

  const register = async (email: string, password: string, isAdmin = false) => {
    try {
      await signUp(email, password, isAdmin);
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
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
      await firebaseSignOut();
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

  const isAdmin = userData?.role === 'admin';
  
  const hasPermission = (permission: keyof UserPermissions) => {
    if (!userData) return false;
    if (isAdmin) return true;
    return !!userData.permissions[permission];
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    updateUserProfile: handleUpdateUserProfile,
    isAdmin,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
