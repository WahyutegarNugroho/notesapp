import React, { useEffect, useSyncExternalStore } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Palette, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { Skeleton } from '../components/ui/skeleton';
import { useThemePalette } from '../contexts/ThemePaletteContext';

const THEMES = [
  { id: 'default', name: 'Default', color: '#6366f1' },
  { id: 'dracula', name: 'Dracula', color: '#bd93f9' },
  { id: 'nord', name: 'Nord', color: '#88c0d0' },
  { id: 'sepia', name: 'Sepia', color: '#d4a373' },
  { id: 'ocean', name: 'Ocean', color: '#38bdf8' },
];

export default function SettingsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const { palette, setPalette } = useThemePalette();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [session, isLoading, router]);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card">
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Pengaturan - NotesApp</title>
      </Head>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Palette className="w-8 h-8 text-primary" />
            Pengaturan Tampilan
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sesuaikan antarmuka aplikasi sesuai selera Anda.
          </p>
        </div>

        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Tema Warna</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mounted && THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPalette(t.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    palette === t.id 
                      ? 'border-indigo-500 bg-primary/10' 
                      : 'border-border hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border border-zinc-300 shadow-inner" 
                      style={{ backgroundColor: t.color }}
                    />
                    <span className={`font-medium ${palette === t.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {t.name}
                    </span>
                  </div>
                  {palette === t.id && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
