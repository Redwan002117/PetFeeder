import { supabase } from './supabase';

export const uploadProfilePicture = async (file: Blob): Promise<string> => {
  const fileExt = 'jpg';  // Assuming we're converting all images to JPG
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `profile-pictures/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
};
