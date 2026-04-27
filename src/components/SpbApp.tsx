import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeOrder, Dish } from '../types';
import { CITY_ADDRESSES } from '../constants';
import SpbOrderForm from './SpbOrderForm';
import Header from './Header';
import Footer from './Footer';
import ThemeSelector from '../components/ThemeSelector';
import { useTheme } from '../theme/ThemeContext';
import { safeGetItem, safeSetItem } from '../utils/localStorage';

const fetchSpbOrdersFromAPI = async (date: string, address: string) => {
  const response = await fetch(`/api/spb/orders/${date}?address=${encodeURIComponent(address)}&city=spb`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

const submitSpbOrderToAPI = async (orderData: any) => {
  const response = await fetch('/api/spb/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...orderData,
      city: 'spb'
    }),
  });
  if (!response.ok) throw new Error('Failed to submit order');
  return response.json();
};

const deleteSpbOrderFromAPI = async (id: string, address: string) => {
  const response = await fetch(`/api/spb/orders/${id}?address=${encodeURIComponent(address)}&city=spb`, {
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

// Get max date (2 months from now)
const getMaxDateString = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface MenuItemWithPeriod extends Dish {
  periodName?: string;
}

const SpbApp: React.FC = () => {
  const navigate = useNavigate();
  const { palette } = useTheme();
  
  const getInitialEmployeeName = () => safeGetItem<string>('spb_employeeName', '');

  const [currentEmployeeOrder, setCurrentEmployeeOrder] = useState<any>({
    employeeName: getInitialEmployeeName(),
    department: '',
    orderDate: getTodayDateString(),
    items: [],
    address: 'kirova',
    floor: '',
  });
  
  const [selectedAddress, setSelectedAddress] = useState<string>('kirova');
  const [addressLoaded, setAddressLoaded] = useState(false);
  
  const [allOrders, setAllOrders] = useState<EmployeeOrder[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'delete-success'; message: string } | null>(null);
  
  const [selectedAggregateDate, setSelectedAggregateDate] = useState<string>(getTodayDateString());
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  
  const [menuItems, setMenuItems] = useState<MenuItemWithPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<{ id: string; name: string } | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [sides, setSides] = useState<any[]>([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const maxDate = getMaxDateString();

  useEffect(() => {
    const saved = safeGetItem<string>('selectedAddress', '');
    if (saved && saved !== 'office' && (CITY_ADDRESSES.spb || []).find(a => a.id === saved)) {
      setSelectedAddress(saved);
    }
    setAddressLoaded(true);
  }, []);

  useEffect(() => {
    const saved = safeGetItem<string>('selectedDepartment', '');
    if (saved) setSelectedDepartment(saved);
  }, []);

  useEffect(() => {
    safeSetItem('selectedDepartment', selectedDepartment);
  }, [selectedDepartment]);

  useEffect(() => {
    if (addressLoaded && selectedAddress !== 'office') safeSetItem('selectedAddress', selectedAddress);
  }, [selectedAddress, addressLoaded]);

  useEffect(() => {
    setCurrentEmployeeOrder((prev: any) => ({ ...prev, address: selectedAddress }));
  }, [selectedAddress]);

  const loadMenuForDate = useCallback(async (date: string) => {
    setIsLoadingMenu(true);
    try {
      const res = await fetch(`/api/spb/menu?date=${encodeURIComponent(date)}&city=spb`);
      if (!res.ok) throw new Error('Failed to fetch menu');
      const data = await res.json();
      setMenuItems(data.items || []);
      setCurrentPeriod(data.period || null);
    } catch (error) {
      console.error('Failed to load SPB menu:', error);
      setMenuItems([]);
      setCurrentPeriod(null);
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    loadMenuForDate(selectedAggregateDate);
  }, [selectedAggregateDate, loadMenuForDate]);

  const loadOrders = useCallback(async (date: string, address: string) => {
    setIsLoadingOrders(true);
    setFetchError(null);
    try {
      const orders = await fetchSpbOrdersFromAPI(date, address);
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

  const loadSides = useCallback(async () => {
    try {
      const res = await fetch('/api/menu/sides?city=spb');
      if (res.ok) {
        const sidesData = await res.json();
        setSides(sidesData);
      } else {
        setSides([]);
      }
    } catch (error) {
      console.error('Failed to load sides:', error);
      setSides([]);
    }
  }, []);

  useEffect(() => {
    loadSides();
  }, [loadSides]);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; orderId?: string }>({ open: false });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const showNotification = (type: 'success' | 'error' | 'delete-success', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), type === 'delete-success' ? 2000 : 3000);
  };

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
      const newOrder = await submitSpbOrderToAPI(currentEmployeeOrder);
      setAllOrders((prevOrders: EmployeeOrder[]) => [...prevOrders, newOrder]);
      
      const currentDate = new Date(currentEmployeeOrder.orderDate);
      currentDate.setDate(currentDate.getDate() + 1);
      const nextDate = currentDate.toISOString().split('T')[0];
      setSelectedAggregateDate(nextDate);
      
      safeSetItem('spb_employeeName', currentEmployeeOrder.employeeName);
      safeSetItem('spb_department', currentEmployeeOrder.department);
      
       setCurrentEmployeeOrder({
         employeeName: currentEmployeeOrder.employeeName,
         department: currentEmployeeOrder.department,
         orderDate: nextDate,
         items: [],
         address: currentEmployeeOrder.address,
         floor: currentEmployeeOrder.floor,
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
      await deleteSpbOrderFromAPI(pendingDeleteId, selectedAddress);
      setAllOrders((prev: EmployeeOrder[]) => prev.filter((order: EmployeeOrder) => order.id !== pendingDeleteId));
      showNotification('delete-success', 'Заказ удалён.');
    } catch (error) {
      showNotification('error', 'Ошибка удаления заказа.');
    } finally {
      setDeletingOrderId(null);
      setPendingDeleteId(null);
    }
  };

  const ordersForSelectedDate = allOrders
    .filter((order: EmployeeOrder) => order.orderDate === selectedAggregateDate)
    .filter((order: EmployeeOrder) => order.address === selectedAddress)
    .filter((order: EmployeeOrder) => 
      selectedDepartment === 'all' || order.department === selectedDepartment
    )
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

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

      {/* Address Selection - Coffee Shops Only */}
      <div className="flex justify-center gap-3 mt-4 mb-6 flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto">
        <div className="relative group w-full sm:w-auto">
          <button 
            className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all duration-150 flex items-center justify-between sm:justify-center gap-2 w-full`}
            style={{ 
              backgroundColor: palette.colors.primary,
              borderColor: palette.colors.border,
              color: 'white'
            }}
          >
            {(CITY_ADDRESSES.spb || []).find(a => a.id === selectedAddress)?.label}
            <svg className={`w-4 h-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-1 w-full sm:w-56 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10" style={{ backgroundColor: palette.colors.cardBg }}>
            <div className="py-1 max-h-48 overflow-y-auto">
              {(CITY_ADDRESSES.spb || []).map(addr => (
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
          <h2 className="text-2xl font-bold mb-4" style={{ color: palette.colors.text }}>
            Новый заказ
            {currentPeriod && (
              <span className="text-base font-normal ml-2" style={{ color: palette.colors.textSecondary }}>
                {currentPeriod.name}
              </span>
            )}
          </h2>
          <SpbOrderForm
            currentOrder={currentEmployeeOrder}
            setCurrentOrder={setCurrentEmployeeOrder}
            onSubmit={handleOrderSubmit}
            isSubmitting={isSubmittingOrder}
            selectedAddress={selectedAddress}
            addressLabel={(CITY_ADDRESSES.spb || []).find(a => a.id === selectedAddress)?.label}
            menuItems={menuItems}
            sideDishes={sides}
            isLoadingMenu={isLoadingMenu}
            selectedDate={selectedAggregateDate}
            onDateChange={setSelectedAggregateDate}
            minDate={getTodayDateString()}
            maxDate={maxDate}
            currentPeriodName={currentPeriod?.name}
          />
        </section>

        {/* Orders List */}
        <section className="flex-1 overflow-visible" style={{ minHeight: '400px' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <h2 className="text-2xl font-bold" style={{ color: palette.colors.text }}>Заказы</h2>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 rounded border text-sm min-h-[44px] w-full sm:w-auto"
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
              min={getTodayDateString()}
              max={maxDate}
              className="px-4 py-2 rounded-lg border w-full sm:w-auto min-h-[44px]"
              style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.cardBg, color: palette.colors.text }}
            />
          </div>
          
          {isLoadingOrders ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="p-4 rounded-lg border" style={{ backgroundColor: palette.colors.cardBg, borderColor: palette.colors.border }}>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : ordersForSelectedDate.length === 0 ? (
            <div className="text-center p-4" style={{ color: palette.colors.textSecondary }}>Нет заказов на эту дату</div>
          ) : (
            <div className="space-y-2">
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
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {order.items.map((item, idx) => {
                        const dish = menuItems.find(d => d.id === item.dishId);
                        return (
                          <div key={idx}>
                            • {dish?.name || 'Блюдо'}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs" style={{ color: palette.colors.textSecondary }}>
                      {order.timestamp ? new Date(order.timestamp).toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : ''}
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

export default SpbApp;
