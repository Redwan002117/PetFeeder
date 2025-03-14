import { supabase } from './supabase';

export const updateUserProfile = async (userId: string, updates: {
  displayName?: string;
  photoURL?: string;
}) => {
  const { error } = await supabase
    .from('users')
    .update({
      display_name: updates.displayName,
      photo_url: updates.photoURL,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) throw error;
  return true;
};

export const sendVerificationEmail = async () => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
  });

  if (error) throw error;
  return true;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return true;
};

export const deleteUserAccount = async (password: string) => {
  // First verify the password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: (await supabase.auth.getUser()).data.user?.email || '',
    password: password
  });

  if (verifyError) throw new Error('Invalid password');

  // Delete the user account
  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    (await supabase.auth.getUser()).data.user?.id || ''
  );

  if (deleteError) throw deleteError;
  return true;
};
