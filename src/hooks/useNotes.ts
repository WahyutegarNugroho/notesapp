import useSWRInfinite from 'swr/infinite';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database.types';
import { toast } from 'sonner';
import { apiFetch } from '../utils/apiFetch';
import { handleApiError } from '../utils/errorHandler';

type Note = Database['public']['Tables']['notes']['Row'];
type Attachment = Database['public']['Tables']['attachments']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

export interface NoteWithDetails extends Note {
  attachments: Attachment[];
  tags: Tag[];
}

interface NoteApiResponse {
  note_tags?: Array<{ tag: Tag }>;
  attachments: Attachment[];
  [key: string]: unknown;
}

interface PageData {
  notes: NoteWithDetails[];
  nextCursor: string | null;
}

export const useNotes = (searchQuery: string = '', activeTag: string | null = null) => {
  const { user } = useAuth();

  const fetcher = async (url: string): Promise<PageData> => {
    if (!user) return { notes: [], nextCursor: null };
    const data = await apiFetch(url);
    
    return {
      notes: data.notes.map((note: NoteApiResponse) => ({
        ...note,
        tags: note.note_tags ? note.note_tags.map((nt) => nt.tag) : []
      })) as NoteWithDetails[],
      nextCursor: data.nextCursor as string | null
    };
  };

  const getKey = (pageIndex: number, previousPageData: PageData | null) => {
    if (!user) return null;
    if (previousPageData && !previousPageData.nextCursor) return null;

    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.append('search', searchQuery);
    if (activeTag) queryParams.append('tag', activeTag);
    if (pageIndex > 0 && previousPageData?.nextCursor) queryParams.append('cursor', previousPageData.nextCursor);

    return `/api/notes?${queryParams.toString()}`;
  };

  const { data, error, isLoading, mutate, size, setSize } = useSWRInfinite<PageData>(getKey, fetcher);

  const notes = data ? data.flatMap(page => page.notes) : [];
  const isReachingEnd = data && data[data.length - 1]?.nextCursor === null;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  const createNote = async (title: string, content: string, tags: string[] = []) => {
    if (!user) return null;
    try {
      const data = await apiFetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title, content, tags })
      });
      
      mutate();
      toast.success('Catatan berhasil dibuat!');
      return data;
    } catch (err: unknown) {
      handleApiError(err, 'Gagal membuat catatan');
      return null;
    }
  };

  const updateNote = async (id: string, title?: string, content?: string, is_public?: boolean, public_slug?: string | null) => {
    try {
      const bodyParams: Record<string, string | boolean | null> = {};
      if (title !== undefined) bodyParams.title = title;
      if (content !== undefined) bodyParams.content = content;
      if (is_public !== undefined) bodyParams.is_public = is_public;
      if (public_slug !== undefined) bodyParams.public_slug = public_slug;

      const data = await apiFetch(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bodyParams)
      });
      
      mutate();
      toast.success('Catatan berhasil diperbarui!');
      return data;
    } catch (err: unknown) {
      handleApiError(err, 'Gagal memperbarui catatan');
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await apiFetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });
      
      mutate();
      toast.success('Catatan berhasil dihapus!');
    } catch (err: unknown) {
      handleApiError(err, 'Gagal menghapus catatan');
    }
  };

  const addAttachment = async (noteId: string, fileUrl: string, fileType: string) => {
    try {
      await apiFetch(`/api/notes/attachments`, {
        method: 'POST',
        body: JSON.stringify({ note_id: noteId, file_url: fileUrl, file_type: fileType })
      });
      mutate();
    } catch (err: unknown) {
      handleApiError(err, 'Gagal menambahkan lampiran');
      throw err;
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      await apiFetch(`/api/notes/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      mutate();
      toast.success('Lampiran berhasil dihapus');
    } catch (err: unknown) {
      handleApiError(err, 'Gagal menghapus lampiran');
      throw err;
    }
  };

  return { 
    notes, 
    isLoading, 
    isLoadingMore,
    isReachingEnd,
    loadMore: () => setSize(size + 1),
    error: error?.message || null, 
    fetchNotes: mutate, 
    createNote, 
    updateNote, 
    deleteNote, 
    addAttachment,
    removeAttachment
  };
};
