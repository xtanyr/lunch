import React, { useState, useEffect } from 'react';
import { Dish, SideDish, MenuConfig } from '../types';
import { MENU_ITEMS, SIDE_DISHES, CITIES } from '../constants';
import { fetchMenuItems, fetchSideDishes, updateMenuItems, fetchMenuConfig, updateMenuConfig } from '../api';
import AdminMenuManager from './AdminMenuManager';
import AdminMenuConfig from './AdminMenuConfig';
import Select from './ui/Select';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'config'>('items');
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    try { return localStorage.getItem('adminSelectedCity') || Object.keys(CITIES)[0]; } 
    catch { return Object.keys(CITIES)[0]; }
  });
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [sideDishes, setSideDishes] = useState<SideDish[]>([]);
  const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCity]);

  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    try { localStorage.setItem('adminSelectedCity', newCity); } catch {}
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [items, sides, config] = await Promise.all([
        fetchMenuItems(selectedCity),
        fetchSideDishes(selectedCity),
        fetchMenuConfig(selectedCity).catch(() => null)
      ]);
      
      setMenuItems(items || []);
      setSideDishes(sides || []);
      setMenuConfig(config);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Не удалось загрузить данные. Проверьте подключение к серверу.');
      
      // Fallback to default data on error
      setMenuItems(MENU_ITEMS);
      setSideDishes(SIDE_DISHES);
      setMenuConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemsUpdate = async (updatedItems: Dish[]) => {
    try {
      await updateMenuItems(updatedItems);
      setMenuItems(updatedItems);
      // Reload to ensure we have the latest data
      await loadData();
    } catch (err) {
      console.error('Failed to update menu items:', err);
      setError('Не удалось обновить список блюд.');
    }
  };

  const handleMenuConfigUpdate = async (updatedConfig: MenuConfig) => {
    try {
      await updateMenuConfig(updatedConfig);
      setMenuConfig(updatedConfig);
      // Reload to ensure we have the latest data
      await loadData();
    } catch (err) {
      console.error('Failed to update menu config:', err);
      setError('Не удалось обновить конфигурацию меню.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4139] mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Город:</span>
          <Select
            id="city-selector"
            value={selectedCity}
            onChange={handleCityChange}
            className="w-40"
            options={CITIES}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Закрыть</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'items' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Управление меню
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'config' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Настройки меню
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'items' && (
            <AdminMenuManager
              menuItems={menuItems}
              sideDishes={sideDishes}
              onMenuItemsUpdate={handleMenuItemsUpdate}
            />
          )}
          {activeTab === 'config' && menuConfig && (
            <AdminMenuConfig
              menuConfig={menuConfig}
              menuItems={menuItems}
              onMenuConfigUpdate={handleMenuConfigUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
