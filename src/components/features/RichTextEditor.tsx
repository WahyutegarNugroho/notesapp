import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Mention from '@tiptap/extension-mention';
import { Bold, Italic, List, ListOrdered, Strikethrough, Image as ImageIcon, Loader2, CheckSquare } from 'lucide-react';
import ImageExtension from '@tiptap/extension-image';
import { useStorage } from '../../hooks/useStorage';
import { useNotes } from '../../hooks/useNotes';
import { useRef, useEffect } from 'react';
import { toast } from 'sonner';
import getSuggestion from './suggestion';

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const { uploadFile, isUploading } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      const result = await uploadFile(file, 'temp-inline-' + Date.now());
      if (result) {
        editor.chain().focus().setImage({ src: result.url }).run();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah gambar');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-card border-b border-border rounded-t-md">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-2 rounded-md transition-colors ${editor.isActive('strike') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-muted mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-2 rounded-md transition-colors ${editor.isActive('taskList') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        title="To-Do List"
      >
        <CheckSquare className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-muted mx-1" />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="p-2 rounded-md transition-colors text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        title="Sisipkan Gambar"
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageUpload}
      />
    </div>
  );
};

export const RichTextEditor = ({ content, onChange, noteId }: { content: string, onChange: (val: string) => void, noteId?: string }) => {
  const { notes } = useNotes();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary font-semibold px-1 py-0.5 rounded-md cursor-pointer',
        },
        suggestion: {
          ...getSuggestion(notes),
          char: '[',
        } as unknown as Record<string, unknown>,
        renderLabel({ options, node }) {
          return `[[${node.attrs.label ?? node.attrs.id}]]`;
        },
      }),
      ImageExtension.configure({
        inline: false,
        HTMLAttributes: {
          class: 'rounded-lg border border-border my-4 max-w-full h-auto',
        },
      }),
      Placeholder.configure({
        placeholder: 'Ketik [ untuk menyisipkan catatan lain...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none min-h-[200px] w-full bg-background px-4 py-3 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed && content) {
      if (editor.isEmpty && content !== '<p></p>') {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  return (
    <div className="rounded-md border border-border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
