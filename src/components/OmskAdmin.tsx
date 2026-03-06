import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';

interface Dish {
  id: string;
  name: string;
  category: string;
  weekNumber: number;
  isActive: boolean;
  composition?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
}

interface WeekMenu {
  weekNumber: number;
  isActive: boolean;
}

const OmskAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { palette } = useTheme();
  
  // Get admin code from localStorage for API authentication
  const getAdminCode = () => localStorage.getItem('omskAdminCodeEntered') || '';
  
  const handleLogout = () => {
    localStorage.removeItem('omskAdminCodeEntered');
    navigate('/omsk');
  };
  
  const [activeTab, setActiveTab] = useState<'weeks' | 'menu' | 'garnishes' | 'sauces' | 'vegan' | 'disabled' | 'orders'>('weeks');
  const [weeks, setWeeks] = useState<WeekMenu[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [garnishes, setGarnishes] = useState<any[]>([]);
  const [sauces, setSauces] = useState<any[]>([]);
  const [veganItems, setVeganItems] = useState<any[]>([]);
  const [disabledDates, setDisabledDates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Selected week for viewing its dishes
  const [selectedWeekForMenu, setSelectedWeekForMenu] = useState<number | null>(null);
  
  // Form state for adding dishes
  const [newDish, setNewDish] = useState({
    name: '',
    category: 'hot',
    weekNumber: 1,
    composition: '',
    protein: '',
    carbs: '',
    fats: '',
    grams: '',
    calories: ''
  });
  
  // Form state for adding garnishes
  const [newGarnish, setNewGarnish] = useState({
    name: '',
    grams: '',
    calories: ''
  });
  
  // Form state for adding sauces
  const [newSauce, setNewSauce] = useState({
    name: '',
    grams: '',
    calories: ''
  });
  
  // Form state for adding vegan items
  const [newVeganItem, setNewVeganItem] = useState({
    name: '',
    price: '',
    composition: '',
    protein: '',
    carbs: '',
    fats: '',
    grams: '',
    calories: ''
  });
  
  // Form state for disabled dates
  const [newDisabledDate, setNewDisabledDate] = useState({
    startDate: '',
    endDate: '',
    message: ''
  });
  
  // Date for orders
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  
  // Date range for export
  const [exportStartDate, setExportStartDate] = useState(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
  });
  
  const [exportEndDate, setExportEndDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  
  const [selectedExportAddress, setSelectedExportAddress] = useState('all');
  
  const [isExporting, setIsExporting] = useState(false);

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
      
      // Load garnishes
      const garnishesRes = await fetch('/api/omsk/garnishes');
      const garnishesData = await garnishesRes.json();
      setGarnishes(garnishesData);
      
      // Load sauces
      const saucesRes = await fetch('/api/omsk/sauces');
      const saucesData = await saucesRes.json();
      setSauces(saucesData);
      
      // Load vegan items
      const veganRes = await fetch('/api/omsk/vegan-items');
      const veganData = await veganRes.json();
      setVeganItems(veganData);
      
      // Load disabled dates
      const disabledRes = await fetch('/api/omsk/disabled-dates');
      const disabledData = await disabledRes.json();
      setDisabledDates(disabledData);
      
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
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify(newDish)
      });
      if (response.ok) {
        const savedDish = await response.json();
        setDishes([...dishes, savedDish]);
        setNewDish({ name: '', category: 'hot', weekNumber: 1, composition: '', protein: '', carbs: '', fats: '', grams: '', calories: '' });
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
      await fetch(`/api/omsk/dishes/${dishId}`, { 
        method: 'DELETE',
        headers: { 'x-admin-code': getAdminCode() }
      });
      setDishes(dishes.filter(d => d.id !== dishId));
    } catch (error) {
      console.error('Failed to delete dish:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGarnish = async () => {
    if (!newGarnish.name.trim()) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/omsk/garnishes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify({ 
          name: newGarnish.name,
          grams: parseInt(newGarnish.grams) || 50,
          calories: parseInt(newGarnish.calories) || 0
        })
      });
      
      if (response.ok) {
        const newGarnishData = await response.json();
        setGarnishes([...garnishes, newGarnishData]);
        setNewGarnish({ name: '', grams: '', calories: '' });
      }
    } catch (error) {
      console.error('Failed to add garnish:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGarnish = async (garnishId: string) => {
    setSaving(true);
    try {
      const garnish = garnishes.find(g => g.id === garnishId);
      await fetch(`/api/omsk/garnishes/${garnishId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify({ isActive: !garnish?.isActive })
      });
      
      setGarnishes(garnishes.map(g => 
        g.id === garnishId ? { ...g, isActive: !g.isActive } : g
      ));
    } catch (error) {
      console.error('Failed to toggle garnish:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGarnish = async (garnishId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/omsk/garnishes/${garnishId}`, { 
        method: 'DELETE',
        headers: { 'x-admin-code': getAdminCode() }
      });
      setGarnishes(garnishes.filter(g => g.id !== garnishId));
    } catch (error) {
      console.error('Failed to delete garnish:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSauce = async () => {
    if (!newSauce.name.trim()) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/omsk/sauces', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify({ 
          name: newSauce.name,
          grams: parseInt(newSauce.grams) || 30,
          calories: parseInt(newSauce.calories) || 0
        })
      });
      
      if (response.ok) {
        const newSauceData = await response.json();
        setSauces([...sauces, newSauceData]);
        setNewSauce({ name: '', grams: '', calories: '' });
      }
    } catch (error) {
      console.error('Failed to add sauce:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSauce = async (sauceId: string) => {
    setSaving(true);
    try {
      const sauce = sauces.find(s => s.id === sauceId);
      await fetch(`/api/omsk/sauces/${sauceId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify({ isActive: !sauce?.isActive })
      });
      
      setSauces(sauces.map(s => 
        s.id === sauceId ? { ...s, isActive: !s.isActive } : s
      ));
    } catch (error) {
      console.error('Failed to toggle sauce:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSauce = async (sauceId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/omsk/sauces/${sauceId}`, { 
        method: 'DELETE',
        headers: { 'x-admin-code': getAdminCode() }
      });
      setSauces(sauces.filter(s => s.id !== sauceId));
    } catch (error) {
      console.error('Failed to delete sauce:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddVeganItem = async () => {
    if (!newVeganItem.name.trim() || !newVeganItem.price.trim()) {
      alert('Название и цена обязательны');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/omsk/vegan-items', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify({
          name: newVeganItem.name,
          price: parseFloat(newVeganItem.price),
          composition: newVeganItem.composition,
          protein: parseFloat(newVeganItem.protein) || 0,
          carbs: parseFloat(newVeganItem.carbs) || 0,
          fats: parseFloat(newVeganItem.fats) || 0,
          grams: parseInt(newVeganItem.grams) || 100,
          calories: parseInt(newVeganItem.calories) || 0
        })
      });
      
      if (response.ok) {
        const newVeganData = await response.json();
        setVeganItems([...veganItems, newVeganData]);
        setNewVeganItem({
          name: '',
          price: '',
          composition: '',
          protein: '',
          carbs: '',
          fats: '',
          grams: '',
          calories: ''
        });
      }
    } catch (error) {
      console.error('Failed to add vegan item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVeganItem = async (itemId: string) => {
    setSaving(true);
    try {
      const item = veganItems.find(i => i.id === itemId);
      await fetch(`/api/omsk/vegan-items/${itemId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify({ isActive: !item?.isActive })
      });
      
      setVeganItems(veganItems.map(i => 
        i.id === itemId ? { ...i, isActive: !i.isActive } : i
      ));
    } catch (error) {
      console.error('Failed to toggle vegan item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVeganItem = async (itemId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/omsk/vegan-items/${itemId}`, { 
        method: 'DELETE',
        headers: { 'x-admin-code': getAdminCode() }
      });
      setVeganItems(veganItems.filter(i => i.id !== itemId));
    } catch (error) {
      console.error('Failed to delete vegan item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDisabledDate = async () => {
    if (!newDisabledDate.startDate || !newDisabledDate.endDate) {
      alert('Начальная и конечная даты обязательны');
      return;
    }
    
    if (new Date(newDisabledDate.startDate) > new Date(newDisabledDate.endDate)) {
      alert('Начальная дата не может быть позже конечной');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/omsk/disabled-dates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify({
          startDate: newDisabledDate.startDate,
          endDate: newDisabledDate.endDate,
          message: newDisabledDate.message
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setDisabledDates(result);
        setNewDisabledDate({
          startDate: '',
          endDate: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Failed to add disabled date:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDisabledDate = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/omsk/disabled-dates', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        }
      });
      
      if (response.ok) {
        setDisabledDates(null);
      }
    } catch (error) {
      console.error('Failed to remove disabled date:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDishActive = async (dish: Dish) => {
    setSaving(true);
    try {
      await fetch(`/api/omsk/dishes/${dish.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-code': getAdminCode()
        },
        body: JSON.stringify({ isActive: !dish.isActive })
      });
      setDishes(dishes.map(d => d.id === dish.id ? { ...d, isActive: !d.isActive } : d));
    } catch (error) {
      console.error('Failed to toggle dish:', error);
    } finally {
      setSaving(false);
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
      
      const response = await fetch(`/api/omsk/export/excel?${params}`, {
        headers: {
          'x-admin-code': getAdminCode()
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Create blob from response and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omsk_orders_${exportStartDate}_${exportEndDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Ошибка экспорта');
    } finally {
      setIsExporting(false);
    }
  };

  const categories = ['soup', 'broth', 'hot', 'salad', 'vegan', 'garnish', 'sauce', 'other'];
  const categoryLabels: Record<string, string> = {
    soup: 'Суп',
    broth: 'Бульон',
    hot: 'Горячее',
    salad: 'Салат',
    vegan: 'Веган',
    garnish: 'Гарнир',
    sauce: 'Соусы',
    other: 'Дополнительно'
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
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-white hover:underline text-sm"
            >
              Выйти
            </button>
            <span style={{ color: palette.colors.primary, fontWeight: 'bold' }}>SQLite System</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: palette.colors.border }}>
        {(['weeks', 'menu', 'garnishes', 'sauces', 'vegan', 'disabled', 'orders'] as const).map(tab => (
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
            {tab === 'weeks' ? 'Недели' : tab === 'menu' ? 'Меню' : tab === 'garnishes' ? 'Гарниры' : tab === 'sauces' ? 'Соусы' : tab === 'vegan' ? 'Дополнительные блюда' : tab === 'disabled' ? 'Блокировка заказов' : 'Заказы'}
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

                {/* Week Menu Viewer */}
                <div className="mt-8">
                  <h3 className="font-bold mb-4">Меню недели</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {weeks.map(week => (
                      <button
                        key={week.weekNumber}
                        onClick={() => setSelectedWeekForMenu(week.weekNumber)}
                        className="px-4 py-2 rounded"
                        style={{ 
                          backgroundColor: selectedWeekForMenu === week.weekNumber ? palette.colors.primary : palette.colors.border,
                          color: selectedWeekForMenu === week.weekNumber ? 'white' : palette.colors.text
                        }}
                      >
                        Неделя {week.weekNumber}
                      </button>
                    ))}
                  </div>
                  
                  {selectedWeekForMenu && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map(cat => {
                        const weekDishes = dishes.filter(d => d.weekNumber === selectedWeekForMenu && d.category === cat);
                        if (weekDishes.length === 0) return null;
                        return (
                          <div key={cat} className="p-4 rounded-lg" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border, borderWidth: 1 }}>
                            <h4 className="font-bold mb-2" style={{ color: palette.colors.primary }}>{categoryLabels[cat]}</h4>
                            {weekDishes.map(dish => (
                              <div key={dish.id} className="flex justify-between items-center py-1">
                                <span>{dish.name}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      {dishes.filter(d => d.weekNumber === selectedWeekForMenu).length === 0 && (
                        <p style={{ color: palette.colors.textSecondary }}>Нет блюд для этой недели</p>
                      )}
                    </div>
                  )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Состав ( composition )"
                      value={newDish.composition}
                      onChange={e => setNewDish({ ...newDish, composition: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Белки (г)"
                      value={newDish.protein}
                      onChange={e => setNewDish({ ...newDish, protein: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Углеводы (г)"
                      value={newDish.carbs}
                      onChange={e => setNewDish({ ...newDish, carbs: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Жиры (г)"
                      value={newDish.fats}
                      onChange={e => setNewDish({ ...newDish, fats: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Вес (г)"
                      value={newDish.grams}
                      onChange={e => setNewDish({ ...newDish, grams: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Калории (ккал)"
                      value={newDish.calories}
                      onChange={e => setNewDish({ ...newDish, calories: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                  </div>
                  <button
                    onClick={handleSaveDish}
                    disabled={saving || !newDish.name}
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: palette.colors.primary }}
                  >
                    {saving ? 'Сохранение...' : 'Добавить'}
                  </button>
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
                                Неделя {dish.weekNumber}
                              </div>
                              {(dish.composition || dish.protein || dish.carbs || dish.fats) && (
                                <div className="text-xs" style={{ color: palette.colors.textSecondary }}>
                                  {dish.composition && <span>{dish.composition}</span>}
                                  {dish.protein && <span> Б: {dish.protein}г</span>}
                                  {dish.carbs && <span> У: {dish.carbs}г</span>}
                                  {dish.fats && <span> Ж: {dish.fats}г</span>}
                                </div>
                              )}
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

            {/* Garnishes Tab */}
            {activeTab === 'garnishes' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Управление гарнирами</h2>
                
                {/* Add new garnish form */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border, borderWidth: 1 }}>
                  <h3 className="font-bold mb-4">Добавить гарнир</h3>
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Название гарнира"
                      value={newGarnish.name}
                      onChange={e => setNewGarnish({ ...newGarnish, name: e.target.value })}
                      className="flex-1 px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Вес (г)"
                      value={newGarnish.grams}
                      onChange={e => setNewGarnish({ ...newGarnish, grams: e.target.value })}
                      className="w-24 px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Калории (ккал)"
                      value={newGarnish.calories}
                      onChange={e => setNewGarnish({ ...newGarnish, calories: e.target.value })}
                      className="w-28 px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <button
                      onClick={handleAddGarnish}
                      className="px-4 py-2 rounded text-white"
                      style={{ backgroundColor: palette.colors.primary }}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
                
                {/* Garnishes list */}
                <div className="space-y-2">
                  {garnishes.map(garnish => (
                    <div key={garnish.id} className="p-4 rounded-lg border flex justify-between items-center" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border }}>
                      <div>
                        <div className="font-semibold">{garnish.name}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleGarnish(garnish.id)}
                          className="px-3 py-1 rounded text-sm"
                          style={{ 
                            backgroundColor: garnish.isActive ? palette.colors.primary + '20' : palette.colors.border,
                            color: palette.colors.text
                          }}
                        >
                          {garnish.isActive ? 'Активно' : 'Скрыто'}
                        </button>
                        <button
                          onClick={() => handleDeleteGarnish(garnish.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sauces Tab */}
            {activeTab === 'sauces' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Управление соусами</h2>
                
                {/* Add new sauce form */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border, borderWidth: 1 }}>
                  <h3 className="font-bold mb-4">Добавить соус</h3>
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Название соуса"
                      value={newSauce.name}
                      onChange={e => setNewSauce({ ...newSauce, name: e.target.value })}
                      className="flex-1 px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Вес (г)"
                      value={newSauce.grams}
                      onChange={e => setNewSauce({ ...newSauce, grams: e.target.value })}
                      className="w-24 px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Калории (ккал)"
                      value={newSauce.calories}
                      onChange={e => setNewSauce({ ...newSauce, calories: e.target.value })}
                      className="w-28 px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <button
                      onClick={handleAddSauce}
                      className="px-4 py-2 rounded text-white"
                      style={{ backgroundColor: palette.colors.primary }}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
                
                {/* Sauces list */}
                <div className="space-y-2">
                  {sauces.map(sauce => (
                    <div key={sauce.id} className="p-4 rounded-lg border flex justify-between items-center" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border }}>
                      <div>
                        <div className="font-semibold">{sauce.name}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleSauce(sauce.id)}
                          className="px-3 py-1 rounded text-sm"
                          style={{ 
                            backgroundColor: sauce.isActive ? palette.colors.primary + '20' : palette.colors.border,
                            color: palette.colors.text
                          }}
                        >
                          {sauce.isActive ? 'Активно' : 'Скрыто'}
                        </button>
                        <button
                          onClick={() => handleDeleteSauce(sauce.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vegan Dishes Tab */}
            {activeTab === 'vegan' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Управление дополнительными блюдами</h2>
                
                {/* Add new vegan item form */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border, borderWidth: 1 }}>
                  <h3 className="font-bold mb-4">Добавить дополнительное блюдо</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Название блюда"
                      value={newVeganItem.name}
                      onChange={e => setNewVeganItem({ ...newVeganItem, name: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Цена"
                      value={newVeganItem.price}
                      onChange={e => setNewVeganItem({ ...newVeganItem, price: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="text"
                      placeholder="Состав"
                      value={newVeganItem.composition}
                      onChange={e => setNewVeganItem({ ...newVeganItem, composition: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Белки (г)"
                      value={newVeganItem.protein}
                      onChange={e => setNewVeganItem({ ...newVeganItem, protein: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Углеводы (г)"
                      value={newVeganItem.carbs}
                      onChange={e => setNewVeganItem({ ...newVeganItem, carbs: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Жиры (г)"
                      value={newVeganItem.fats}
                      onChange={e => setNewVeganItem({ ...newVeganItem, fats: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Вес (г)"
                      value={newVeganItem.grams}
                      onChange={e => setNewVeganItem({ ...newVeganItem, grams: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                    <input
                      type="number"
                      placeholder="Калории (ккал)"
                      value={newVeganItem.calories}
                      onChange={e => setNewVeganItem({ ...newVeganItem, calories: e.target.value })}
                      className="px-3 py-2 rounded border"
                      style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                    />
                  </div>
                  <button
                    onClick={handleAddVeganItem}
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: palette.colors.primary }}
                  >
                    Добавить
                  </button>
                </div>
                
                {/* Vegan items list */}
                <div className="space-y-2">
                  {veganItems.map(item => (
                    <div key={item.id} className="p-4 rounded-lg border flex justify-between items-start" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border }}>
                      <div className="flex-1">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm" style={{ color: palette.colors.textSecondary }}>
                          Цена: {item.price}₽
                        </div>
                        {item.composition && (
                          <div className="text-sm" style={{ color: palette.colors.textSecondary }}>
                            Состав: {item.composition}
                          </div>
                        )}
                        {(item.protein || item.carbs || item.fats) && (
                          <div className="text-sm" style={{ color: palette.colors.textSecondary }}>
                            Б: {item.protein || 0}г, У: {item.carbs || 0}г, Ж: {item.fats || 0}г
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleToggleVeganItem(item.id)}
                          className="px-3 py-1 rounded text-sm"
                          style={{ 
                            backgroundColor: item.isActive ? palette.colors.primary + '20' : palette.colors.border,
                            color: palette.colors.text
                          }}
                        >
                          {item.isActive ? 'Активно' : 'Скрыто'}
                        </button>
                        <button
                          onClick={() => handleDeleteVeganItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disabled Dates Tab */}
            {activeTab === 'disabled' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Управление блокировкой заказов</h2>
                
                {/* Add new disabled date range form */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border, borderWidth: 1 }}>
                  <h3 className="font-bold mb-4">Добавить период блокировки</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: palette.colors.text }}>
                        Начальная дата
                      </label>
                      <input
                        type="date"
                        value={newDisabledDate.startDate}
                        onChange={e => setNewDisabledDate({ ...newDisabledDate, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded border"
                        style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: palette.colors.text }}>
                        Конечная дата
                      </label>
                      <input
                        type="date"
                        value={newDisabledDate.endDate}
                        onChange={e => setNewDisabledDate({ ...newDisabledDate, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded border"
                        style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: palette.colors.text }}>
                        Причина блокировки
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Праздничный день, технические работы"
                        value={newDisabledDate.message}
                        onChange={e => setNewDisabledDate({ ...newDisabledDate, message: e.target.value })}
                        className="w-full px-3 py-2 rounded border"
                        style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.background, color: palette.colors.text }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddDisabledDate}
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: palette.colors.primary }}
                  >
                    Добавить блокировку
                  </button>
                </div>
                
                {/* Current disabled dates */}
                <div className="space-y-2">
                  <h3 className="font-bold mb-2">Текущие блокировки</h3>
                  {disabledDates && disabledDates.startDate && disabledDates.endDate ? (
                    <div className="p-4 rounded-lg border flex justify-between items-start" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border }}>
                      <div>
                        <div className="font-semibold">
                          {new Date(disabledDates.startDate).toLocaleDateString('ru-RU')} - {new Date(disabledDates.endDate).toLocaleDateString('ru-RU')}
                        </div>
                        {disabledDates.message && (
                          <div className="text-sm mt-1" style={{ color: palette.colors.textSecondary }}>
                            Причина: {disabledDates.message}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={handleRemoveDisabledDate}
                          className="px-3 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg" style={{ borderColor: palette.colors.border }}>
                      <p style={{ color: palette.colors.textSecondary }}>
                        Нет активных блокировок заказов
                      </p>
                    </div>
                  )}
                </div>
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
                  </div>
                </div>
                
                {/* Date range for export */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span style={{ color: palette.colors.text }}>Экспорт за период:</span>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={e => setExportStartDate(e.target.value)}
                    className="px-3 py-2 rounded border"
                    style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.cardBg, color: palette.colors.text }}
                  />
                  <span style={{ color: palette.colors.text }}>—</span>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={e => setExportEndDate(e.target.value)}
                    className="px-3 py-2 rounded border"
                    style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.cardBg, color: palette.colors.text }}
                  />
                  <select
                    value={selectedExportAddress}
                    onChange={e => setSelectedExportAddress(e.target.value)}
                    className="px-3 py-2 rounded border"
                    style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.cardBg, color: palette.colors.text }}
                  >
                    <option value="all">Все адреса</option>
                    <option value="office">Офис</option>
                    <option value="coffee-shop">Кофейня</option>
                  </select>
                  <button
                    onClick={exportToExcel}
                    disabled={isExporting}
                    className="px-4 py-2 rounded border"
                    style={{ borderColor: palette.colors.border, color: palette.colors.text }}
                  >
                    {isExporting ? 'Экспорт...' : 'Экспорт Excel'}
                  </button>
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
                              {(order.items || []).map((i: any) => {
                                const garnishName = i.garnish ? (garnishes.find(g => g.id === i.garnish)?.name || i.garnish) : null;
                                const sauceName = i.sauce ? (sauces.find(s => s.id === i.sauce)?.name || i.sauce) : null;
                                const parts = [i.dishName];
                                if (garnishName) parts.push(`+ ${garnishName}`);
                                if (sauceName) parts.push(`+ ${sauceName}`);
                                return parts.join(' ');
                              }).join(', ')}
                            </div>
                            <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                              {order.address} • {order.orderDate}
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
