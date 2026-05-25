import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '../components/ui/skeleton';
import { BookText } from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      router.push('/dashboard');
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card">
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-card">
      {/* Left visual side */}
      <div className="hidden sm:flex sm:w-1/2 bg-zinc-900 flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-800/20" />
        <div className="relative z-10">
          <BookText className="h-16 w-16 text-indigo-400 mb-6" />
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Catat Setiap Ide. <br /> Kapanpun, Di manapun.</h1>
          <p className="text-zinc-400 text-lg max-w-md">Notes App membantu Anda mengorganisir pemikiran dengan antarmuka yang bersih, cepat, dan aman secara default.</p>
        </div>
      </div>
      
      {/* Right form side */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center sm:hidden mb-8">
             <BookText className="h-12 w-12 text-primary mx-auto" />
             <h2 className="mt-4 text-2xl font-bold text-foreground">Notes App</h2>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
