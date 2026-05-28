import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookText, LogOut, Moon, Sun, Menu, X, Settings, Folder as FolderIcon, Plus, Loader2, Trash2, Pencil, Check, X as XIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useFolders } from '../hooks/useFolders';
import { FolderWithChildren } from '../types/frontend';
import { handleApiError } from '../utils/errorHandler';
import { apiFetch } from '../utils/apiFetch';
import { supabase } from '../services/supabase';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { folders, createFolder, isLoading: foldersLoading, mutateFolders } = useFolders();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);


  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
      toast.success('Folder berhasil dibuat!');
    } catch (err) {
      handleApiError(err, 'Gagal membuat folder');
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!editingFolderName.trim()) return;
    try {
      await apiFetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingFolderName.trim() })
      });
      setEditingFolderId(null);
      setEditingFolderName('');
      toast.success('Folder berhasil diganti nama');
      mutateFolders();
    } catch (err) {
      handleApiError(err, 'Gagal mengganti nama folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await apiFetch(`/api/folders/${folderId}`, { method: 'DELETE' });
      setDeletingFolderId(null);
      toast.success('Folder berhasil dihapus');
      mutateFolders();
    } catch (err) {
      handleApiError(err, 'Gagal menghapus folder');
    }
  };

  const renderFolderItem = (folder: FolderWithChildren, depth: number = 0) => (
    <div key={folder.id}>
      {editingFolderId === folder.id ? (
        <div className="flex items-center gap-1 px-3 py-1" style={{ paddingLeft: `${12 + depth * 16}px` }}>
          <input
            type="text"
            value={editingFolderName}
            onChange={e => setEditingFolderName(e.target.value)}
            className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleRenameFolder(folder.id);
              if (e.key === 'Escape') setEditingFolderId(null);
            }}
          />
          <button onClick={() => handleRenameFolder(folder.id)} className="text-green-600 hover:text-green-700">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setEditingFolderId(null)} className="text-zinc-400 hover:text-zinc-600">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-900 dark:hover:text-zinc-50 cursor-pointer"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <FolderIcon className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="flex-1 truncate">{folder.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}
            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-primary transition-opacity"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeletingFolderId(folder.id); }}
            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {folder.children.map(child => renderFolderItem(child, depth + 1))}
    </div>
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6 flex items-center gap-3 border-b border-border">
        <div className="bg-primary p-2 rounded-lg">
          <BookText className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">Notes<span className="text-primary">App</span></span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1 mb-8">
          <Link href="/dashboard">
            <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              router.pathname === '/dashboard' 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' 
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
            }`}>
              <BookText className="w-4 h-4" />
              Semua Catatan
            </span>
          </Link>
          <Link href="/settings">
            <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              router.pathname === '/settings' 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' 
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
            }`}>
              <Settings className="w-4 h-4" />
              Pengaturan
            </span>
          </Link>
          <Link href="/trash">
            <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              router.pathname === '/trash' 
                ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' 
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
            }`}>
              <Trash2 className="w-4 h-4" />
              Sampah
            </span>
          </Link>
        </nav>

        <div className="mb-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workspace Folders
            </h3>
            <button onClick={() => setIsCreatingFolder(!isCreatingFolder)} className="text-zinc-400 hover:text-primary">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="px-3 mb-2">
              <input 
                type="text" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Nama folder baru..."
                className="w-full bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
                onBlur={() => !newFolderName && setIsCreatingFolder(false)}
              />
            </form>
          )}

          <nav className="space-y-0.5">
            {foldersLoading ? (
              <div className="px-3 py-2 text-xs text-zinc-500 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Memuat...
              </div>
            ) : folders.length === 0 && !isCreatingFolder ? (
              <p className="px-3 py-2 text-xs text-zinc-500">Belum ada folder.</p>
            ) : (
              folders.map(folder => renderFolderItem(folder))
            )}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground bg-transparent border-transparent hover:bg-muted"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && theme === 'dark' ? (
            <><Sun className="w-4 h-4 mr-3" /> Terang</>
          ) : (
            <><Moon className="w-4 h-4 mr-3" /> Gelap</>
          )}
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 border-transparent bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Keluar
        </Button>
      </div>

      <ConfirmDialog
        open={!!deletingFolderId}
        onOpenChange={(open) => { if (!open) setDeletingFolderId(null); }}
        title="Hapus Folder"
        description="Catatan di dalam folder ini akan dipindahkan ke root. Lanjutkan?"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={() => deletingFolderId && handleDeleteFolder(deletingFolderId)}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-md">
              <BookText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-foreground">Notes<span className="text-primary">App</span></span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-zinc-500 hover:bg-muted"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
