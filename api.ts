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

export const deleteOrderFromAPI = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete order');
};
