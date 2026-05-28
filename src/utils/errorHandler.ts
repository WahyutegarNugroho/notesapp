import { toast } from 'sonner';

export const handleApiError = (error: unknown, defaultMessage: string = 'Terjadi kesalahan sistem') => {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error(defaultMessage);
  }
  console.error("API Error:", error);
};
