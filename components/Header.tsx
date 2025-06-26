import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-black text-white p-5 shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Обеды</h1>
        <span className="text-lg md:text-2xl font-extrabold tracking-wide" style={{ color: '#ff4139', letterSpacing: '0.04em' }}>
          Los Pollos Skuratov's
        </span>
      </div>
    </header>
  );
};

export default Header;