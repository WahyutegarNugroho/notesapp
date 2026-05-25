import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../services/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BookText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is actually in a recovery session
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        toast.info('Silakan masukkan kata sandi baru Anda.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Kata sandi harus minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Kata sandi berhasil diubah!');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-card flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Ubah Kata Sandi | Notes App</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/20">
            <BookText className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-foreground tracking-tight">
          Kata Sandi Baru
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-background py-8 px-4 shadow-xl shadow-zinc-200/20 dark:shadow-none sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                Kata Sandi Baru
              </Label>
              <div className="mt-2 relative">
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full transition-shadow focus-visible:ring-ring"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">Minimal 6 karakter.</p>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
