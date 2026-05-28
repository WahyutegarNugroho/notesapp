import { useState } from 'react';
import { supabase } from '../services/supabase';
import { validateFile, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '../utils/fileValidator';
import { useAuth } from '../contexts/AuthContext';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'];
const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

function sanitizeExtension(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Ekstensi file tidak diizinkan');
  }
  return ext;
}

function generateSafeFileName(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

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
      if (!user) throw new Error('User not authenticated');

      const fileExt = sanitizeExtension(file.name);

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('Tipe MIME file tidak didukung');
      }

      let fileToUpload = file;
      
      // Image optimization
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        try {
          const imageCompression = (await import('browser-image-compression')).default;
          fileToUpload = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp'
          });
        } catch (compErr) {
          console.error("Compression error:", compErr);
          // Fallback to original file
        }
      }

      const safeNoteId = noteId.replace(/[^a-zA-Z0-9_-]/g, '');
      const fileName = `${safeNoteId}/${generateSafeFileName()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        type: file.type,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah file.';
      setError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
};
