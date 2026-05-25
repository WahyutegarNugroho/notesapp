export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, error: `File terlalu besar. Maksimal ${MAX_FILE_SIZE_MB}MB.` };
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      isValid: false,
      error: 'Tipe file tidak didukung. Harap unggah JPG, PNG, WebP, MP4, atau WebM.',
    };
  }

  return { isValid: true };
};
