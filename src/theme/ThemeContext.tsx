import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ColorPalette, getPalette, PALETTES } from './palettes';

interface ThemeContextType {
  palette: ColorPalette;
  paletteId: string;
  setPalette: (id: string) => void;
  palettes: ColorPalette[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'omsk_theme_id';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [paletteId, setPaletteId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && PALETTES.some(p => p.id === saved)) {
        return saved;
      }
    } catch {
      // localStorage not available
    }
    return 'sparxie'; // Default to Sparxie
  });

  const palette = getPalette(paletteId);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, paletteId);
    } catch {
      // localStorage not available
    }
    
    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', palette.colors.primary);
    root.style.setProperty('--color-secondary', palette.colors.secondary);
    root.style.setProperty('--color-background', palette.colors.background);
    root.style.setProperty('--color-text', palette.colors.text);
    root.style.setProperty('--color-text-secondary', palette.colors.textSecondary);
    root.style.setProperty('--color-accent', palette.colors.accent);
    root.style.setProperty('--color-border', palette.colors.border);
    root.style.setProperty('--color-card-bg', palette.colors.cardBg);
  }, [paletteId, palette]);

  const handlePaletteChange = (id: string) => {
    if (PALETTES.some(p => p.id === id)) {
      setPaletteId(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ palette, paletteId, setPalette: handlePaletteChange, palettes: PALETTES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
