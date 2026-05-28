import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useStorage } from '../../hooks/useStorage';
import { Paperclip, X, Loader2, Tag as TagIcon } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface NoteEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  onSave: (title: string, content: string, attachments: Array<{url: string, type: string}>, tags: string[]) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  onSave,
  onCancel,
  isSaving
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const { uploadFile } = useStorage();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFiles(prev => [...prev, file]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUploading(true);
    const uploadedAttachments: Array<{url: string, type: string}> = [];
    
    try {
      const tempNoteId = 'temp-' + Date.now();
      for (const file of pendingFiles) {
        try {
          const result = await uploadFile(file, tempNoteId);
          uploadedAttachments.push(result);
        } catch (err: unknown) {
          const uploadMsg = err instanceof Error ? err.message : 'Unknown error';
          throw new Error(`Gagal mengunggah file ${file.name}: ${uploadMsg}`);
        }
      }
      
      await onSave(title, content, uploadedAttachments, tags);
    } catch { 
      toast.error('Gagal menyimpan catatan');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-muted-foreground">Judul Catatan</Label>
        <Input
          id="title"
          placeholder="Masukkan judul yang menarik..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
          className="text-lg font-medium"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content" className="text-muted-foreground">Isi Catatan</Label>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags" className="text-muted-foreground">Tag (Tekan Enter)</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1 pr-1.5">
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-zinc-500 hover:text-red-500 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="relative">
          <TagIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            id="tags"
            placeholder="Tambah tag baru..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="pl-9"
          />
        </div>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-muted-foreground">File Menunggu Diunggah</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pendingFiles.map((file, i) => (
              <div key={i} className="relative group overflow-hidden rounded-md border border-border bg-card flex items-center justify-center p-4">
                <span className="text-xs text-center text-zinc-500 truncate w-full">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removePendingFile(i)}
                  className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 border-t border-border pt-6">
        <div className="w-full sm:w-auto">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            onChange={handleFileChange}
            disabled={isUploading || isSaving}
          />
          <Label
            htmlFor="file-upload"
            className={`inline-flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-colors border ${
              isUploading 
                ? 'text-zinc-400 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700' 
                : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 dark:hover:bg-indigo-500/20'
            }`}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            {isUploading ? 'Menyimpan Lampiran...' : 'Tambah Media Lokal'}
          </Label>
        </div>

        <div className="flex w-full sm:w-auto gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving || isUploading} className="w-full sm:w-auto">
            Batal
          </Button>
          <Button type="submit" disabled={!title.trim() || isUploading || isSaving} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            {(isSaving || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {(isSaving || isUploading) ? 'Memproses...' : 'Simpan Catatan'}
          </Button>
        </div>
      </div>
    </form>
  );
};
