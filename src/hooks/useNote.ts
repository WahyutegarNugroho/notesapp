import useSWR from 'swr';
import { apiFetch } from '../utils/apiFetch';
import { NoteWithRelations } from '../types/frontend';
import { handleApiError } from '../utils/errorHandler';
import { toast } from 'sonner';

export const useNote = (id?: string | string[]) => {
  const noteId = Array.isArray(id) ? id[0] : id;
  const fetcher = (url: string) => apiFetch(url);
  const { data, error, isLoading, mutate } = useSWR<NoteWithRelations>(
    noteId ? `/api/notes/${noteId}` : null,
    fetcher
  );

  const updateNote = async (updates: Partial<NoteWithRelations>) => {
    if (!noteId) return;
    try {
      const updatedNote = await apiFetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      mutate(updatedNote);
      toast.success('Catatan disimpan');
      return updatedNote;
    } catch (err) {
      handleApiError(err, 'Gagal menyimpan catatan');
      throw err;
    }
  };

  const deleteNote = async () => {
    if (!noteId) return;
    try {
      await apiFetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      toast.success('Catatan berhasil dihapus');
    } catch (err) {
      handleApiError(err, 'Gagal menghapus catatan');
      throw err;
    }
  };

  return { note: data, isLoading, error, mutate, updateNote, deleteNote };
};
