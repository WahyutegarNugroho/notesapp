import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

interface ThemePaletteContextType {
  palette: string;
  setPalette: (palette: string) => void;
}

const ThemePaletteContext = createContext<ThemePaletteContextType>({
  palette: 'default',
  setPalette: () => {},
});

export const ThemePaletteProvider = ({ children }: { children: React.ReactNode }) => {
  const [palette, setPaletteState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme-palette') || 'default';
    }
    return 'default';
  });
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', palette);
  }, [palette]);

  const setPalette = (newPalette: string) => {
    setPaletteState(newPalette);
    localStorage.setItem('theme-palette', newPalette);
    document.documentElement.setAttribute('data-theme', newPalette);
  };

  return (
    <ThemePaletteContext.Provider value={{ palette: mounted ? palette : 'default', setPalette }}>
      {children}
    </ThemePaletteContext.Provider>
  );
};

export const useThemePalette = () => useContext(ThemePaletteContext);
