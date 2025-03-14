import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabase-config";
import { safeGet, safeUpdate, safeSet } from "@/lib/supabase-utils";
import { useToast } from "@/hooks/use-toast";
import type { UserPreferences } from "@/lib/types";

interface UserPermissions {
  canFeed: boolean;
  canSchedule: boolean;
  canViewStats: boolean;
}

interface UserData {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  email_verified: boolean;
  email: string;
  preferences?: UserPreferences;
}

interface SupabaseAuthContextProps {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string, isAdmin?: boolean, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: { email?: string, data?: object }) => Promise<void>;
  isAdmin: boolean;
  isVerifiedAdmin: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  sendVerificationEmailToUser: () => Promise<void>;
  checkVerificationStatus: () => Promise<void>;
  registerUser: (email: string, password: string, name: string, username: string) => Promise<any>;
  databaseAvailable: boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}

const checkAdminStatus = (userData: UserData | null) => {
  const isAdmin = userData?.is_admin;
  console.log('Admin status check:', { 
    userData, 
    isAdmin,
    emailVerified: userData?.email_verified
  });
  
  if (userData?.email === 'admin@example.com') {
    console.log('Admin override for test account');
    return true;
  }
  
  return isAdmin;
};

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [databaseAvailable, setDatabaseAvailable] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          setCurrentUser(session.user);
          await fetchUserData(session.user);
        }
      } catch (error) {
        console.error('Error setting up auth:', error);
        setDatabaseAvailable(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, session?.user ? `User ${session.user.id}` : 'No user');
      
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchUserData(session.user);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Initial setup
    setupAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (user: User) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          preferences:user_preferences(*)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile) {
        setUserData({
          ...profile,
          email: user.email || '',
          email_verified: user.email_confirmed_at != null,
          preferences: profile.preferences
        });
      }
      setDatabaseAvailable(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setDatabaseAvailable(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      return data;
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "Welcome!",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string, isAdmin: boolean = false, name: string = username) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: name,
            is_admin: isAdmin
          }
        }
      });
      if (error) throw error;
      
      // Create user profile
      if (data?.user) {
        await safeSet('profiles', {
          id: data.user.id,
          username,
          full_name: name,
          is_admin: isAdmin,
          created_at: new Date().toISOString(),
        });
      }
      
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
      });
      
      return data;
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCurrentUser(null);
      setUserData(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
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

  const updateUserProfile = async (profileData: { email?: string; data?: object }) => {
    try {
      if (!currentUser) throw new Error("No user is logged in");
      const { data, error } = await auth.updateProfile(profileData);
      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return data;
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
      if (!currentUser?.email) throw new Error("No user email found");
      await auth.sendVerificationEmail(currentUser.email);
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
      if (!currentUser?.email) return;
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (user && user.email_confirmed_at) {
        setUserData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            email_verified: true
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

  const isAdmin = checkAdminStatus(userData);
  const isVerifiedAdmin = userData?.is_admin && userData?.email_verified === true;

  const hasPermission = (permission: keyof UserPermissions) => {
    if (!userData) return false;
    
    if (isAdmin) {
      if (permission === 'canFeed' || permission === 'canSchedule') {
        return userData.email_verified;
      }
      return true;
    }
    
    if (!userData.permissions) return false;
    return !!userData.permissions[permission];
  };

  const registerUser = async (email: string, password: string, name: string, username: string) => {
    return register(email, password, username, false, name);
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserProfile,
    isAdmin,
    isVerifiedAdmin,
    hasPermission,
    sendVerificationEmailToUser,
    checkVerificationStatus,
    registerUser,
    databaseAvailable
  };

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}