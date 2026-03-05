import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CITIES } from '../constants';
import { useTheme } from '../theme/ThemeContext';

const CitySelector: React.FC = () => {
  const navigate = useNavigate();
  const { palette } = useTheme();

  const handleCitySelect = (cityId: string) => {
    if (cityId === 'omsk') {
      navigate('/omsk');
    } else {
      navigate(`/${cityId}`);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: palette.colors.background }}
    >
      <div className="text-center mb-12">
        <h1 
          className="text-5xl font-bold mb-4"
          style={{ color: palette.colors.text }}
        >
          Выберите город
        </h1>
        <p 
          className="text-lg"
          style={{ color: palette.colors.textSecondary }}
        >
          Select your city to continue
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 max-w-4xl w-full">
        {CITIES.map((city, index) => (
          <button
            key={city.id}
            onClick={() => handleCitySelect(city.id)}
            className={`
              p-8 transition-all duration-200
              flex flex-col items-center justify-center gap-4
              hover:opacity-80
              border-r border-b
              ${city.id === 'omsk' ? 'border-l' : ''}
            `}
            style={{ 
              backgroundColor: city.id === 'omsk' ? palette.colors.primary : palette.colors.cardBg,
              borderColor: palette.colors.border
            }}
          >
            <div 
              className="w-20 h-20 flex items-center justify-center text-4xl"
              style={{ 
                backgroundColor: city.id === 'omsk' ? 'white' : palette.colors.primary + '20',
                color: city.id === 'omsk' ? palette.colors.primary : palette.colors.text
              }}
            >
              {city.id === 'omsk' ? '🍽️' : '🏙️'}
            </div>
            <span 
              className="text-xl font-bold"
              style={{ 
                color: city.id === 'omsk' ? 'white' : palette.colors.text 
              }}
            >
              {city.label}
            </span>
            {city.id === 'omsk' && (
              <span 
                className="text-sm font-medium px-3 py-1 rounded"
                style={{ backgroundColor: 'white', color: palette.colors.primary }}
              >
                New System
              </span>
            )}
          </button>
        ))}
      </div>

      <div 
        className="mt-12 text-center"
        style={{ color: palette.colors.textSecondary }}
      >
        <p>Омск использует новую систему заказов</p>
        <p>Другие города используют текущую версию</p>
      </div>
    </div>
  );
};

export default CitySelector;
