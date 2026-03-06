import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';

const ThemeSelector: React.FC = () => {
  const { paletteId, setPalette, palettes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentPalette = palettes.find(p => p.id === paletteId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-card-bg)] hover:bg-[var(--color-background)] transition-colors"
        style={{ color: 'var(--color-text)' }}
      >
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: currentPalette?.colors.primary }}
        />
        <span className="text-sm">{currentPalette?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1 w-40 rounded-md shadow-lg z-50 overflow-hidden"
          style={{ 
            backgroundColor: 'var(--color-card-bg)',
            border: '1px solid var(--color-border)'
          }}
        >
          {palettes.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPalette(p.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors ${
                paletteId === p.id ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-background)]'
              }`}
              style={paletteId !== p.id ? { color: 'var(--color-text)' } : {}}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: p.colors.primary }}
              />
              <span className="text-sm">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
