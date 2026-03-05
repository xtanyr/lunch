// Color palette definitions for the Omsk version
// Based on character themes from Honkai Star Rail and more

export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
    cardBg: string;
  };
}

export const PALETTES: ColorPalette[] = [
  {
    id: 'sparxie',
    name: 'Sparxie',
    colors: {
      primary: '#DC2626',      // Red
      secondary: '#1A1A1A',    // Black
      background: '#FFFFFF',   // White
      text: '#1A1A1A',         // Black
      textSecondary: '#6B7280', // Gray
      accent: '#DC2626',       // Red
      border: '#E5E7EB',       // Light gray
      cardBg: '#FFFFFF',       // White
    },
  },
  {
    id: 'march7th',
    name: 'March 7th',
    colors: {
      primary: '#F687B3',      // Pink
      secondary: '#FFFFFF',    // White
      background: '#FDF2F8',   // Very light pink
      text: '#2D3748',         // Dark gray
      textSecondary: '#718096', // Gray
      accent: '#F687B3',       // Pink
      border: '#FBCFE8',       // Light pink
      cardBg: '#FFFFFF',       // White
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#6366F1',      // Indigo
      secondary: '#4F46E5',    // Darker indigo
      background: '#1A1A1A',    // Dark
      text: '#F5F5F5',         // Light
      textSecondary: '#A0AEC0', // Gray
      accent: '#818CF8',       // Light indigo
      border: '#2D3748',       // Dark gray
      cardBg: '#262626',       // Darker gray
    },
  },
];

export const getPalette = (id: string): ColorPalette => {
  return PALETTES.find(p => p.id === id) || PALETTES[0]; // Default to Sparxie
};

export const getPaletteNames = (): { id: string; name: string }[] => {
  return PALETTES.map(p => ({ id: p.id, name: p.name }));
};
