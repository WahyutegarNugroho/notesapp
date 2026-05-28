import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useNotes } from '../hooks/useNotes';
import { useDebounce } from '../hooks/useDebounce';
import { NoteCard } from '../components/features/NoteCard';
import { NoteEditor } from '../components/features/NoteEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, BookText, Loader2 } from 'lucide-react';
import { TagBadge } from '../components/features/TagBadge';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const { notes, isLoading, isLoadingMore, isReachingEnd, loadMore, createNote, addAttachment } = useNotes(debouncedSearch, activeTag);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSaveNote = async (title: string, content: string, attachments: Array<{url: string, type: string}>, tags: string[]) => {
    setIsSaving(true);
    const newNote = await createNote(title, content, tags);
    
    if (newNote && attachments.length > 0) {
      for (const att of attachments) {
        await addAttachment(newNote.id, att.url, att.type);
      }
    }
    
    setIsSaving(false);
    setIsEditorOpen(false);
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(t => tags.add(t.name));
    });
    return Array.from(tags).sort();
  }, [notes]);

  // Filter diproses di backend (SWR) sehingga filteredNotes = notes
  const filteredNotes = notes;

  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard | Notes App</title>
      </Head>

      <div className="flex flex-col md:flex-row gap-8 h-full p-4 sm:p-6 lg:p-8">
        {/* Sidebar / Filters */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm py-5 rounded-xl font-medium" onClick={() => setIsEditorOpen(true)}>
            <Plus className="w-5 h-5 mr-2" /> Catatan Baru
          </Button>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <Input
              placeholder="Cari catatan..."
              className="pl-9 bg-background/50 border-border rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mt-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Filter Tag</h3>
            <div className="flex flex-wrap gap-2">
              <TagBadge 
                name="Semua" 
                isActive={activeTag === null} 
                onClick={() => setActiveTag(null)} 
              />
              {allTags.map(tag => (
                <TagBadge 
                  key={tag} 
                  name={tag} 
                  isActive={activeTag === tag} 
                  onClick={() => setActiveTag(tag)} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden pb-10">
          {isLoading && notes.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center text-zinc-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                <p>Memuat catatan Anda...</p>
              </div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex-1 text-center flex flex-col items-center justify-center bg-background/50 rounded-2xl border border-dashed border-border p-8 shadow-sm">
              <div className="bg-primary/10 p-5 rounded-full mb-5">
                <BookText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Tidak ada catatan</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                {searchQuery || activeTag ? 'Tidak ada yang cocok dengan kriteria filter Anda.' : 'Mulai tuangkan ide brilian Anda dalam catatan pertama Anda!'}
              </p>
              {!(searchQuery || activeTag) && (
                <div className="mt-8">
                  <Button onClick={() => setIsEditorOpen(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-5">
                    <Plus className="w-5 h-5 mr-2" /> Buat Catatan Sekarang
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-max">
                {filteredNotes.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onClick={() => router.push(`/note/${note.id}`)} 
                  />
                ))}
              </div>
              
              {!isReachingEnd && (
                <div className="flex justify-center mt-10">
                  <Button 
                    variant="outline" 
                    onClick={loadMore} 
                    disabled={isLoadingMore}
                    className="w-full sm:w-auto rounded-xl px-8"
                  >
                    {isLoadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={(open) => !isSaving && setIsEditorOpen(open)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Catatan Baru</DialogTitle>
            <DialogDescription>
              Tuliskan pemikiran, ide, atau pengingat penting Anda di sini.
            </DialogDescription>
          </DialogHeader>
          <NoteEditor
            onSave={handleSaveNote}
            onCancel={() => setIsEditorOpen(false)}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
