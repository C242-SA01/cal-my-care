import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a file to the 'e-modules' storage bucket and returns its public URL.
 * @param file The file to upload.
 * @returns The public URL of the uploaded file.
 */
export const uploadEModuleFile = async (file: File): Promise<string> => {
  if (!file) {
    throw new Error('No file provided.');
  }

  const fileExtension = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExtension}`;
  
  // The path in the bucket will be under the 'public' folder.
  // This is a common convention but not strictly required.
  // Let's just use the filename as the path to keep it simple.
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from('e-modules')
    .upload(filePath, file);

  if (error) {
    console.error('Storage Error:', error);
    throw new Error(`Storage Error: ${error.message}`);
  }

  // Get the public URL.
  const { data: publicUrlData } = supabase.storage
    .from('e-modules')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};
