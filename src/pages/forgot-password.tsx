import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../services/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BookText, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Asumsikan base URL dari request window
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setIsSent(true);
      toast.success('Tautan pemulihan telah dikirim!');
    }
  };

  return (
    <div className="min-h-screen bg-card flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Lupa Kata Sandi | Notes App</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/20">
            <BookText className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-foreground tracking-tight">
          Pulihkan Akun Anda
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Atau{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary transition-colors">
            kembali ke halaman masuk
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-background py-8 px-4 shadow-xl shadow-zinc-200/20 dark:shadow-none sm:rounded-2xl sm:px-10 border border-border">
          {isSent ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Periksa Email Anda</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Kami telah mengirimkan tautan untuk mengatur ulang kata sandi ke <span className="font-semibold text-muted-foreground">{email}</span>
              </p>
              <Link href="/login">
                <Button className="w-full" variant="outline">
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <p className="text-sm text-muted-foreground">
                Masukkan alamat email yang terdaftar, dan kami akan mengirimkan instruksi untuk mengatur ulang kata sandi Anda.
              </p>
              
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                  Alamat Email
                </Label>
                <div className="mt-2 relative">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full transition-shadow focus-visible:ring-ring"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
