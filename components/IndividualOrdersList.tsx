import React from 'react';
import { EmployeeOrder, Dish, SideDish } from '../types';
import { TrashIcon } from '@heroicons/react/24/outline';

interface IndividualOrdersListProps {
  orders: EmployeeOrder[];
  menuItems: Dish[];
  sideDishes: SideDish[];
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

const formatDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}.${month}.${year}`;
    }
    return dateStr; 
  } catch (error) {
    return dateStr; 
  }
};

const IndividualOrdersList: React.FC<IndividualOrdersListProps> = ({ orders, menuItems, sideDishes, onDelete, deletingId }) => {
  if (orders.length === 0) {
    return (
      <section aria-labelledby="individual-orders-title" className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-neutral-200 flex flex-col items-center justify-center min-h-[200px]">
        <span className="text-5xl mb-2" role="img" aria-label="Пусто">🍽️</span>
        <h2 id="individual-orders-title" className="text-xl font-semibold text-black mb-2">Индивидуальные заказы</h2>
        <p className="text-neutral-600">Пока нет отправленных заказов.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="individual-orders-title" className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-neutral-200">
      <h2 id="individual-orders-title" className="text-xl font-semibold text-black mb-6">Индивидуальные заказы ({orders.length})</h2>
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {orders.slice().reverse().map((order, idx) => {
          const submissionTime = new Date(order.timestamp);
          const formattedOrderDate = formatDateString(order.orderDate);
          const bgClass = idx % 2 === 0 ? 'bg-neutral-50' : 'bg-white';
          const initials = order.employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
          return (
            <details key={order.id} className={`${bgClass} p-4 rounded shadow-sm hover:shadow-md transition-shadow border border-neutral-200 open:bg-white open:shadow-lg flex flex-col gap-2`}>
              <summary className="font-medium text-black cursor-pointer flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-200 text-black font-bold text-base border border-neutral-300">{initials}</span>
                  <span className="text-[#ff4139] font-semibold">{order.employeeName}</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-700 border border-neutral-300">{order.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  {onDelete && (
                    <button
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded transition disabled:opacity-50 shadow-sm"
                      onClick={e => { e.preventDefault(); onDelete(order.id); }}
                      disabled={deletingId === order.id}
                      aria-label="Удалить заказ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {deletingId === order.id ? 'Удаление...' : 'Удалить'}
                    </button>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-neutral-500 transform transition-transform duration-200 details-arrow open:rotate-90">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </summary>
              <span className="block text-xs text-neutral-500 mt-1 mb-2 ml-11">Дата доставки еды: {formattedOrderDate} (Оформлен: {submissionTime.toLocaleString('ru-RU')})</span>
              <ul className="mt-1 space-y-1.5 pl-4 border-l-2 border-[#ff4139] ml-1">
                {order.items.map(item => {
                  const dish = menuItems.find(d => d.id === item.dishId);
                  const side = item.selectedSideId ? sideDishes.find(s => s.id === item.selectedSideId) : null;
                  if (!dish) return null;
                  return (
                    <li key={`${item.dishId}-${item.selectedSideId || 'noside'}`} className="text-sm text-neutral-700">
                      <div className="font-medium">{dish.name}</div>
                      {side && <div className="text-xs text-neutral-500 mt-1">Гарнир: {side.name}</div>}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
};

export default IndividualOrdersList;
