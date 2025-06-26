import React, { useCallback } from 'react';
import { EmployeeOrder, CurrentOrderItem, Dish, SideDish, DishCategory } from '../types';
import { MENU_ITEMS } from '../constants'; 
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import CategoryAsList from './CategoryAsList'; 

type CurrentOrderFormState = Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] };


interface OrderFormProps {
  currentOrder: CurrentOrderFormState;
  setCurrentOrder: React.Dispatch<React.SetStateAction<CurrentOrderFormState>>;
  updateCurrentOrderItems: (items: CurrentOrderItem[]) => void;
  onSubmit: () => void;
  menuItems: Dish[]; 
  sideDishes: SideDish[];
  departments: string[];
  isSubmitting: boolean; // New prop
}

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const OrderForm: React.FC<OrderFormProps> = ({
  currentOrder,
  setCurrentOrder,
  updateCurrentOrderItems,
  onSubmit,
  menuItems, 
  sideDishes,
  departments,
  isSubmitting, // Use prop
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCurrentOrder(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDishSelection = useCallback((dishIdToSelect: string) => {
    const dish = MENU_ITEMS.find(d => d.id === dishIdToSelect);
    if (!dish) return;

    const dishCategory = dish.category;
    let newItems = [...currentOrder.items];
    const existingItemIndexInCategory = newItems.findIndex(item => {
      const existingDish = MENU_ITEMS.find(d => d.id === item.dishId);
      return existingDish?.category === dishCategory;
    });

    if (existingItemIndexInCategory !== -1) {
      if (newItems[existingItemIndexInCategory].dishId === dishIdToSelect) {
        newItems.splice(existingItemIndexInCategory, 1);
      } else {
        const defaultSideId = (dish.availableSideIds && dish.availableSideIds.length > 0 && dish.category === DishCategory.HOT_DISH) ? dish.availableSideIds[0] : undefined;
        newItems[existingItemIndexInCategory] = { dishId: dishIdToSelect, selectedSideId: defaultSideId };
      }
    } else {
      const defaultSideId = (dish.availableSideIds && dish.availableSideIds.length > 0 && dish.category === DishCategory.HOT_DISH) ? dish.availableSideIds[0] : undefined;
      newItems.push({ dishId: dishIdToSelect, selectedSideId: defaultSideId });
    }
    updateCurrentOrderItems(newItems);
  }, [currentOrder.items, updateCurrentOrderItems]);


  const handleSideDishChange = useCallback((dishId: string, sideDishId: string) => {
    const newItems = currentOrder.items.map(item =>
      item.dishId === dishId ? { ...item, selectedSideId: sideDishId } : item
    );
    updateCurrentOrderItems(newItems);
  }, [currentOrder.items, updateCurrentOrderItems]);
  
  const handleClearOrder = () => {
     setCurrentOrder(prev => ({
        ...prev,
        items: [],
        employeeName: '', // Also clear name and department on full clear
        department: '',
        orderDate: getTodayDateString(), 
     }));
  };

  return (
    <section aria-labelledby="order-form-title" className="bg-white p-6 md:p-8 rounded-lg shadow-lg space-y-8 border border-neutral-200">
      <h2 id="order-form-title" className="text-3xl font-bold text-black mb-6">Создать новый заказ</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="Имя сотрудника"
          id="employeeName"
          name="employeeName"
          value={currentOrder.employeeName}
          onChange={handleInputChange}
          placeholder="Например, Иван Иванов"
          required
          aria-required="true"
          disabled={isSubmitting}
        />
        <Select
          label="Отдел"
          id="department"
          name="department"
          value={currentOrder.department}
          onChange={handleInputChange}
          required
          aria-required="true"
          disabled={isSubmitting}
        >
          <option value="" disabled>Выберите отдел...</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </Select>
        <div className="flex flex-col">
          <Input
            label="Дата заказа"
            id="orderDate"
            name="orderDate"
            type="date"
            value={currentOrder.orderDate}
            onChange={handleInputChange}
            required
            aria-required="true"
            min={getTodayDateString()}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <hr className="my-6 border-t border-neutral-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        <div>
          <CategoryAsList
            category={DishCategory.SALAD}
            title="Салаты"
            menuItems={menuItems}
            sideDishes={sideDishes}
            currentOrderItems={currentOrder.items}
            onSelectDish={isSubmitting ? () => {} : handleDishSelection} // Disable selection during submission
            onSideDishChange={isSubmitting ? () => {} : handleSideDishChange} // Disable selection during submission
          />
        </div>
        <div>
          <CategoryAsList
            category={DishCategory.HOT_DISH}
            title="Горячее и Супы"
            menuItems={menuItems}
            sideDishes={sideDishes}
            currentOrderItems={currentOrder.items}
            onSelectDish={isSubmitting ? () => {} : handleDishSelection} // Disable selection during submission
            onSideDishChange={isSubmitting ? () => {} : handleSideDishChange} // Disable selection during submission
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4">
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting || currentOrder.items.length === 0 || !currentOrder.employeeName || !currentOrder.department || !currentOrder.orderDate}
          className="flex-1 bg-black hover:bg-neutral-900 text-white font-semibold text-base py-3 rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-black"
          aria-label="Отправить заказ"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить заказ'}
        </Button>
        <Button 
          onClick={handleClearOrder} 
          variant="secondary" 
          className="flex-1 sm:flex-none bg-neutral-200 hover:bg-neutral-300 text-black font-medium text-base py-3 rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-neutral-400"
          aria-label="Очистить текущий заказ"
          disabled={isSubmitting || (currentOrder.items.length === 0 && !currentOrder.employeeName && !currentOrder.department && currentOrder.orderDate === getTodayDateString())}
        >
          Очистить текущий заказ
        </Button>
      </div>
    </section>
  );
};

export default OrderForm;
