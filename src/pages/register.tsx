import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { supabase } from '../services/supabase';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Head>
        <title>Daftar | Notes App</title>
      </Head>
      
      {success ? (
        <div className="space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 p-4 rounded-md text-sm border border-emerald-200 dark:border-emerald-900/50">
            Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk melakukan verifikasi, atau jika sistem diatur tanpa verifikasi email, Anda bisa langsung masuk.
          </div>
          <div className="text-center">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Menuju halaman Masuk
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-address">Email</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi <span className="text-zinc-400 font-normal">(Min. 6 karakter)</span></Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Memproses...' : 'Daftar Akun'}
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground pt-2">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Masuk di sini
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
