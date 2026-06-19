import React, { useState, useEffect } from 'react';
import { Dish, DishCategory } from '../types';
import { fetchSpbPeriods, updateSpbPeriodMenu, addSpbPeriods } from '../api';
import { CITY_ADDRESSES } from '../constants';
import AdminMenuManager from './AdminMenuManager';
import Select from './ui/Select';
import Button from './ui/Button';

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

const formatDate = (dateStr: string): string => {
  // Parse date string in local time to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayNum = date.getDate().toString().padStart(2, '0');
  const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${dayNum}.${monthNum}`;
};

const SpbAdmin: React.FC = () => {
  // SPB-specific category options: replace "Одно блюдо" with "Супы"
  const spbCategoryOptions = [
    { id: 'all', label: 'Все категории' },
    { id: DishCategory.SALAD, label: 'Салаты' },
    { id: DishCategory.HOT_DISH, label: 'Горячее' },
    { id: DishCategory.SOUP, label: 'Супы' }
  ];
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [periodMenuItems, setPeriodMenuItems] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [bulkImportText, setBulkImportText] = useState<string>('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [selectedExportAddress, setSelectedExportAddress] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isAddingPeriods, setIsAddingPeriods] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadPeriodMenu(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const data = await fetchSpbPeriods();
      setPeriods(data);
      if (data.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load periods:', err);
      setError('Не удалось загрузить периоды');
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodMenu = async (periodId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/spb/menu/${periodId}?city=spb`);
      if (!response.ok) throw new Error('Failed to fetch period menu');
      const items = await response.json();
      setPeriodMenuItems(items);
    } catch (err) {
      console.error('Failed to load period menu:', err);
      setError('Не удалось загрузить меню периода');
      setPeriodMenuItems([]);
    }
  };

  const handleMenuUpdate = async (updatedItems: Dish[]) => {
    if (!selectedPeriodId) return;
    try {
      setError(null);
      await updateSpbPeriodMenu(selectedPeriodId, updatedItems);
      setPeriodMenuItems(updatedItems);
      setMessage('Меню обновлено');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update period menu:', err);
      setError('Не удалось сохранить меню');
    }
  };

  const parseBulkImport = (text: string): Dish[] => {
    const lines = text.trim().split('\n');
    const newItems: Dish[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Split by tabs (multiple tabs)
      const parts = trimmedLine.split('\t').map(p => p.trim()).filter(p => p);
      if (parts.length < 2) return;
      
      const name = parts[0];
      const composition = parts.slice(1).join(', ');
      
      // Generate ID from name
      const id = `dish_${name.toLowerCase().replace(/[^a-zа-я0-9]/gi, '_')}_${index}`;
      
      newItems.push({
        id,
        name,
        price: 225, // Default price for SPB
        category: 'Горячее' as any, // Not used for SPB
        composition,
        garnishGrams: 250,
        isActive: true
      });
    });
    
    return newItems;
  };

  const handleBulkImport = () => {
    try {
      const newItems = parseBulkImport(bulkImportText);
      if (newItems.length === 0) {
        setError('Не удалось распознать блюда. Проверьте формат данных.');
        return;
      }
      
      const updatedItems = [...periodMenuItems, ...newItems];
      handleMenuUpdate(updatedItems);
      setBulkImportText('');
      setShowBulkImport(false);
      setMessage(`Добавлено ${newItems.length} блюд`);
    } catch (err) {
      console.error('Bulk import failed:', err);
      setError('Ошибка при импорте');
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        startDate: exportStartDate,
        endDate: exportEndDate,
        address: selectedExportAddress || 'all'
      });
      
      const response = await fetch(`/api/spb/export/excel?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spb_orders_${exportStartDate}_${exportEndDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage('Экспорт выполнен успешно');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Ошибка при экспорте');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddPeriods = async () => {
    setIsAddingPeriods(true);
    try {
      const result = await addSpbPeriods(20);
      setMessage(`Добавлено ${result.added} периодов. Всего: ${result.total}`);
      await loadPeriods();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Failed to add periods:', err);
      setError('Не удалось добавить периоды');
    } finally {
      setIsAddingPeriods(false);
    }
  };

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4139] mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Админка Санкт-Петербург</h1>
          <a href="/" className="text-sm text-blue-600 hover:underline">← На главную</a>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Выберите период</h2>
            <Button
              onClick={() => setShowBulkImport(!showBulkImport)}
              variant="secondary"
              className="text-sm"
            >
              {showBulkImport ? 'Скрыть импорт' : 'Массовый импорт блюд'}
            </Button>
            <Button
              onClick={handleAddPeriods}
              disabled={isAddingPeriods}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAddingPeriods ? 'Добавление...' : 'Добавить 20 периодов'}
            </Button>
          </div>
          {periods.length === 0 ? (
            <p>Нет доступных периодов</p>
          ) : (
            <Select
              id="period-select"
              value={selectedPeriodId}
              onChange={setSelectedPeriodId}
              options={periods.map(p => ({ id: p.id, label: p.name }))}
              className="max-w-xs"
            />
          )}
          {selectedPeriod && (
            <p className="mt-2 text-sm text-gray-600">
              Период: {formatDate(selectedPeriod.startDate)} — {formatDate(selectedPeriod.endDate)}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Экспорт заказов в Excel</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Начальная дата</label>
              <input
                type="date"
                value={exportStartDate}
                onChange={e => setExportStartDate(e.target.value)}
                className="px-3 py-2 rounded border"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Конечная дата</label>
              <input
                type="date"
                value={exportEndDate}
                onChange={e => setExportEndDate(e.target.value)}
                className="px-3 py-2 rounded border"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Адрес</label>
              <select
                value={selectedExportAddress}
                onChange={e => setSelectedExportAddress(e.target.value)}
                className="px-3 py-2 rounded border"
              >
                <option value="all">Все адреса</option>
                {(CITY_ADDRESSES.spb || []).map(addr => (
                  <option key={addr.id} value={addr.id}>{addr.label}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={exportToExcel}
              disabled={isExporting || !exportStartDate || !exportEndDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExporting ? 'Экспорт...' : 'Экспорт Excel'}
            </Button>
          </div>
        </div>

        {showBulkImport && selectedPeriodId && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Массовый импорт блюд</h2>
            <p className="text-sm text-gray-600 mb-2">
              Вставьте список блюд в формате: Название блюда[TAB]ингредиенты (через запятую)
            </p>
            <textarea
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder="Зеленый крем суп с брокколи (вег)&#9;шпинат,горох,брокколи,соль,кокосовые сливки&#10;Салат цезарь&#9;айсберг,романо,пармезан,соль,цыпленок"
              className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm"
            />
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleBulkImport}
                disabled={!bulkImportText.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                Импортировать блюда
              </Button>
              <Button
                onClick={() => {
                  setBulkImportText('');
                  setShowBulkImport(false);
                }}
                variant="secondary"
              >
                Отмена
              </Button>
            </div>
          </div>
        )}

        {selectedPeriodId && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Меню {selectedPeriod?.name}
              </h2>
            </div>
            <div className="p-6">
              <AdminMenuManager
                menuItems={periodMenuItems}
                sideDishes={[]}
                onMenuItemsUpdate={handleMenuUpdate}
                categoryOptions={spbCategoryOptions}
                defaultPrice={225}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpbAdmin;
