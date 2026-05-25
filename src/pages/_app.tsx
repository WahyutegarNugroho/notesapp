import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from 'next-themes';
import { ThemePaletteProvider } from '../contexts/ThemePaletteContext';
import { Toaster } from '../components/ui/sonner';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      themes={['light', 'dark']}
    >
      <ThemePaletteProvider>
        <AuthProvider>
          <Component {...pageProps} />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemePaletteProvider>
    </ThemeProvider>
  );
}
