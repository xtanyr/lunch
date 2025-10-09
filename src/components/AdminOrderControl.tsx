import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchDisabledDates, updateDisabledDates, DisabledDateRange } from '../api';
import Button from './ui/Button';
import Input from './ui/Input';

interface AdminOrderControlProps {
  selectedCity: string;
}

const AdminOrderControl: React.FC<AdminOrderControlProps> = ({ selectedCity }) => {
  const [disabledRange, setDisabledRange] = useState<DisabledDateRange | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDisabledRange();
  }, [selectedCity]);

  const loadDisabledRange = async () => {
    try {
      setLoading(true);
      setError(null);
      const range = await fetchDisabledDates(selectedCity);
      setDisabledRange(range);
      if (range) {
        setStartDate(new Date(range.startDate));
        setEndDate(new Date(range.endDate));
        setMessage(range.message);
      } else {
        setStartDate(null);
        setEndDate(null);
        setMessage('');
      }
    } catch (err) {
      console.error('Failed to load disabled range:', err);
      setError('Не удалось загрузить настройки отключенных дат.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      let range: DisabledDateRange | null = null;
      if (startDate && endDate && message.trim()) {
        range = {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          message: message.trim()
        };
      }
      await updateDisabledDates(range, selectedCity);
      setDisabledRange(range);
    } catch (err) {
      console.error('Failed to save disabled range:', err);
      setError('Не удалось сохранить изменения.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4139]"></div>
        <span className="ml-2">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Управление приемом заказов</h3>
        <p className="text-sm text-gray-600 mb-4">
          Выберите даты, для которых прием заказов будет отключен. Пользователи не смогут оформить заказ на эти даты.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">Настройки отключения заказов</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholderText="Выберите дату начала"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="yyyy-MM-dd"
                minDate={startDate || new Date()}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholderText="Выберите дату окончания"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сообщение для пользователей</label>
            <Input
              id="disabled-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Например: Заказы на эту неделю уже не принимаются"
              className="w-full"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleClear}
              variant="secondary"
              className="px-4 py-2"
            >
              Очистить
            </Button>
          </div>
        </div>
      </div>

      {disabledRange && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Текущие настройки</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">
              <strong>Период:</strong> {disabledRange.startDate} - {disabledRange.endDate}
            </p>
            <p className="text-sm text-red-800 mt-1">
              <strong>Сообщение:</strong> {disabledRange.message}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>
    </div>
  );
};

export default AdminOrderControl;