import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { RichTextEditor } from '../../components/features/RichTextEditor';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ArrowLeft, Save, Loader2, Share2, Globe, Lock, Folder, Bell, Trash2, ImageIcon, Paperclip, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNote } from '../../hooks/useNote';
import { useFolders } from '../../hooks/useFolders';
import { useStorage } from '../../hooks/useStorage';
import { nanoid } from 'nanoid';
import { apiFetch } from '../../utils/apiFetch';

export default function NoteDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { session, isLoading: authLoading } = useAuth();
  
  const { note, isLoading: isFetching, updateNote, deleteNote: deleteNoteApi } = useNote(id as string);
  const { folders } = useFolders();
  const { uploadFile } = useStorage();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [publicSlug, setPublicSlug] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [reminderAt, setReminderAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ id: string; file_url: string; file_type: string }>>([]);
  const [isUploadAttachment, setIsUploadAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync note data to local state once loaded
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setIsPublic(note.is_public || false);
      setPublicSlug(note.public_slug || '');
      setFolderId(note.folder_id || null);
      setReminderAt(note.reminder_at ? new Date(note.reminder_at) : null);
      setAttachments(note.attachments || []);
    }
  }, [note]);

  // Refs for tracking changes
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const isPublicRef = useRef(isPublic);
  const publicSlugRef = useRef(publicSlug);
  const folderIdRef = useRef(folderId);
  const reminderAtRef = useRef(reminderAt);
  const isSavingRef = useRef(false);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
    isPublicRef.current = isPublic;
    publicSlugRef.current = publicSlug;
    folderIdRef.current = folderId;
    reminderAtRef.current = reminderAt;
  }, [title, content, isPublic, publicSlug, folderId, reminderAt]);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/');
    }
  }, [session, authLoading, router]);

  const saveNote = async () => {
    if (isSavingRef.current) return;
    if (!titleRef.current.trim()) {
      toast.error('Judul tidak boleh kosong');
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const updated = await updateNote({
        title: titleRef.current,
        content: contentRef.current,
        is_public: isPublicRef.current,
        public_slug: publicSlugRef.current,
        folder_id: folderIdRef.current,
        reminder_at: reminderAtRef.current ? reminderAtRef.current.toISOString() : null
      });
      return updated;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    setIsDeleting(true);
    try {
      await deleteNoteApi();
      router.push('/dashboard');
    } catch {
      toast.error('Gagal menghapus catatan');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Auto-save with guard against concurrent saves
  useEffect(() => {
    if (isFetching || !note) return;

    const timeoutId = setTimeout(() => {
      if (isSavingRef.current) return;

      const hasChanges = 
        title !== note.title || 
        content !== (note.content || '') ||
        isPublic !== (note.is_public || false) ||
        publicSlug !== (note.public_slug || '') ||
        folderId !== (note.folder_id || null) ||
        (reminderAt ? reminderAt.toISOString() : null) !== (note.reminder_at ? new Date(note.reminder_at).toISOString() : null);

      if (hasChanges) {
        saveNote();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [title, content, isPublic, publicSlug, folderId, reminderAt, isFetching, note]);

  const togglePublicStatus = async () => {
    if (isSavingRef.current) return;
    const newStatus = !isPublic;
    const newSlug = newStatus && !publicSlug ? nanoid(10) : publicSlug;

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      await updateNote({
        is_public: newStatus,
        public_slug: newSlug
      });
      setIsPublic(newStatus);
      setPublicSlug(newSlug);
      toast.success(newStatus ? 'Catatan dipublikasikan' : 'Catatan diprivat');
    } catch {
      toast.error('Gagal mengubah status publik');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploadAttachment(true);
    try {
      const result = await uploadFile(file, id as string);
      if (result) {
        const newAtt = await apiFetch('/api/notes/attachments', {
          method: 'POST',
          body: JSON.stringify({ note_id: id, file_url: result.url, file_type: result.type })
        });
        setAttachments(prev => [...prev, newAtt]);
        toast.success('Lampiran berhasil ditambahkan');
      }
    } catch (err) {
      toast.error('Gagal mengunggah lampiran');
    } finally {
      setIsUploadAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await apiFetch(`/api/notes/attachments/${attachmentId}`, { method: 'DELETE' });
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      toast.success('Lampiran berhasil dihapus');
    } catch (err) {
      toast.error('Gagal menghapus lampiran');
    }
  };

  if (authLoading || isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>{title || 'Catatan Baru'} - NotesApp</title>
      </Head>

      <div className="flex flex-col h-full bg-card">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Button>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={async () => {
                  const TurndownService = (await import('turndown')).default;
                  const turndownService = new TurndownService({ headingStyle: 'atx' });
                  const markdown = turndownService.turndown(content || '');
                  const blob = new Blob([markdown], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${title}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Berhasil diekspor ke Markdown!');
                }}
              >
                <span className="hidden sm:inline">Export MD</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={async () => {
                  const html2pdf = (await import('html2pdf.js')).default;
                  const element = document.querySelector('.tiptap-content');
                  if (!element) return;
                  
                  const opt = {
                    margin:       1,
                    filename:     `${title}.pdf`,
                    image:        { type: 'jpeg' as const, quality: 0.98 },
                    html2canvas:  { scale: 2 },
                    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
                  };
                  
                  html2pdf().set(opt).from(element as HTMLElement).save();
                  toast.success('Mengekspor ke PDF...');
                }}
              >
                <span className="hidden sm:inline">Export PDF</span>
              </Button>
              <Button 
                size="sm" 
                variant={isPublic ? "default" : "outline"} 
                className={isPublic ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                onClick={togglePublicStatus}
              >
                {isPublic ? <Globe className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                <span className="hidden sm:inline">{isPublic ? 'Publik' : 'Privat'}</span>
              </Button>
              <Button 
                size="sm" 
                onClick={saveNote} 
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                <span className="hidden sm:inline">{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Hapus</span>
              </Button>
            </div>
          </div>
          
          {isPublic && (
            <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center justify-between text-sm">
              <span className="text-emerald-800 dark:text-emerald-300">Catatan ini dapat diakses oleh publik.</span>
              <div className="flex items-center gap-2">
                <a 
                  href={`/p/${publicSlug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  Lihat Halaman
                </a>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/p/${publicSlug}`);
                    toast.success('Tautan disalin ke clipboard');
                  }}
                >
                  <Share2 className="w-3 h-3 mr-1" /> Salin Tautan
                </Button>
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul Catatan..."
                className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none outline-none text-foreground placeholder-zinc-300 dark:placeholder-zinc-700"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring">
                <Folder className="w-4 h-4 text-muted-foreground" />
                <select 
                  className="bg-transparent border-none outline-none text-muted-foreground cursor-pointer text-sm w-32"
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value || null)}
                >
                  <option value="">Tanpa Folder</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring z-20 relative">
                <Bell className={`w-4 h-4 ${reminderAt ? 'text-primary' : 'text-muted-foreground'}`} />
                <DatePicker
                  selected={reminderAt}
                  onChange={(date: Date | null) => setReminderAt(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="Waktu"
                  dateFormat="d MMM yyyy, HH:mm"
                  placeholderText="Set pengingat..."
                  className="bg-transparent border-none outline-none text-muted-foreground cursor-pointer text-sm w-40"
                  isClearable
                />
              </div>
            </div>

            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Lampiran ({attachments.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="relative group">
                      {att.file_type.startsWith('image/') ? (
                        <div className="relative">
                          <img
                            src={att.file_url}
                            alt="Lampiran"
                            className="w-24 h-24 object-cover rounded-lg border border-border"
                          />
                          <button
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-muted-foreground">Video</span>
                          <button
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-red-500 hover:text-red-600 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Attachment Button */}
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadAttachment}
              >
                {isUploadAttachment ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4 mr-2" />
                )}
                {isUploadAttachment ? 'Mengunggah...' : 'Tambah Lampiran'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleUploadAttachment}
              />
            </div>

            <div className="tiptap-content bg-background p-1 rounded-lg">
              <RichTextEditor 
                content={content}
                onChange={setContent}
                noteId={id as string}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Hapus Catatan"
        description="Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel={isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleDeleteNote}
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
