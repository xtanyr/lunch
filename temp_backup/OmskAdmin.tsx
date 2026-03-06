import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';

interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  weekNumber: number;
  isActive: boolean;
}

interface WeekMenu {
  weekNumber: number;
  isActive: boolean;
}

const OmskAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { palette } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'weeks' | 'menu' | 'orders'>('weeks');
  const [weeks, setWeeks] = useState<WeekMenu[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state for adding/editing dishes
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newDish, setNewDish] = useState({ name: '', category: 'hot', price: 0, weekNumber: 1 });
  
  // Date for orders
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load weeks
      const weeksRes = await fetch('/api/omsk/weeks');
      const weeksData = await weeksRes.json();
      setWeeks(weeksData);
      
      // Load dishes
      const dishesRes = await fetch('/api/omsk/dishes');
      const dishesData = await dishesRes.json();
      setDishes(dishesData);
      
      // Load orders
      const ordersRes = await fetch(`/api/omsk/orders/${selectedDate}?address=all`);
      const ordersData = await ordersRes.json();
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setActiveWeek = async (weekNumber: number) => {
    setSaving(true);
    try {
      const response = await fetch('/api/omsk/weeks/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber })
      });
      if (response.ok) {
        setWeeks(weeks.map(w => ({ ...w, isActive: w.weekNumber === weekNumber })));
      }
    } catch (error) {
      console.error('Failed to set active week:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDish = async () => {
    if (!newDish.name || !newDish.category) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/omsk/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDish)
      });
      if (response.ok) {
        const savedDish = await response.json();
        setDishes([...dishes, savedDish]);
        setNewDish({ name: '', category: 'hot', price: 0, weekNumber: 1 });
      }
    } catch (error) {
      console.error('Failed to save dish:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/omsk/dishes/${dishId}`, { method: 'DELETE' });
      setDishes(dishes.filter(d => d.id !== dishId));
    } catch (error) {
      console.error('Failed to delete dish:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDishActive = async (dish: Dish) => {
    setSaving(true);
    try {
      await fetch(`/api/omsk/dishes/${dish.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !dish.isActive })
      });
      setDishes(dishes.map(d => d.id === dish.id ? { ...d, isActive: !d.isActive } : d));
    } catch (error) {
      console.error('Failed to toggle dish:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Имя', 'Отдел', 'Блюда', 'Цена', 'Дата', 'Адрес'];
    const rows = orders.map(order => [
      order.employeeName,
      order.department,
      (order.items || []).map((i: any) => i.dishName).join(', '),
      order.totalPrice || 0,
      order.orderDate,
      order.address
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omsk_orders_${selectedDate}.csv`;
    link.click();
  };

  const categories = ['soup', 'hot', 'patty', 'salad', 'vegan', 'garnish', 'other'];
  const categoryLabels: Record<string, string> = {
    soup: 'Суп',
    hot: 'Горячее',
    patty: 'Мясо/Рыба',
    salad: 'Салат',
    vegan: 'Веган',
    garnish: 'Гарнир/Соусы',
    other: 'Другое'
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: palette.colors.background, color: palette.colors.text }}
    >
      {/* Header */}
      <header className="p-4 shadow-md" style={{ backgroundColor: '#1f2937' }}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/omsk')}
              className="text-white hover:underline"
            >
              ← К заказам
            </button>
            <h1 className="text-xl font-bold text-white">Админ Омск</h1>
          </div>
          <span style={{ color: palette.colors.primary, fontWeight: 'bold' }}>SQLite System</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: palette.colors.border }}>
        {(['weeks', 'menu', 'orders'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-6 py-3 font-medium transition"
            style={{ 
              borderBottom: activeTab === tab ? `2px solid ${palette.colors.primary}` : '2px solid transparent',
              color: activeTab === tab ? palette.colors.primary : palette.colors.textSecondary,
              backgroundColor: activeTab === tab ? palette.colors.cardBg : 'transparent'
            }}
          >
            {tab === 'weeks' ? 'Недели' : tab === 'menu' ? 'Меню' : 'Заказы'}
          </button>
        ))}
      </div>

      <main className="flex-grow container mx-auto p-6">
        {loading ? (
          <div className="text-center p-8">Загрузка...</div>
        ) : (
          <>
            {/* Weeks Tab */}
            {activeTab === 'weeks' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-6">Управление неделями</h2>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {weeks.map(week => (
                    <button
                      key={week.weekNumber}
                      onClick={() => setActiveWeek(week.weekNumber)}
                      disabled={saving}
                      className="p-6 rounded-lg border-2 transition-all"
                      style={{ 
                        borderColor: week.isActive ? palette.colors.primary : palette.colors.border,
                        backgroundColor: week.isActive ? palette.colors.primary + '20' : palette.colors.cardBg
                      }}
                    >
                      <div className="text-2xl font-bold mb-2">Неделя {week.weekNumber}</div>
                      <div 
                        className="text-sm px-3 py-1 rounded-full"
                        style={{ 
                          backgroundColor: week.isActive ? palette.colors.primary : palette.colors.border,
                          color: week.isActive ? 'white' : palette.colors.textSecondary
                        }}
                      >
                        {week.isActive ? 'Активна' : 'Неактивна'}
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: palette.colors.cardBg }}>
                  <h3 className="font-bold mb-2">Текущая неделя</h3>
                  <p>Активная неделя: <strong>Неделя {weeks.find(w => w.isActive)?.weekNumber || '-'}</strong></p>
                  <p className="text-sm mt-2" style={{ color: palette.colors.textSecondary }}>
                    Система автоматически использует меню активной недели для заказов.
                  </p>
                </div>
              </div>
            )}

            {/* Menu Tab */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Управление меню</h2>
                
                {/* Add new dish form */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border, borderWidth: 1 }}>
                  <h3 className="font-bold mb-4">Добавить блюдо</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <input
                      type="text"
                      placeholder="Название блюда"
                      value={newDish.name}
                      onChange={e => setNewDish({ ...newDish, name: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <select
                      value={newDish.category}
                      onChange={e => setNewDish({ ...newDish, category: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Цена (₽)"
                      value={newDish.price}
                      onChange={e => setNewDish({ ...newDish, price: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <select
                      value={newDish.weekNumber}
                      onChange={e => setNewDish({ ...newDish, weekNumber: parseInt(e.target.value) })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    >
                      {[1,2,3,4,5].map(w => (
                        <option key={w} value={w}>Неделя {w}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveDish}
                      disabled={saving || !newDish.name}
                      className="px-4 py-2 rounded text-white font-medium"
                      style={{ backgroundColor: palette.colors.primary }}
                    >
                      {saving ? 'Сохранение...' : 'Добавить'}
                    </button>
                  </div>
                </div>

                {/* Dishes by category */}
                {categories.map(category => {
                  const categoryDishes = dishes.filter(d => d.category === category);
                  if (categoryDishes.length === 0) return null;
                  return (
                    <div key={category} className="space-y-2">
                      <h3 className="text-lg font-bold" style={{ color: palette.colors.primary }}>
                        {categoryLabels[category]} ({categoryDishes.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {categoryDishes.map(dish => (
                          <div
                            key={dish.id}
                            className="p-3 rounded flex justify-between items-center"
                            style={{ 
                              backgroundColor: palette.colors.cardBg,
                              borderColor: palette.colors.border,
                              borderWidth: 1,
                              opacity: dish.isActive ? 1 : 0.5
                            }}
                          >
                            <div>
                              <div className="font-medium">{dish.name}</div>
                              <div className="text-sm" style={{ color: palette.colors.textSecondary }}>
                                Неделя {dish.weekNumber} • {dish.price} ₽
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleDishActive(dish)}
                                className="text-xs px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: dish.isActive ? palette.colors.primary + '20' : palette.colors.border,
                                  color: palette.colors.text
                                }}
                              >
                                {dish.isActive ? 'Активно' : 'Скрыто'}
                              </button>
                              <button
                                onClick={() => handleDeleteDish(dish.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Заказы</h2>
                  <div className="flex gap-4">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.cardBg, color: palette.colors.text }}
                    />
                    <button
                      onClick={() => {
                        fetch(`/api/omsk/orders/${selectedDate}?address=all`)
                          .then(res => res.json())
                          .then(data => setOrders(data));
                      }}
                      className="px-4 py-2 rounded text-white"
                      style={{ backgroundColor: palette.colors.primary }}
                    >
                      Загрузить
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, color: palette.colors.text }}
                    >
                      Экспорт CSV
                    </button>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center p-8" style={{ color: palette.colors.textSecondary }}>
                    Нет заказов на эту дату
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Summary */}
                    <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: palette.colors.cardBg }}>
                      <div className="flex justify-between items-center">
                        <span>Всего заказов: <strong>{orders.length}</strong></span>
                        <span>Общая сумма: <strong style={{ color: palette.colors.primary }}>
                          {orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)} ₽
                        </strong></span>
                      </div>
                    </div>
                    
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className="p-4 rounded-lg"
                        style={{ 
                          backgroundColor: palette.colors.cardBg,
                          borderColor: palette.colors.border,
                          borderWidth: 1
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold">{order.employeeName}</div>
                            <div className="text-sm" style={{ color: palette.colors.textSecondary }}>{order.department}</div>
                            <div className="text-sm mt-1">
                              {(order.items || []).map((i: any) => i.dishName).join(', ')}
                            </div>
                            <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                              {order.address} • {order.orderDate}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg" style={{ color: palette.colors.primary }}>
                              {order.totalPrice || 0} ₽
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default OmskAdmin;
