import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemePaletteContextType {
  palette: string;
  setPalette: (palette: string) => void;
}

const ThemePaletteContext = createContext<ThemePaletteContextType>({
  palette: 'default',
  setPalette: () => {},
});

export const ThemePaletteProvider = ({ children }: { children: React.ReactNode }) => {
  const [palette, setPaletteState] = useState('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme-palette') || 'default';
    setPaletteState(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const setPalette = (newPalette: string) => {
    setPaletteState(newPalette);
    localStorage.setItem('theme-palette', newPalette);
    document.documentElement.setAttribute('data-theme', newPalette);
  };

  // Prevent hydration mismatch by rendering default immediately, but actually we can just render children
  return (
    <ThemePaletteContext.Provider value={{ palette: mounted ? palette : 'default', setPalette }}>
      {children}
    </ThemePaletteContext.Provider>
  );
};

export const useThemePalette = () => useContext(ThemePaletteContext);
