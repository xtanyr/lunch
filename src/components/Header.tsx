import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="bg-black text-white p-5 shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Обеды</h1>
          {!isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm bg-[#ff4139] hover:bg-[#e0352f] px-3 py-1 rounded transition-colors"
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
        </div>
        <span className="text-lg md:text-2xl font-extrabold tracking-wide" style={{ color: '#ff4139', letterSpacing: '0.04em' }}>
          Los Pollos Skuratov's
        </span>
      </div>
    </header>
  );
};

export default Header;
