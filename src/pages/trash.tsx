import React, { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Button } from '../components/ui/button';
import { Loader2, Trash2, RotateCcw, BookText } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../utils/apiFetch';
import useSWR from 'swr';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TrashNote {
  id: string;
  title: string;
  deleted_at: string;
}

export default function TrashPage() {
  const { data: notes, isLoading, mutate } = useSWR<TrashNote[]>('/api/notes?trashed=true', apiFetch);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await apiFetch(`/api/notes/${id}?action=restore`, { method: 'PUT' });
      toast.success('Catatan berhasil dipulihkan');
      mutate();
    } catch {
      toast.error('Gagal memulihkan catatan');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteId) return;
    setIsPermanentDeleting(true);
    try {
      await apiFetch(`/api/notes/${permanentDeleteId}?permanent=true`, { method: 'DELETE' });
      toast.success('Catatan berhasil dihapus permanen');
      mutate();
    } catch {
      toast.error('Gagal menghapus catatan');
    } finally {
      setIsPermanentDeleting(false);
      setPermanentDeleteId(null);
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Sampah - NotesApp</title>
      </Head>

      <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Sampah</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !notes || notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <BookText className="w-10 h-10 mb-3 opacity-50" />
            <p>Sampah kosong</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{note.title || 'Tanpa Judul'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dihapus {format(new Date(note.deleted_at), 'd MMM yyyy, HH:mm', { locale: id })}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(note.id)}
                    disabled={restoringId === note.id}
                  >
                    {restoringId === note.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-1" />
                    )}
                    Pulihkan
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setPermanentDeleteId(note.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Hapus Permanen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!permanentDeleteId}
        onOpenChange={(open) => { if (!open) setPermanentDeleteId(null); }}
        title="Hapus Permanen"
        description="Catatan yang dihapus permanen tidak dapat dipulihkan kembali. Lanjutkan?"
        confirmLabel={isPermanentDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handlePermanentDelete}
        isLoading={isPermanentDeleting}
      />
    </DashboardLayout>
  );
}
