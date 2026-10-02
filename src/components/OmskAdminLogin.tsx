import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import Button from './ui/Button';
import Input from './ui/Input';
import { loginAdmin } from '../utils/adminSession';

const OmskAdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await loginAdmin('omsk', code);
      if (result.valid) {
        window.location.href = '/omsk/admin';
      } else {
        setError(result.retryAfterSeconds
          ? `Слишком много попыток. Попробуйте снова через ${result.retryAfterSeconds} сек.`
          : 'Неверный код доступа');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: palette.colors.background }}
    >
      <div 
        className="max-w-md w-full space-y-4 p-8 rounded-lg shadow-md"
        style={{ backgroundColor: palette.colors.cardBg }}
      >
        <h2 
          className="text-2xl font-bold text-center"
          style={{ color: palette.colors.text }}
        >
          Омск Админ — Введите код доступа
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="omsk-access-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            placeholder="Введите код доступа"
            className="w-full"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
            {isLoading ? 'Проверка...' : 'Продолжить'}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/omsk')}
            className="w-full text-center text-sm hover:underline"
            style={{ color: palette.colors.textSecondary }}
          >
            ← Назад к заказам
          </button>
        </form>
      </div>
    </div>
  );
};

export default OmskAdminLogin;
