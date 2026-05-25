import { useState } from 'react';
import { supabase } from '../services/supabase';
import { validateFile } from '../utils/fileValidator';
import { useAuth } from '../contexts/AuthContext';

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const uploadFile = async (file: File, noteId: string) => {
    setIsUploading(true);
    setError(null);

    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error!);
      setIsUploading(false);
      throw new Error(validation.error!);
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${noteId}/${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        type: file.type,
      };
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengunggah file.');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
};
