import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { RichTextEditor } from '../../components/features/RichTextEditor';
import { ArrowLeft, Save, Loader2, Share2, Globe, Lock, Folder, Bell, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function NoteDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { session, isLoading } = useAuth();
  
  const [note, setNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [publicSlug, setPublicSlug] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [reminderAt, setReminderAt] = useState<Date | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [folders, setFolders] = useState<any[]>([]);

  // Refs for tracking changes
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const isPublicRef = useRef(isPublic);
  const publicSlugRef = useRef(publicSlug);
  const folderIdRef = useRef(folderId);
  const reminderAtRef = useRef(reminderAt);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
    isPublicRef.current = isPublic;
    publicSlugRef.current = publicSlug;
    folderIdRef.current = folderId;
    reminderAtRef.current = reminderAt;
  }, [title, content, isPublic, publicSlug, folderId, reminderAt]);

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/');
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (session && id) {
      fetchNote();
      fetchFolders();
    }
  }, [session, id]);

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/folders', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setFolders(await res.json());
      }
    } catch (e) {}
  };

  const fetchNote = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Catatan tidak ditemukan');
          router.push('/dashboard');
        }
        throw new Error('Failed to fetch note');
      }
      
      const data = await res.json();
      setNote(data);
      setTitle(data.title || '');
      setContent(data.content || '');
      setIsPublic(data.is_public || false);
      setPublicSlug(data.public_slug || '');
      setFolderId(data.folder_id || null);
      setReminderAt(data.reminder_at ? new Date(data.reminder_at) : null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const saveNote = async () => {
    if (!titleRef.current.trim()) {
      toast.error('Judul tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title: titleRef.current,
          content: contentRef.current,
          is_public: isPublicRef.current,
          public_slug: publicSlugRef.current,
          folder_id: folderIdRef.current,
          reminder_at: reminderAtRef.current
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }
      
      toast.success('Catatan disimpan');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;
    
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!res.ok) {
        throw new Error('Gagal menghapus catatan');
      }

      toast.success('Catatan berhasil dihapus');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (isFetching || !note) return;

    const timeoutId = setTimeout(() => {
      const hasChanges = 
        title !== note.title || 
        content !== (note.content || '') ||
        isPublic !== (note.is_public || false) ||
        publicSlug !== (note.public_slug || '') ||
        folderId !== (note.folder_id || null) ||
        (reminderAt ? reminderAt.toISOString() : null) !== (note.reminder_at ? new Date(note.reminder_at).toISOString() : null);

      if (hasChanges) {
        saveNote();
        // Update current note state to prevent infinite saving loop
        setNote((prev: any) => ({
          ...prev, 
          title, 
          content, 
          is_public: isPublic, 
          public_slug: publicSlug,
          folder_id: folderId,
          reminder_at: reminderAt
        }));
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [title, content, isPublic, publicSlug, folderId, reminderAt, isFetching, note]);

  const togglePublicStatus = async () => {
    const newStatus = !isPublic;
    const newSlug = newStatus && !publicSlug ? `note-${id?.toString().substring(0, 8)}` : publicSlug;
    
    setIsPublic(newStatus);
    setPublicSlug(newSlug);
    
    // Save immediately
    try {
      setIsSaving(true);
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          is_public: newStatus,
          public_slug: newSlug
        })
      });

      if (!res.ok) throw new Error('Gagal mengubah status visibilitas');
      
      toast.success(newStatus ? 'Catatan dipublikasikan' : 'Catatan diprivat');
      
      // Update current note state to prevent auto-save loop
      setNote((prev: any) => ({
        ...prev,
        is_public: newStatus,
        public_slug: newSlug
      }));
    } catch (e: any) {
      toast.error(e.message);
      // Revert state on error
      setIsPublic(!newStatus);
      setPublicSlug(publicSlug);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isFetching) {
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
                onClick={deleteNote}
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
    </DashboardLayout>
  );
}
