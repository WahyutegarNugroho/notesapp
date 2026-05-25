import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BookText, Shield, Zap, Tags, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      router.push('/dashboard');
    }
  }, [session, isLoading, router]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-card font-sans selection:bg-indigo-500/30">
      <Head>
        <title>Notes App - Rekam Ide Brilian Anda</title>
      </Head>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <BookText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">Notes<span className="text-primary">App</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Masuk
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
                Mulai Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/20 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <Badge variant="outline" className="mb-8 px-4 py-1.5 rounded-full border-indigo-200 dark:border-indigo-800 bg-primary/10 text-primary text-sm font-medium">
          ✨ Tingkatkan produktivitas Anda hari ini
        </Badge>
        
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mb-8 leading-tight">
          Tempat Terbaik Untuk Menyimpan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Ide Brilian</span> Anda.
        </h1>
        
        <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Ruang kerja digital yang dirancang untuk kecepatan dan kesederhanaan. Tulis catatan, lampirkan gambar, sematkan tag, dan akses dari mana saja. Tanpa batas.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
              Coba Sekarang Gratis <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-zinc-500 mt-4 sm:mt-0 sm:ml-4">Tidak perlu kartu kredit.</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Fitur Skala Enterprise</h2>
            <p className="text-muted-foreground">Dirancang untuk alur kerja modern dengan performa tinggi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-500" />}
              title="Performa Instan"
              description="Dibangun dengan teknologi SWR dan Edge Network. Perpindahan halaman instan tanpa loading berlebih."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-emerald-500" />}
              title="Keamanan Terjamin"
              description="Data Anda dilindungi oleh arsitektur Supabase yang aman dan validasi end-to-end yang solid."
            />
            <FeatureCard 
              icon={<Tags className="w-6 h-6 text-primary" />}
              title="Tag & Media Cerdas"
              description="Kelompokkan ide Anda dengan tag pintar dan simpan lampiran gambar maupun video dalam satu tempat."
            />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-card py-12 border-t border-border text-center text-muted-foreground text-sm">
        <p>© 2026 whtsn. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-background shadow-sm border border-border flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
