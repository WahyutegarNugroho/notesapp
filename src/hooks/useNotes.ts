import useSWRInfinite from 'swr/infinite';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database.types';
import { toast } from 'sonner';

type Note = Database['public']['Tables']['notes']['Row'];
type Attachment = Database['public']['Tables']['attachments']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

export interface NoteWithDetails extends Note {
  attachments: Attachment[];
  tags: Tag[];
}

export const useNotes = (searchQuery: string = '', activeTag: string | null = null) => {
  const { user } = useAuth();

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  interface PageData {
    notes: NoteWithDetails[];
    nextCursor: string | null;
  }

  const fetcher = async (url: string): Promise<PageData> => {
    if (!user) return { notes: [], nextCursor: null };
    const headers = await getAuthHeader();
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch notes');
    const data = await res.json();
    
    return {
      notes: data.notes.map((note: any) => ({
        ...note,
        tags: note.note_tags ? note.note_tags.map((nt: any) => nt.tag) : []
      })),
      nextCursor: data.nextCursor
    };
  };

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (!user) return null;
    if (previousPageData && !previousPageData.nextCursor) return null;

    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.append('search', searchQuery);
    if (activeTag) queryParams.append('tag', activeTag);
    if (pageIndex > 0 && previousPageData) queryParams.append('cursor', previousPageData.nextCursor);

    return `/api/notes?${queryParams.toString()}`;
  };

  const { data, error, isLoading, mutate, size, setSize } = useSWRInfinite<PageData>(getKey, fetcher);

  const notes = data ? data.flatMap(page => page.notes) : [];
  const isReachingEnd = data && data[data.length - 1]?.nextCursor === null;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  const createNote = async (title: string, content: string, tags: string[] = []) => {
    if (!user) return null;
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, content, tags })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create note');
      }
      
      const data = await res.json();
      mutate();
      toast.success('Catatan berhasil dibuat!');
      return data;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  const updateNote = async (id: string, title?: string, content?: string, is_public?: boolean, public_slug?: string | null) => {
    try {
      const headers = await getAuthHeader();
      const bodyParams: any = {};
      if (title !== undefined) bodyParams.title = title;
      if (content !== undefined) bodyParams.content = content;
      if (is_public !== undefined) bodyParams.is_public = is_public;
      if (public_slug !== undefined) bodyParams.public_slug = public_slug;

      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(bodyParams)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update note');
      }
      
      const data = await res.json();
      mutate();
      toast.success('Catatan berhasil diperbarui!');
      return data;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!res.ok) throw new Error('Failed to delete note');
      
      mutate();
      toast.success('Catatan berhasil dihapus!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addAttachment = async (noteId: string, fileUrl: string, fileType: string) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/notes/attachments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ note_id: noteId, file_url: fileUrl, file_type: fileType })
      });
      
      if (!res.ok) throw new Error('Failed to add attachment');
      
      mutate();
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/notes/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!res.ok) throw new Error('Gagal menghapus lampiran');
      
      mutate();
      toast.success('Lampiran berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message);
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
