import { supabase } from './supabase';

export interface EmailSettings {
  serviceId?: string;
  templateId?: string;
  userId?: string;
  adminEmail?: string;
  emailEnabled?: boolean;
}

export const getEmailSettings = async () => {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('email_settings')
    .single();

  if (error) throw error;
  return data?.email_settings as EmailSettings;
};

export const updateEmailSettings = async (settings: Partial<EmailSettings>) => {
  const { error } = await supabase
    .from('admin_settings')
    .upsert({
      id: 'email_settings',
      email_settings: settings,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
  return true;
};
