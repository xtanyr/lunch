import React from 'react';
import { useTheme } from '../theme/ThemeContext';

const Footer: React.FC = () => {
  const { palette } = useTheme();
  
  const images = [
    'March 7th.png',
    'March 7th_1.png',
    'March 7th_2.png',
    'March 7th_3.png',
    'March 7th_4.png',
    'March 7th_5.png',
    'March 7th_6.png',
    'March 7th_7.png',
    'March 7th_8.png',
    'March 7th_9.png',
    'March 7th_10.png',
    'March 7th_11.png',
    'March 7th_12.png',
    'March 7th_13.png',
    'March 7th_14.png',
    'March 7th_15.png',
    'March 7th_16.png',
    'March 7th_17.png',
    'March 7th_18.png',
    'March 7th_19.png',
    'March_25.png',
    'March 7th_26.png',
    'March 7th_27.png',
    'March 7th_28.png',
  ];
  const randomImage = images[Math.floor(Math.random() * images.length)];

  return (
    <footer
      className="p-4 text-center mt-auto border-t-2"
      style={{
        backgroundColor: palette.colors.background,
        borderColor: palette.colors.border,
      }}
    >
      <div className="container mx-auto flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-center">
        <p
          style={{ color: palette.colors.primary }}
          className="font-semibold mb-2 sm:mb-0"
        >
          xtany
        </p>
        <img
          src={"/m7/" + randomImage}
          alt="March 7th random"
          style={{ height: 64, width: 'auto', borderRadius: 8, boxShadow: '0 2px 8px #e0e0e0' }}
          loading="lazy"
        />
        <p
          style={{ color: palette.colors.secondary }}
          className="font-semibold mb-2 sm:mb-0"
        >
          dev
        </p>
      </div>
    </footer>
  );
};

export default Footer;
