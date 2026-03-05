import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isOmsk = location.pathname.startsWith('/omsk');
  const { palette } = useTheme();

  return (
    <header className="p-5 shadow-md sticky top-0 z-40" style={{ backgroundColor: '#1f2937' }}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Обеды</h1>
          {!isAdmin && (
            <Link 
              to={isOmsk ? "/omsk/admin" : "/admin"} 
              className="text-sm px-3 py-1 rounded transition-colors hover:opacity-80"
              style={{ backgroundColor: palette.colors.primary, color: 'white' }}
            >
              Админ
            </Link>
          )}
          {isAdmin && (
            <Link 
              to="/" 
              className="text-sm bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded transition-colors"
            >
              Заказы
            </Link>
          )}
          {children}
        </div>
        <span className="text-lg md:text-2xl font-extrabold tracking-wide" style={{ color: palette.colors.primary, letterSpacing: '0.04em' }}>
          Los Pollos Skuratov's
        </span>
      </div>
    </header>
  );
};

export default Header;
