import { EmployeeOrder, CurrentOrderItem, Dish, SideDish, MenuConfig } from './types';

const API_BASE = window.location.origin;

function getCityParam(): string {
  try {
    const city = localStorage.getItem('city') || 'omsk';
    return `city=${encodeURIComponent(city)}`;
  } catch {
    return 'city=omsk';
  }
}

export const fetchOrdersFromAPI = async (date: string, address?: string): Promise<EmployeeOrder[]> => {
  try {
    let url = `${API_BASE}/api/orders/${date}?${getCityParam()}`;
    if (address) url += `&address=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();
    return orders.map((order: any) => ({
      ...order,
      timestamp: order.timestamp ? new Date(order.timestamp) : new Date(),
    }));
  } catch (error) {
    console.error('API Error (fetchOrdersFromAPI):', error);
    throw new Error('Не удалось получить заказы с сервера.');
  }
};

export const submitOrderToAPI = async (
  orderData: Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] }
): Promise<EmployeeOrder> => {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: orderData.employeeName,
        department: orderData.department,
        orderDate: orderData.orderDate,
        items: orderData.items,
        address: orderData.address,
        city: ((): string => { try { return localStorage.getItem('city') || 'omsk'; } catch { return 'omsk'; } })()
      }),
    });
    if (!res.ok) throw new Error('Failed to submit order');
    const order = await res.json();
    return {
      ...order,
      timestamp: order.timestamp ? new Date(order.timestamp) : new Date(),
    };
  } catch (error) {
    console.error('API Error (submitOrderToAPI):', error);
    throw new Error('Не удалось отправить заказ на сервер.');
  }
};

export const deleteOrderFromAPI = async (id: string, address?: string): Promise<void> => {
  let url = `${API_BASE}/api/orders/${id}?${getCityParam()}`;
  if (address) url += `&address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete order');
};

export const fetchOrdersForDateRange = async (startDate: string, endDate: string, address?: string): Promise<{ [date: string]: EmployeeOrder[] }> => {
  try {
    const result: { [date: string]: EmployeeOrder[] } = {};
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    const promises = dates.map(async (date) => {
      try {
        const orders = await fetchOrdersFromAPI(date, address);
        if (orders.length > 0) {
          result[date] = orders;
        }
      } catch (error) {
        console.warn(`Failed to fetch orders for date ${date}:`, error);
      }
    });
    
    await Promise.all(promises);
    return result;
  } catch (error) {
    console.error('API Error (fetchOrdersForDateRange):', error);
    throw new Error('Не удалось получить заказы за выбранный период.');
  }
};

// Новые API функции для управления меню
export const fetchMenuItems = async (city?: string): Promise<Dish[]> => {
  try {
    const cityParam = city ? `city=${encodeURIComponent(city)}` : getCityParam();
    const res = await fetch(`${API_BASE}/api/menu/items?${cityParam}`);
    if (!res.ok) throw new Error('Failed to fetch menu items');
    return await res.json();
  } catch (error) {
    console.error('API Error (fetchMenuItems):', error);
    throw new Error('Не удалось получить список блюд.');
  }
};

export const fetchSideDishes = async (city?: string): Promise<SideDish[]> => {
  try {
    const cityParam = city ? `city=${encodeURIComponent(city)}` : getCityParam();
    const res = await fetch(`${API_BASE}/api/menu/sides?${cityParam}`);
    if (!res.ok) throw new Error('Failed to fetch side dishes');
    return await res.json();
  } catch (error) {
    console.error('API Error (fetchSideDishes):', error);
    throw new Error('Не удалось получить список гарниров.');
  }
};

export const updateMenuItems = async (items: Dish[], city?: string): Promise<void> => {
  try {
    const cityParam = city ? `city=${encodeURIComponent(city)}` : getCityParam();
    const res = await fetch(`${API_BASE}/api/menu/items?${cityParam}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update menu items');
    }
  } catch (error) {
    console.error('API Error (updateMenuItems):', error);
    throw new Error('Не удалось обновить список блюд.');
  }
};

export const fetchMenuConfig = async (city?: string): Promise<MenuConfig> => {
  try {
    const cityParam = city ? `city=${encodeURIComponent(city)}` : getCityParam();
    const res = await fetch(`${API_BASE}/api/menu/config?${cityParam}`);
    if (!res.ok) throw new Error('Failed to fetch menu config');
    return await res.json();
  } catch (error) {
    console.error('API Error (fetchMenuConfig):', error);
    throw new Error('Не удалось получить конфигурацию меню.');
  }
};

export const updateMenuConfig = async (config: MenuConfig, city?: string): Promise<void> => {
  try {
    const cityParam = city ? `city=${encodeURIComponent(city)}` : getCityParam();
    const res = await fetch(`${API_BASE}/api/menu/config?${cityParam}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update menu config');
    }
  } catch (error) {
    console.error('API Error (updateMenuConfig):', error);
    throw new Error('Не удалось обновить конфигурацию меню.');
  }
};

// API functions for disabled dates
export interface DisabledDateRange {
  startDate: string;
  endDate: string;
  message: string;
}

export const fetchDisabledDates = async (city?: string): Promise<DisabledDateRange | null> => {
  try {
    const cityParam = city ? `city=${encodeURIComponent(city)}` : getCityParam();
    const res = await fetch(`${API_BASE}/api/disabled-dates?${cityParam}`);
    if (!res.ok) throw new Error('Failed to fetch disabled dates');
    return await res.json();
  } catch (error) {
    console.error('API Error (fetchDisabledDates):', error);
    throw new Error('Не удалось получить настройки отключенных дат.');
  }
};

export const updateDisabledDates = async (range: DisabledDateRange | null, city?: string): Promise<void> => {
  try {
    const cityParam = city ? `city=${encodeURIComponent(city)}` : getCityParam();
    const res = await fetch(`${API_BASE}/api/disabled-dates?${cityParam}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(range),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update disabled dates');
    }
  } catch (error) {
    console.error('API Error (updateDisabledDates):', error);
    throw new Error('Не удалось обновить настройки отключенных дат.');
  }
};
