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
    <header className="px-4 py-3 sm:p-5 shadow-md sticky top-0 z-40" style={{ backgroundColor: '#1f2937' }}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Обеды</h1>
          {!isAdmin && (
            <Link 
              to={isOmsk ? "/omsk/admin" : "/admin"} 
              className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded transition-colors hover:opacity-80"
              style={{ backgroundColor: palette.colors.primary, color: 'white' }}
            >
              Админ
            </Link>
          )}
          {isAdmin && (
            <Link 
              to="/" 
              className="text-xs sm:text-sm bg-gray-600 hover:bg-gray-700 px-2 sm:px-3 py-1 rounded transition-colors"
            >
              Заказы
            </Link>
          )}
          {children}
        </div>
        <span className="text-sm sm:text-lg md:text-2xl font-extrabold tracking-wide hidden sm:block md:block lg:hidden" style={{ color: palette.colors.primary, letterSpacing: '0.04em' }}>
          Los Pollos
        </span>
        <span className="text-xs sm:text-sm md:text-xl font-extrabold tracking-wide block sm:hidden lg:block" style={{ color: palette.colors.primary, letterSpacing: '0.02em' }}>
          LPS
        </span>
      </div>
    </header>
  );
};

export default Header;
