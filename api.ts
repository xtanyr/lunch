import { EmployeeOrder, CurrentOrderItem } from './types';

const API_BASE = window.location.origin;

export const fetchOrdersFromAPI = async (date: string, address?: string): Promise<EmployeeOrder[]> => {
  try {
    let url = `${API_BASE}/orders/${date}`;
    if (address) url += `?address=${encodeURIComponent(address)}`;
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
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: orderData.employeeName,
        department: orderData.department,
        orderDate: orderData.orderDate,
        items: orderData.items,
        address: orderData.address, // новое поле
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
  let url = `${API_BASE}/orders/${id}`;
  if (address) url += `?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete order');
};

export const fetchOrdersForDateRange = async (startDate: string, endDate: string, address?: string): Promise<{ [date: string]: EmployeeOrder[] }> => {
  try {
    const result: { [date: string]: EmployeeOrder[] } = {};
    
    // Создаем массив дат от startDate до endDate
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    // Получаем данные для каждой даты
    const promises = dates.map(async (date) => {
      try {
        const orders = await fetchOrdersFromAPI(date, address);
        if (orders.length > 0) {
          result[date] = orders;
        }
      } catch (error) {
        console.warn(`Failed to fetch orders for date ${date}:`, error);
        // Продолжаем с другими датами даже если одна не удалась
      }
    });
    
    await Promise.all(promises);
    return result;
  } catch (error) {
    console.error('API Error (fetchOrdersForDateRange):', error);
    throw new Error('Не удалось получить заказы за выбранный период.');
  }
};
