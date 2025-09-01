import React, { useState, useEffect, useCallback } from 'react';
import { EmployeeOrder, CurrentOrderItem, AggregatedOrderItem, Dish } from './types';
import { MENU_ITEMS, SIDE_DISHES, DEPARTMENTS, currentMenu } from './constants';
import OrderForm from './components/OrderForm';
import IndividualOrdersList from './components/IndividualOrdersList';
import AggregatedOrderSummary from './components/AggregatedOrderSummary';
import Header from './components/Header';
import Footer from './components/Footer';
import { fetchOrdersFromAPI, submitOrderToAPI, deleteOrderFromAPI } from './api'; // Импорт симулированного API
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

// Функция для увеличения даты на один день
const addOneDayToDate = (dateString: string): string => {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Функция для преобразования currentMenu в массив Dish
function getCurrentMenuDishes(): Dish[] {
  const idToDish = (id: string) => MENU_ITEMS.find(d => d.id === id);
  const result: Dish[] = [];
  Object.values(currentMenu).forEach((arr: any) => {
    arr.forEach((item: any) => {
      const dish = idToDish(item.id);
      if (dish) result.push(dish);
    });
  });
  return result;
}

const ADDRESSES = [
  { id: 'office', label: 'Офис' },
  { id: 'kamergersky', label: 'Камергерский' },
  { id: 'gagarina', label: 'Гагарина' },
  { id: 'drujniy', label: 'Дружный' },
  { id: 'chv', label: 'ЧВ' },
  { id: 'festival', label: 'Фестиваль' },
  { id: 'atlantida', label: 'Атлантида' },
  { id: 'sfera', label: 'Сфера' },
];

// Функция для унификации адреса - убирает суффиксы типа :1, :2 и т.д.
const normalizeAddress = (address: string): string => {
  if (!address || address === 'office') return 'office';
  // Убираем суффиксы типа :1, :2 и т.д. для всех адресов кроме офиса
  return address.split(':')[0];
};

const App: React.FC = () => {
  const initialEmployeeOrderState: Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] } = {
    employeeName: '',
    department: '',
    orderDate: getTodayDateString(),
    items: [],
    address: ADDRESSES[0].id,
  };

  const [currentEmployeeOrder, setCurrentEmployeeOrder] = useState<Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] }>({
    ...initialEmployeeOrderState
  });
  const [allOrders, setAllOrders] = useState<EmployeeOrder[]>([]);
  const [aggregatedOrder, setAggregatedOrder] = useState<AggregatedOrderItem[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'delete-success'; message: string } | null>(null);
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
  // Load selected address from localStorage or default to first address
  const [selectedAddress, setSelectedAddress] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedAddress') || ADDRESSES[0].id;
    }
    return ADDRESSES[0].id;
  });

  // Save selected address to localStorage and reset department in form when address changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAddress', selectedAddress);
      // Reset department in the form when switching between office and coffee shops
      setCurrentEmployeeOrder(prev => ({
        ...prev,
        department: ''
      }));
      setSelectedDept('Все отделы');
    }
  }, [selectedAddress]);

  // Состояния для сохранения последних введённых данных
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

  // Восстанавливаем сохранённые имя и отдел при изменении currentEmployeeOrder
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
    // Prevent duplicate order for same name+department+date
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
      
      // Сохраняем последние введённые данные
      setLastEmployeeName(currentEmployeeOrder.employeeName);
      setLastDepartment(currentEmployeeOrder.department);
      
      // Увеличиваем дату на один день, сбрасываем блюда и отдел
      const nextDate = addOneDayToDate(currentEmployeeOrder.orderDate);
      setCurrentEmployeeOrder({
        ...currentEmployeeOrder,
        orderDate: nextDate,
        department: '', // Сбрасываем отдел
        items: [], // Сбрасываем блюда
      });
      setSelectedDept('Все отделы'); // Сбрасываем выпадающий список отделов
      
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
          const dish = MENU_ITEMS.find(d => d.id === item.dishId);
          if (!dish) return;

          const side = item.selectedSideId ? SIDE_DISHES.find(s => s.id === item.selectedSideId) : undefined;
          
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
  }, [allOrders, selectedAggregateDate, isLoadingOrders]);

  // Load persisted user info from localStorage on mount
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

  // Persist employeeName and department when changed
  useEffect(() => {
    if (currentEmployeeOrder.employeeName)
      localStorage.setItem('lunch_employeeName', currentEmployeeOrder.employeeName);
    if (currentEmployeeOrder.department)
      localStorage.setItem('lunch_department', currentEmployeeOrder.department);
  }, [currentEmployeeOrder.employeeName, currentEmployeeOrder.department]);

  // Success checkmark animation with background
  const SuccessCheck = () => (
    <div className="flex flex-col items-center justify-center bg-green-100 bg-opacity-90 rounded-xl shadow-lg px-8 py-6 border-2 border-green-400">
      <svg className="h-12 w-12 text-green-500 animate-bounce mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-green-700 font-semibold text-lg">Заказ успешно отправлен!</span>
    </div>
  );

  // Filter orders for selected department
  const filteredOrders = selectedDept === 'Все отделы'
    ? allOrders
    : selectedDept
      ? allOrders.filter(order => order.department === selectedDept)
      : [];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex justify-center gap-4 mt-2 mb-2 flex-col sm:flex-row items-center">
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
        <div className="relative group">
          <button className={`px-6 py-2 rounded-lg font-semibold border-2 transition-all duration-150 flex items-center gap-2 ${
            selectedAddress !== 'office'
              ? 'bg-[#ff4139] text-white border-[#ff4139]'
              : 'bg-white text-black border-neutral-300 hover:bg-neutral-100'
          }`}>
            {selectedAddress === 'office' ? 'Выберите кофейню' : ADDRESSES.find(a => a.id === selectedAddress)?.label}
            <svg className={`w-4 h-4 ${selectedAddress !== 'office' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="py-1">
              {ADDRESSES.filter(addr => addr.id !== 'office').map(addr => (
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
          menuItems={getCurrentMenuDishes()} // Only current menu for new orders
          sideDishes={SIDE_DISHES}
          departments={selectedAddress === 'office' ? DEPARTMENTS : []}
          isSubmitting={isSubmittingOrder}
          address={selectedAddress}
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
              onChange={e => setSelectedDept(e.target.value)}
              className=""
            >
              <option value="">Выберите отдел...</option>
              <option value="Все отделы">Все отделы</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
            </div>
          <IndividualOrdersList
            orders={filteredOrders}
            menuItems={MENU_ITEMS} // Use full menu for displaying old orders
            sideDishes={SIDE_DISHES}
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
};

export default App;
