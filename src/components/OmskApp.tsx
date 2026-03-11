import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeOrder } from '../types';
import { CITY_ADDRESSES } from '../constants';
import OmskOrderForm from './OmskOrderForm';
import Header from './Header';
import Footer from './Footer';
import ThemeSelector from './ThemeSelector';
import { useTheme } from '../theme/ThemeContext';

// Omsk-specific API functions that use SQLite
const fetchOmskOrdersFromAPI = async (date: string, address: string) => {
  const response = await fetch(`/api/omsk/orders/${date}?address=${encodeURIComponent(address)}`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

const submitOmskOrderToAPI = async (order: any) => {
  // Calculate total price
  const totalPrice = order.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
  
  const response = await fetch('/api/omsk/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...order, totalPrice })
  });
  if (!response.ok) throw new Error('Failed to submit order');
  return response.json();
};

const deleteOmskOrderFromAPI = async (id: string, address: string) => {
  const response = await fetch(`/api/omsk/orders/${id}?address=${encodeURIComponent(address)}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete order');
};

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const OmskApp: React.FC = () => {
  const navigate = useNavigate();
  const { palette } = useTheme();
  
  const city = 'omsk';
  
  // Load last used values from localStorage
  const getInitialEmployeeName = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('omsk_employeeName') || '';
    }
    return '';
  };
  
  const getInitialDepartment = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('omsk_department') || '';
    }
    return '';
  };
  
  const [currentEmployeeOrder, setCurrentEmployeeOrder] = useState<any>({
    employeeName: getInitialEmployeeName(),
    department: getInitialDepartment(),
    orderDate: getTodayDateString(),
    items: [],
    address: 'office',
  });
  
  const [allOrders, setAllOrders] = useState<EmployeeOrder[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'delete-success'; message: string } | null>(null);
  
  const [selectedAggregateDate, setSelectedAggregateDate] = useState<string>(getTodayDateString());
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [garnishes, setGarnishes] = useState<any[]>([]);
  const [sauces, setSauces] = useState<any[]>([]);
  
  const [selectedAddress, setSelectedAddress] = useState<string>('office');
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  // Initialize selectedAddress from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedAddress');
      if (saved) {
        setSelectedAddress(saved);
      }
      setAddressLoaded(true);
    }
  }, []);

  // Initialize selectedDepartment from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedDepartment');
      if (saved) {
        setSelectedDepartment(saved);
      }
    }
  }, []);

  // Save selectedDepartment to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedDepartment', selectedDepartment);
    }
  }, [selectedDepartment]);

  // Save selectedAddress to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (addressLoaded && typeof window !== 'undefined') {
      localStorage.setItem('selectedAddress', selectedAddress);
    }
  }, [selectedAddress, addressLoaded]);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; orderId?: string }>({ open: false });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const showNotification = (type: 'success' | 'error' | 'delete-success', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), type === 'delete-success' ? 2000 : 3000);
  };

  const loadOrders = useCallback(async (date: string, address: string) => {
    setIsLoadingOrders(true);
    setFetchError(null);
    try {
      const orders = await fetchOmskOrdersFromAPI(date, address);
      setAllOrders(orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setFetchError("Не удалось загрузить заказы.");
      showNotification('error', "Ошибка загрузки заказов.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(selectedAggregateDate, selectedAddress);
  }, [selectedAggregateDate, selectedAddress, loadOrders]);

  // Load garnishes and sauces for display
  useEffect(() => {
    const loadGarnishesSauces = async () => {
      try {
        const [garnishesRes, saucesRes] = await Promise.all([
          fetch('/api/omsk/garnishes'),
          fetch('/api/omsk/sauces')
        ]);
        const garnishesData = await garnishesRes.json();
        const saucesData = await saucesRes.json();
        setGarnishes(garnishesData);
        setSauces(saucesData);
      } catch (error) {
        console.error('Failed to load garnishes/sauces:', error);
      }
    };
    loadGarnishesSauces();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAddress', selectedAddress);
    }
  }, [selectedAddress]);

  const handleOrderSubmit = useCallback(() => {
    setConfirmModal({ open: true });
  }, []);

  const actuallySubmitOrder = useCallback(async () => {
    if (!currentEmployeeOrder.employeeName.trim()) {
      showNotification('error', 'Имя сотрудника обязательно.');
      setConfirmModal({ open: false });
      return;
    }
    if (!currentEmployeeOrder.department.trim()) {
      showNotification('error', 'Отдел обязателен.');
      setConfirmModal({ open: false });
      return;
    }
    if (!currentEmployeeOrder.orderDate) {
      showNotification('error', 'Дата заказа обязательна.');
      setConfirmModal({ open: false });
      return;
    }
    if (!currentEmployeeOrder.items || currentEmployeeOrder.items.length === 0) {
      showNotification('error', 'Выберите хотя бы одно блюдо.');
      setConfirmModal({ open: false });
      return;
    }
    
    setIsSubmittingOrder(true);
    setConfirmModal({ open: false });
    try {
      const newOrder = await submitOmskOrderToAPI(currentEmployeeOrder);
      setAllOrders((prevOrders: EmployeeOrder[]) => [...prevOrders, newOrder]);
      
      // Increase selected date by 1 day after successful order
      const currentDate = new Date(currentEmployeeOrder.orderDate);
      currentDate.setDate(currentDate.getDate() + 1);
      const nextDate = currentDate.toISOString().split('T')[0];
      
      setSelectedAggregateDate(nextDate);
       
      // Save name and department to localStorage for next time
      if (typeof window !== 'undefined') {
        localStorage.setItem('omsk_employeeName', currentEmployeeOrder.employeeName);
        localStorage.setItem('omsk_department', currentEmployeeOrder.department);
      }
      
      // Reset form with the new date
      setCurrentEmployeeOrder({
        employeeName: currentEmployeeOrder.employeeName,
        department: currentEmployeeOrder.department,
        orderDate: nextDate,
        items: [],
        address: currentEmployeeOrder.address,
      });
      
      showNotification('success', `Заказ для ${newOrder.employeeName} успешно добавлен!`);
    } catch (error) {
      console.error("Failed to submit order:", error);
      showNotification('error', "Ошибка отправки заказа.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [currentEmployeeOrder]);

  const handleDeleteOrder = (id: string) => {
    setPendingDeleteId(id);
    setConfirmModal({ open: true, orderId: id });
  };

  const actuallyDeleteOrder = async () => {
    if (!pendingDeleteId) return;
    setDeletingOrderId(pendingDeleteId);
    setConfirmModal({ open: false });
    try {
      await deleteOmskOrderFromAPI(pendingDeleteId, selectedAddress);
      setAllOrders((prev: EmployeeOrder[]) => prev.filter((order: EmployeeOrder) => order.id !== pendingDeleteId));
      showNotification('delete-success', 'Заказ удалён.');
    } catch (error) {
      showNotification('error', 'Ошибка удаления заказа.');
    } finally {
      setDeletingOrderId(null);
      setPendingDeleteId(null);
    }
  };

  // Simple orders list display with department filtering
  const ordersForSelectedDate = allOrders
    .filter((order: EmployeeOrder) => order.orderDate === selectedAggregateDate)
    .filter((order: EmployeeOrder) => 
      selectedDepartment === 'all' || order.department === selectedDepartment
    )
    .sort((a, b) => {
      // Sort by timestamp (newest first)
      return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
    });

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: palette.colors.background, color: palette.colors.text }}
    >
      <Header>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm hover:underline"
            style={{ color: palette.colors.textSecondary }}
          >
            ← На главную
          </button>
          <ThemeSelector />
        </div>
      </Header>
      
      {/* Address Selection */}
      <div className="flex justify-center gap-3 mt-4 mb-6 flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto">
        <button
          className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all duration-150 w-full sm:w-auto ${
            selectedAddress === 'office' ? 'text-white border-transparent' : ''
          }`}
          style={{ 
            backgroundColor: selectedAddress === 'office' ? palette.colors.primary : 'transparent',
            borderColor: selectedAddress === 'office' ? palette.colors.primary : palette.colors.border
          }}
          onClick={() => setSelectedAddress('office')}
        >
          Офис
        </button>
        <div className="relative group w-full sm:w-auto">
          <button 
            className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all duration-150 flex items-center justify-between sm:justify-center gap-2 w-full`}
            style={{ 
              backgroundColor: selectedAddress !== 'office' ? palette.colors.primary : 'transparent',
              borderColor: palette.colors.border,
              color: selectedAddress !== 'office' ? 'white' : palette.colors.text
            }}
          >
            {selectedAddress === 'office' ? 'Выберите кофейню' : (CITY_ADDRESSES[city] || CITY_ADDRESSES.omsk).find(a => a.id === selectedAddress)?.label}
            <svg className={`w-4 h-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-1 w-full sm:w-56 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10" style={{ backgroundColor: palette.colors.cardBg }}>
            <div className="py-1 max-h-48 overflow-y-auto">
              {(CITY_ADDRESSES[city] || CITY_ADDRESSES.omsk).filter(addr => addr.id !== 'office').map(addr => (
                <button
                  key={addr.id}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedAddress === addr.id ? 'opacity-80' : 'hover:opacity-80'
                  }`}
                  style={{ 
                    color: selectedAddress === addr.id ? palette.colors.primary : palette.colors.text,
                    backgroundColor: selectedAddress === addr.id ? palette.colors.primary + '20' : 'transparent'
                  }}
                  onClick={() => setSelectedAddress(addr.id)}
                >
                  {addr.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 text-white text-center fixed top-0 left-0 right-0 z-50 shadow-lg rounded-lg animate-fade-in ${
          notification.type === 'success' ? 'bg-green-600' : notification.type === 'error' ? 'bg-red-600' : 'bg-neutral-700'
        }`}>
          {notification.message}
        </div>
      )}
      {fetchError && (
        <div className="p-4 bg-red-700 text-white text-center fixed top-16 left-0 right-0 z-40 shadow-lg">
          {fetchError}
        </div>
      )}

      <main className={`flex-grow container mx-auto p-4 md:p-8 space-y-8 ${fetchError ? 'mt-2' : 'mt-1'}`}>
        {/* Order Form */}
        <section>
          <h2 className="text-2xl font-bold mb-4" style={{ color: palette.colors.text }}>Новый заказ</h2>
          <OmskOrderForm
            currentOrder={currentEmployeeOrder}
            setCurrentOrder={setCurrentEmployeeOrder}
            onSubmit={handleOrderSubmit}
            isSubmitting={isSubmittingOrder}
            selectedAddress={selectedAddress}
          />
        </section>

        {/* Orders List */}
        <section className="flex-1 overflow-visible" style={{ minHeight: '400px' }}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h2 className="text-2xl font-bold" style={{ color: palette.colors.text }}>Заказы</h2>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-1 rounded border text-sm"
                style={{ 
                  borderColor: palette.colors.border,
                  backgroundColor: palette.colors.cardBg,
                  color: palette.colors.text
                }}
              >
                <option value="all">Все отделы</option>
                {Array.from(new Set(allOrders.map(o => o.department).filter(Boolean)))
                  .sort((a, b) => a.localeCompare(b, 'ru-RU'))
                  .map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
              </select>
            </div>
            <input
              type="date"
              value={selectedAggregateDate}
              onChange={(e) => setSelectedAggregateDate(e.target.value)}
              className="px-4 py-2 rounded-lg border w-full sm:w-auto"
              style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.cardBg, color: palette.colors.text }}
            />
          </div>
          
          {isLoadingOrders ? (
            <div className="text-center p-4" style={{ color: palette.colors.textSecondary }}>Загрузка...</div>
          ) : ordersForSelectedDate.length === 0 ? (
            <div className="text-center p-4" style={{ color: palette.colors.textSecondary }}>Нет заказов на эту дату</div>
          ) : (
            <div className="space-y-2 overflow-visible" style={{ maxHeight: 'none' }}>
              <div className="text-xs p-2 bg-gray-100 rounded" style={{ color: palette.colors.textSecondary }}>
                Показано {ordersForSelectedDate.length} из {allOrders.length} заказов
              </div>
              {ordersForSelectedDate.map((order: EmployeeOrder) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg border flex justify-between items-center"
                  style={{ 
                    backgroundColor: palette.colors.cardBg,
                    borderColor: palette.colors.border
                  }}
                >
                  <div>
                    <div className="font-semibold" style={{ color: palette.colors.text }}>{order.employeeName}</div>
                    <div className="text-sm" style={{ color: palette.colors.textSecondary }}>{order.department}</div>
                    <div className="text-xs" style={{ color: palette.colors.textSecondary }}>
                      {order.timestamp ? new Date(order.timestamp).toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : ''}
                    </div>
                    <div className="text-sm mt-1" style={{ color: palette.colors.textSecondary }}>
                      {order.items?.map((item: any, idx: number) => {
                        const garnishItem = item.garnish ? garnishes.find(g => g.id === item.garnish) : null;
                        const sauceItem = item.sauce ? sauces.find(s => s.id === item.sauce) : null;
                        const garnishName = garnishItem?.name || item.garnish;
                        const sauceName = sauceItem?.name || item.sauce;
                        return (
                          <div key={item.dishId || idx} className="mb-2">
                            <div className="font-medium">
                              {item.dishName}
                              {garnishName && <span className="font-normal"> + {garnishName}</span>}
                              {sauceName && <span className="font-normal"> + {sauceName}</span>}
                            </div>
                            {(item.protein || item.carbs || item.fats || item.grams || item.calories) && (
                              <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                                {item.protein && <span>Б: {item.protein}г </span>}
                                {item.carbs && <span>У: {item.carbs}г </span>}
                                {item.fats && <span>Ж: {item.fats}г</span>}
                                {item.grams && <span> | {item.grams}г</span>}
                                {item.calories && <span> | {item.calories}ккал</span>}
                              </div>
                            )}
                            {(garnishItem?.composition || garnishItem?.grams || garnishItem?.calories) && (
                              <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                                {garnishItem?.composition && <span>Состав гарнира: {garnishItem.composition} | </span>}
                                {garnishItem?.grams && <span>{garnishItem.grams}г</span>}
                                {garnishItem?.grams && garnishItem?.calories && <span> / </span>}
                                {garnishItem?.calories && <span>{garnishItem.calories}ккал</span>}
                              </div>
                            )}
                            {(sauceItem?.composition || sauceItem?.grams || sauceItem?.calories) && (
                              <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                                {sauceItem?.composition && <span>Состав соуса: {sauceItem.composition} | </span>}
                                {sauceItem?.grams && <span>{sauceItem.grams}г</span>}
                                {sauceItem?.grams && sauceItem?.calories && <span> / </span>}
                                {sauceItem?.calories && <span>{sauceItem.calories}ккал</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="text-red-500 hover:text-red-700"
                    disabled={deletingOrderId === order.id}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      
      <Footer />

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4"
            style={{ backgroundColor: palette.colors.cardBg }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: palette.colors.text }}>
              {confirmModal.orderId ? 'Подтвердите удаление' : 'Подтвердите заказ'}
            </h3>
            <p style={{ color: palette.colors.textSecondary }}>
              {confirmModal.orderId 
                ? 'Вы уверены, что хотите удалить этот заказ?' 
                : 'Вы уверены, что хотите отправить этот заказ?'}
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setConfirmModal({ open: false })}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{ borderColor: palette.colors.border, color: palette.colors.text }}
              >
                Отмена
              </button>
              <button
                onClick={confirmModal.orderId ? actuallyDeleteOrder : actuallySubmitOrder}
                className="flex-1 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: palette.colors.primary }}
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OmskApp;
