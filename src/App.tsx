import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EmployeeOrder, CurrentOrderItem, AggregatedOrderItem, Dish } from './types';
import { MENU_ITEMS, SIDE_DISHES, DEPARTMENTS, CITY_ADDRESSES, CITIES } from './constants';
import OrderForm from './components/OrderForm';
import IndividualOrdersList from './components/IndividualOrdersList';
import AggregatedOrderSummary from './components/AggregatedOrderSummary';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminPage from './components/AdminPage';
import AdminAccess from './components/AdminAccess';
import { fetchOrdersFromAPI, submitOrderToAPI, deleteOrderFromAPI, fetchMenuItems, fetchSideDishes, fetchMenuConfig } from './api';
import ConfirmModal from './components/ui/ConfirmModal';
import Select from './components/ui/Select';
import Input from './components/ui/Input';

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addOneDayToDate = (dateString: string): string => {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function getCurrentMenuDishes(menuItems: Dish[]): Dish[] {
  return menuItems.filter(item => item.isActive !== false);
}

const normalizeAddress = (address: string): string => {
  if (!address || address === 'office') return 'office';
  return address.split(':')[0];
};

const App: React.FC = () => {
  const initialEmployeeOrderState: Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] } = {
    employeeName: '',
    department: '',
    orderDate: getTodayDateString(),
    items: [],
    address: 'office',
  };

  const [currentEmployeeOrder, setCurrentEmployeeOrder] = useState<Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] }>({
    ...initialEmployeeOrderState
  });
  const [allOrders, setAllOrders] = useState<EmployeeOrder[]>([]);
  const [aggregatedOrder, setAggregatedOrder] = useState<AggregatedOrderItem[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'delete-success'; message: string } | null>(null);
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [sides, setSides] = useState(SIDE_DISHES);
  const [menuConfigDishIds, setMenuConfigDishIds] = useState<string[] | null>(null);
  const [selectedAggregateDate, setSelectedAggregateDate] = useState<string>(getTodayDateString());

  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'send' | 'delete'; orderId?: string }>(
    { open: false, type: 'send' }
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [selectedDept, setSelectedDept] = useState<string>('Все отделы');
  const [city, setCity] = useState<string>(() => {
    try { return localStorage.getItem('city') || ''; } catch { return ''; }
  });
  const [selectedAddress, setSelectedAddress] = useState(() => {
    if (typeof window !== 'undefined') {
      const addr = localStorage.getItem('selectedAddress');
      if (addr) return addr;
      const list = CITY_ADDRESSES[city] || CITY_ADDRESSES.omsk;
      return list[0]?.id || 'office';
    }
    return 'office';
  });

  const [lastEmployeeName, setLastEmployeeName] = useState<string>('');
  const [lastDepartment, setLastDepartment] = useState<string>('');

  const showNotification = (type: 'success' | 'error' | 'delete-success', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), type === 'delete-success' ? 2000 : 3000);
  };

  const loadOrders = useCallback(async (date: string, address: string) => {
    setIsLoadingOrders(true);
    setFetchError(null);
    try {
      const normalizedAddress = normalizeAddress(address);
      const orders = await fetchOrdersFromAPI(date, normalizedAddress);
      setAllOrders(orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setFetchError("Не удалось загрузить заказы. Попробуйте обновить страницу.");
      showNotification('error', "Ошибка загрузки заказов.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(selectedAggregateDate, selectedAddress);
  }, [selectedAggregateDate, selectedAddress, loadOrders]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const [items, sd, config] = await Promise.all([
          fetchMenuItems(city).catch(() => []), 
          fetchSideDishes().catch(() => SIDE_DISHES),
          fetchMenuConfig(city).catch(() => null)
        ]);
        
        // If no items are returned from the server, fall back to default items
        const menuItemsToUse = items && items.length ? items : MENU_ITEMS;
        const sidesToUse = sd && sd.length ? sd : SIDE_DISHES;
        
        setMenuItems(menuItemsToUse);
        setSides(sidesToUse);

        if (config && Array.isArray(config.categories)) {
          const unionIds = new Set<string>();
          for (const cat of config.categories) {
            if (Array.isArray(cat.dishIds)) {
              cat.dishIds.forEach((id: string) => unionIds.add(id));
            }
          }
          setMenuConfigDishIds(Array.from(unionIds));
        } else {
          setMenuConfigDishIds(null);
        }

        // Clear any existing orders when city changes
        setCurrentEmployeeOrder(prev => ({
          ...prev,
          items: []
        }));

        setIsLoadingMenu(false);
      } catch (error) {
        console.error('Error loading menu:', error);
        setMenuItems(MENU_ITEMS);
        setSides(SIDE_DISHES);
        setMenuConfigDishIds(null);
        setIsLoadingMenu(false);
      }
    };
    
    loadMenu();
  }, [city]); // Add city as a dependency

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAddress', selectedAddress);
      setCurrentEmployeeOrder(prev => ({
        ...prev,
        department: ''
      }));
      setSelectedDept('Все отделы');
    }
  }, [selectedAddress]);

  useEffect(() => {
    try { localStorage.setItem('city', city); } catch {}
    // Reset address to first for city
    const list = CITY_ADDRESSES[city] || CITY_ADDRESSES.omsk;
    const first = list[0]?.id || 'office';
    setSelectedAddress(first);
  }, [city]);

  useEffect(() => {
    if (lastEmployeeName && lastDepartment && currentEmployeeOrder.items.length === 0) {
      setCurrentEmployeeOrder(prev => ({
        ...prev,
        employeeName: lastEmployeeName,
        department: lastDepartment,
      }));
    }
  }, [currentEmployeeOrder.items.length, lastEmployeeName, lastDepartment]);

  const updateCurrentOrderItems = useCallback((newItems: CurrentOrderItem[]) => {
    setCurrentEmployeeOrder((prev: Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] }) => ({
      ...prev,
      items: newItems,
    }));
  }, []);

  const updateCurrentOrderDetails = useCallback((field: 'employeeName' | 'department' | 'orderDate', value: string) => {
    setCurrentEmployeeOrder((prev: Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] }) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleOrderSubmit = useCallback(() => {
    setConfirmModal({ open: true, type: 'send' });
  }, [setConfirmModal]);

  const actuallySubmitOrder = useCallback(async () => {
    if (!currentEmployeeOrder.employeeName.trim()) {
      showNotification('error', 'Имя сотрудника обязательно.');
      setConfirmModal({ open: false, type: 'send' });
      return;
    }
    if (!currentEmployeeOrder.department.trim()) {
      showNotification('error', 'Отдел обязателен.');
      setConfirmModal({ open: false, type: 'send' });
      return;
    }
    if (!currentEmployeeOrder.orderDate) {
      showNotification('error', 'Дата заказа обязательна.');
      setConfirmModal({ open: false, type: 'send' });
      return;
    }
    const orderDateObj = new Date(currentEmployeeOrder.orderDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (orderDateObj.getTime() < today.getTime()) {
      showNotification('error', 'Нельзя создавать заказы на прошедшие даты.');
      setConfirmModal({ open: false, type: 'send' });
      return;
    }
    if (currentEmployeeOrder.items.length === 0) {
      showNotification('error', 'Добавьте хотя бы одно блюдо в заказ.');
      setConfirmModal({ open: false, type: 'send' });
      return;
    }
    
    const duplicate = allOrders.some(order =>
      order.employeeName.trim().toLowerCase() === currentEmployeeOrder.employeeName.trim().toLowerCase() &&
      order.department === currentEmployeeOrder.department &&
      order.orderDate === currentEmployeeOrder.orderDate
    );
    if (duplicate) {
      showNotification('error', 'Вы уже отправили заказ на этот день для этого отдела.');
      setConfirmModal({ open: false, type: 'send' });
        return;
    }
    
    setIsSubmittingOrder(true);
    setFetchError(null);
    setConfirmModal({ open: false, type: 'send' });
    try {
      const normalizedAddress = normalizeAddress(selectedAddress);
      const newOrder = await submitOrderToAPI({ ...currentEmployeeOrder, address: normalizedAddress });
      if (newOrder.orderDate === selectedAggregateDate) {
        setAllOrders((prevOrders: EmployeeOrder[]) => [...prevOrders, newOrder]);
      } else {
         console.log(`Order for ${newOrder.orderDate} submitted, but current view is for ${selectedAggregateDate}. Data saved.`);
      }
      
      setLastEmployeeName(currentEmployeeOrder.employeeName);
      setLastDepartment(currentEmployeeOrder.department);
      
      const nextDate = addOneDayToDate(currentEmployeeOrder.orderDate);
      setCurrentEmployeeOrder({
        ...currentEmployeeOrder,
        orderDate: nextDate,
        department: '',
        items: [],
      });
      setSelectedDept('Все отделы');
      
      showNotification('success', `Заказ для ${newOrder.employeeName} успешно добавлен!`);
    } catch (error) {
      console.error("Failed to submit order:", error);
      setFetchError("Не удалось отправить заказ. Пожалуйста, попробуйте еще раз.");
      showNotification('error', "Ошибка отправки заказа.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [currentEmployeeOrder, initialEmployeeOrderState, selectedAggregateDate, loadOrders, allOrders, selectedAddress]);

  const handleDeleteOrder = (id: string) => {
    setPendingDeleteId(id);
    setConfirmModal({ open: true, type: 'delete', orderId: id });
  };

  const actuallyDeleteOrder = async () => {
    if (!pendingDeleteId) return;
    setDeletingOrderId(pendingDeleteId);
    setConfirmModal({ open: false, type: 'delete' });
    try {
      const normalizedAddress = normalizeAddress(selectedAddress);
      await deleteOrderFromAPI(pendingDeleteId, normalizedAddress);
      setAllOrders((prev: EmployeeOrder[]) => prev.filter((order: EmployeeOrder) => order.id !== pendingDeleteId));
      showNotification('delete-success', 'Заказ удалён.');
    } catch (error) {
      showNotification('error', 'Ошибка удаления заказа.');
    } finally {
      setDeletingOrderId(null);
      setPendingDeleteId(null);
    }
  };

  useEffect(() => {
    const aggregate = () => {
      const summary: { [key: string]: AggregatedOrderItem } = {};
      
      const ordersForSelectedDate = allOrders.filter((order: EmployeeOrder) => order.orderDate === selectedAggregateDate);

      ordersForSelectedDate.forEach((order: EmployeeOrder) => {
        order.items.forEach((item: CurrentOrderItem) => {
          const dish = menuItems.find(d => d.id === item.dishId);
          if (!dish) return;

          const side = item.selectedSideId ? sides.find(s => s.id === item.selectedSideId) : undefined;
          
          const key = `${dish.id}${item.selectedSideId ? `_${item.selectedSideId}` : ''}`;

          if (summary[key]) {
            summary[key].totalQuantity += 1;
          } else {
            summary[key] = {
              dishId: dish.id,
              dishName: dish.name,
              category: dish.category,
              selectedSideId: item.selectedSideId,
              selectedSideName: side?.name,
              totalQuantity: 1,
            };
          }
        });
      });
      setAggregatedOrder(Object.values(summary).sort((a,b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return a.dishName.localeCompare(b.dishName);
      }));
    };

    if (!isLoadingOrders) {
        aggregate();
    }
  }, [allOrders, selectedAggregateDate, isLoadingOrders, menuItems, sides]);

  useEffect(() => {
    const savedName = localStorage.getItem('lunch_employeeName') || '';
    const savedDept = localStorage.getItem('lunch_department') || '';
    if (savedName || savedDept) {
      setCurrentEmployeeOrder(prev => ({
        ...prev,
        employeeName: savedName,
        department: savedDept,
      }));
    }
  }, []);

  useEffect(() => {
    if (currentEmployeeOrder.employeeName)
      localStorage.setItem('lunch_employeeName', currentEmployeeOrder.employeeName);
    if (currentEmployeeOrder.department)
      localStorage.setItem('lunch_department', currentEmployeeOrder.department);
  }, [currentEmployeeOrder.employeeName, currentEmployeeOrder.department]);

  const SuccessCheck = () => (
    <div className="flex flex-col items-center justify-center bg-green-100 bg-opacity-90 rounded-xl shadow-lg px-8 py-6 border-2 border-green-400">
      <svg className="h-12 w-12 text-green-500 animate-bounce mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-green-700 font-semibold text-lg">Заказ успешно отправлен!</span>
    </div>
  );

  const filteredOrders = selectedDept === 'Все отделы'
    ? allOrders
    : selectedDept
      ? allOrders.filter(order => order.department === selectedDept)
      : [];

  const availableDepartments = Array.from(new Set(allOrders.map(order => order.department))).sort();

  useEffect(() => {
    if (selectedDept !== 'Все отделы' && selectedDept !== '' && !availableDepartments.includes(selectedDept)) {
      setSelectedDept('Все отделы');
    }
  }, [availableDepartments, selectedDept]);

  const OrderPage = () => (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      {/* Force city selection modal */}
      {!city && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-2 animate-fade-in">
            <h3 className="text-lg font-semibold mb-2 text-black">Выберите город</h3>
            <p className="text-sm text-neutral-600 mb-4">Пожалуйста, выберите город для загрузки меню и адресов.</p>
            <div className="space-y-2">
              {CITIES.map(c => (
                <button
                  key={c.id}
                  className="w-full text-left px-4 py-2 rounded border border-neutral-300 hover:bg-neutral-100"
                  onClick={() => setCity(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-center gap-4 mt-2 mb-2 flex-col sm:flex-row items-center">
        {(city === 'omsk') && (
          <button
            className={`px-6 py-2 rounded-lg font-semibold border-2 transition-all duration-150 ${
              selectedAddress === 'office' 
                ? 'bg-[#ff4139] text-white border-[#ff4139]' 
                : 'bg-white text-black border-neutral-300 hover:bg-neutral-100'
            }`}
            onClick={() => setSelectedAddress('office')}
          >
            Офис
          </button>
        )}
        <div className="relative group">
          <button className={`px-6 py-2 rounded-lg font-semibold border-2 transition-all duration-150 flex items-center gap-2 ${
            selectedAddress !== 'office'
              ? 'bg-[#ff4139] text-white border-[#ff4139]'
              : 'bg-white text-black border-neutral-300 hover:bg-neutral-100'
          }`}>
            {selectedAddress === 'office' ? 'Выберите кофейню' : (CITY_ADDRESSES[city] || CITY_ADDRESSES.omsk).find(a => a.id === selectedAddress)?.label}
            <svg className={`w-4 h-4 ${selectedAddress !== 'office' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="py-1">
              {(CITY_ADDRESSES[city] || CITY_ADDRESSES.omsk).filter(addr => addr.id !== 'office').map(addr => (
                <button
                  key={addr.id}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedAddress === addr.id 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedAddress(addr.id)}
                >
                  {addr.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="relative group">
          <button className="px-6 py-2 rounded-lg font-semibold border-2 transition-all duration-150 bg-white text-black border-neutral-300 hover:bg-neutral-100">
            {(CITIES.find(c => c.id === city)?.label) || 'Город'}
          </button>
          <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="py-1">
              {CITIES.map(c => (
                <button
                  key={c.id}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    city === c.id 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setCity(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
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
      <main className={`flex-grow container mx-auto p-4 md:p-8 space-y-12 ${fetchError ? 'mt-2' : 'mt-1'}`}>
        <section>
        <OrderForm
          currentOrder={currentEmployeeOrder}
          setCurrentOrder={setCurrentEmployeeOrder}
          updateCurrentOrderItems={updateCurrentOrderItems}
          updateCurrentOrderDetails={updateCurrentOrderDetails}
          onSubmit={handleOrderSubmit}
          menuItems={getCurrentMenuDishes(
            menuConfigDishIds ? menuItems.filter(m => menuConfigDishIds!.includes(m.id)) : menuItems
          )}
          sideDishes={sides}
          departments={selectedAddress === 'office' && city === 'omsk' ? DEPARTMENTS : []}
          isSubmitting={isSubmittingOrder}
          address={selectedAddress}
          addressLabel={(CITY_ADDRESSES[city] || CITY_ADDRESSES.omsk).find(a => a.id === selectedAddress)?.label}
          isLoadingMenu={isLoadingMenu}
        />
        </section>
        <hr className="my-8 border-t border-neutral-200" />
        <section className="mb-4">
          <Input
            aria-label="Выберите дату для сводки"
            id="aggregateDate"
            name="aggregateDate"
            type="date"
            value={selectedAggregateDate}
            onChange={e => setSelectedAggregateDate(e.target.value)}
            className="max-w-xs text-lg font-semibold"
          />
        </section>
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 tracking-tight">Индивидуальные заказы</h2>
          <div className="mb-4 max-w-xs">
            <Select
              id="department-filter"
              name="department-filter"
              value={selectedDept}
              onChange={setSelectedDept}
              className=""
              options={[
                { id: '', label: 'Выберите отдел...' },
                { id: 'Все отделы', label: 'Все отделы' },
                ...availableDepartments.map(dept => ({ id: dept, label: dept }))
              ]}
            />
            </div>
          <IndividualOrdersList
            orders={filteredOrders}
            menuItems={menuItems}
            sideDishes={sides}
            onDelete={handleDeleteOrder}
            deletingId={deletingOrderId}
          />
        </section>
        <hr className="my-8 border-t border-neutral-200" />
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 tracking-tight">Сводный заказ</h2>
            <AggregatedOrderSummary
              aggregatedItems={aggregatedOrder}
              selectedDate={selectedAggregateDate}
              onDateChange={setSelectedAggregateDate}
              address={selectedAddress}
              city={city}
              menuItems={menuItems}
              sides={sides}
            />
        </section>
        {notification && notification.type === 'success' && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
            <SuccessCheck />
          </div>
        )}
        {notification && notification.type === 'delete-success' && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-base animate-fade-in">
            {notification.message}
          </div>
        )}
        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.type === 'send' ? 'Подтвердите заказ' : 'Подтвердите удаление'}
          message={confirmModal.type === 'send' ? 'Вы уверены, что хотите отправить этот заказ?' : 'Вы уверены, что хотите удалить этот заказ?'}
          onConfirm={confirmModal.type === 'send' ? actuallySubmitOrder : actuallyDeleteOrder}
          onCancel={() => {
            setConfirmModal({ open: false, type: confirmModal.type });
            setPendingDeleteId(null);
          }}
          confirmText="Да"
          cancelText="Нет"
        />
      </main>
      <Footer />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<OrderPage />} />
      <Route
        path="/admin"
        element={
          localStorage.getItem('adminCodeEntered') ? (
            <AdminPage />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route path="/admin/login" element={<AdminAccess />} />
    </Routes>
  );
};

export default App;
