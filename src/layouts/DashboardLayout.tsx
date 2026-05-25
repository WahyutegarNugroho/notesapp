import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../services/supabase';
import { BookText, LogOut, Moon, Sun, Menu, X, Settings, Folder as FolderIcon, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const res = await fetch('/api/folders', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      setFolders(await res.json());
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newFolderName })
    });

    if (res.ok) {
      setNewFolderName('');
      setIsCreatingFolder(false);
      fetchFolders();
      toast.success('Folder dibuat!');
    }
  };

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
            {folders.filter(f => !f.parent_id).map(folder => (
              <div key={folder.id}>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-900 dark:hover:text-zinc-50 cursor-pointer">
                  <FolderIcon className="w-4 h-4 text-zinc-400" />
                  {folder.name}
                </div>
                {/* Simplified rendering, ideally recursively render folder.children */}
              </div>
            ))}
            {folders.length === 0 && !isCreatingFolder && (
              <p className="px-3 py-2 text-xs text-zinc-500">Belum ada folder.</p>
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
