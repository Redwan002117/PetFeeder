import { supabase } from './supabase';

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
  return true;
};

export const deleteAllUsers = async (exceptAdmins: boolean = true) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .if(exceptAdmins, 'role', 'neq', 'admin');

  if (error) throw error;
  return true;
};
