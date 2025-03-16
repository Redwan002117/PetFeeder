import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helper functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data.user;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return { success: true, redirect: true };
};

export const registerUser = async (email: string, password: string, name: string, username: string) => {
  // Register the user with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        username,
      },
    },
  });
  
  if (error) throw error;
  
  // Create user profile in the database
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email,
          name,
          username,
          role: 'user',
          permissions: {
            canFeed: true,
            canSchedule: true,
            canViewStats: true
          },
          created_at: new Date().toISOString(),
        },
      ]);
    
    if (profileError) throw profileError;
  }
  
  return data.user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const updateUserProfile = async (user: any, profileData: { displayName?: string, photoURL?: string }) => {
  const { error } = await supabase.auth.updateUser({
    data: {
      name: profileData.displayName,
      avatar_url: profileData.photoURL,
    },
  });
  
  if (error) throw error;
};

export const sendVerificationEmail = async (user: any) => {
  // Supabase automatically sends verification email on signup
  // This function is for resending the verification email
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
  });
  
  if (error) throw error;
};

export const updatePassword = async (user: any, currentPassword: string, newPassword: string) => {
  // First verify the current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  
  if (signInError) throw signInError;
  
  // Then update the password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) throw error;
};

export const deleteUserAccount = async (user: any, password: string) => {
  // Verify password before deletion
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  
  if (signInError) throw signInError;
  
  // Delete user data from the database
  const { error: deleteDataError } = await supabase
    .from('users')
    .delete()
    .eq('id', user.id);
  
  if (deleteDataError) throw deleteDataError;
  
  // Delete the user account
  // Note: In Supabase, admin intervention might be needed for complete deletion
  // This will sign the user out
  await signOut();
};

export const getUserData = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const handleRedirectResult = async () => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  if (data.session) {
    return { success: true, user: data.session.user };
  }
  
  return { success: false, error: 'No session found' };
};

export const applyActionCode = async (auth: any, code: string) => {
  // In Supabase, verification is handled differently
  // This function is a placeholder for compatibility
  console.log('Verification with code is handled automatically by Supabase');
  return true;
};

export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
};

// Auth state listener setup
export const onAuthStateChanged = (auth: any, callback: (user: any) => void) => {
  // Initial session check
  supabase.auth.getSession().then(({ data }) => {
    callback(data.session?.user || null);
  });
  
  // Setup listener
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  // Return unsubscribe function
  return () => {
    data.subscription.unsubscribe();
  };
};

// Database operations
export const database = {
  ref: (path: string) => ({
    path,
    // Implement other methods as needed
  }),
};

// For compatibility with existing code
export const auth = {
  currentUser: null,
};

// Update auth.currentUser when auth state changes
onAuthStateChanged(null, (user) => {
  if (auth) {
    auth.currentUser = user;
  }
});