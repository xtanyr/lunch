import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

const ADMIN_CODE = 'lunch20';

const AdminAccess: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ADMIN_CODE) {
      localStorage.setItem('adminCodeEntered', 'true');
      window.location.href = '/admin';
    } else {
      setError('Неверный код доступа');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Введите код доступа
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="access-code"
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
          <Button type="submit" variant="primary" className="w-full">
            Продолжить
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminAccess;
