import React, { useCallback, useEffect, useState } from 'react';
import { EmployeeOrder, CurrentOrderItem, Dish, SideDish, DishCategory } from '../types';
import { fetchDisabledDates, DisabledDateRange } from '../api';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import CategoryAsList from './CategoryAsList';

type CurrentOrderFormState = Omit<EmployeeOrder, 'id' | 'timestamp'> & { items: CurrentOrderItem[] };

interface OrderFormProps {
  currentOrder: CurrentOrderFormState;
  setCurrentOrder: React.Dispatch<React.SetStateAction<CurrentOrderFormState>>;
  updateCurrentOrderItems: (items: CurrentOrderItem[]) => void;
  updateCurrentOrderDetails: (field: 'employeeName' | 'department' | 'orderDate', value: string) => void;
  onSubmit: () => void;
  menuItems: Dish[];
  sideDishes: SideDish[];
  departments: string[];
  isSubmitting: boolean;
  address: string;
  addressLabel?: string;
  isLoadingMenu: boolean;
}

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const OrderForm: React.FC<OrderFormProps> = ({
  currentOrder,
  setCurrentOrder,
  updateCurrentOrderItems,
  updateCurrentOrderDetails,
  onSubmit,
  menuItems,
  sideDishes,
  departments,
  isSubmitting,
  address,
  addressLabel,
  isLoadingMenu,
}: OrderFormProps) => {
  const [shake, setShake] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [showDeptError, setShowDeptError] = useState(false);
  const [showDateError, setShowDateError] = useState(false);
  const [disabledRange, setDisabledRange] = useState<DisabledDateRange | null>(null);
  const [localEmployeeName, setLocalEmployeeName] = useState(currentOrder.employeeName);
  const [localDepartment, setLocalDepartment] = useState(currentOrder.department);
  const [localOrderDate, setLocalOrderDate] = useState(currentOrder.orderDate);

  useEffect(() => {
    setLocalEmployeeName(currentOrder.employeeName);
    setLocalDepartment(currentOrder.department);
    setLocalOrderDate(currentOrder.orderDate);
  }, [currentOrder.employeeName, currentOrder.department, currentOrder.orderDate]);

  useEffect(() => {
    const loadDisabledRange = async () => {
      try {
        const range = await fetchDisabledDates();
        setDisabledRange(range);
      } catch (error) {
        console.error('Failed to load disabled range:', error);
      }
    };
    loadDisabledRange();
  }, []);

  useEffect(() => {
    // Check current date when range changes
    if (disabledRange && localOrderDate >= disabledRange.startDate && localOrderDate <= disabledRange.endDate) {
      setShowDateError(true);
    } else {
      setShowDateError(false);
    }
  }, [disabledRange, localOrderDate]);

  const updateEmployeeName = useCallback((value: string) => {
    updateCurrentOrderDetails('employeeName', value);
  }, [updateCurrentOrderDetails]);

  const debouncedUpdateEmployeeName = useCallback(
    debounce(updateEmployeeName, 300),
    [updateEmployeeName]
  );

  const updateOrderDate = useCallback((value: string) => {
    updateCurrentOrderDetails('orderDate', value);
    // Check if date is disabled
    if (disabledRange && value >= disabledRange.startDate && value <= disabledRange.endDate) {
      setShowDateError(true);
    } else {
      setShowDateError(false);
    }
  }, [updateCurrentOrderDetails, disabledRange]);

  const debouncedUpdateOrderDate = useCallback(
    debounce(updateOrderDate, 300),
    [updateOrderDate]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) => {
    if (typeof e === 'string') {
      // Handle direct string value (from Select component)
      setLocalDepartment(e);
      updateCurrentOrderDetails('department', e);
      setShowDeptError(false);
    } else {
      // Handle event object
      if (e.target.name === 'employeeName') {
        setLocalEmployeeName(e.target.value);
        debouncedUpdateEmployeeName(e.target.value);
        setShowNameError(false);
      } else if (e.target.name === 'orderDate') {
        setLocalOrderDate(e.target.value);
        debouncedUpdateOrderDate(e.target.value);
        setShowDateError(false);
      } else if (e.target.name === 'department') {
        setLocalDepartment(e.target.value);
        updateCurrentOrderDetails('department', e.target.value);
        setShowDeptError(false);
      }
    }
  };

  const handleDishSelection = useCallback((dishIdToSelect: string) => {
    const dish = menuItems.find(d => d.id === dishIdToSelect);
    if (!dish) return;

    const dishCategory = dish.category;
    let newItems = [...currentOrder.items];

    if (dishCategory === DishCategory.SINGLE_DISH) {
      if (newItems.length === 1 && newItems[0].dishId === dishIdToSelect) {
        newItems = [];
      } else {
        newItems = [{ dishId: dishIdToSelect, composition: dish.composition, protein: dish.protein, carbs: dish.carbs, fats: dish.fats, garnishGrams: dish.garnishGrams, sideDishGrams: dish.sideDishGrams }];
      }
    } else {
      const singleDishSelected = newItems.some(item => {
        const d = menuItems.find(dd => dd.id === item.dishId);
        return d?.category === DishCategory.SINGLE_DISH;
      });
      if (singleDishSelected) return;

      const existingItemIndexInCategory = newItems.findIndex(item => {
        const existingDish = menuItems.find(d => d.id === item.dishId);
        return existingDish?.category === dishCategory;
      });

      if (existingItemIndexInCategory !== -1) {
        if (newItems[existingItemIndexInCategory].dishId === dishIdToSelect) {
          newItems.splice(existingItemIndexInCategory, 1);
        } else {
          const defaultSideId = (dish.availableSideIds && dish.availableSideIds.length > 0 && dish.category === DishCategory.HOT_DISH) ? dish.availableSideIds[0] : undefined;
          newItems[existingItemIndexInCategory] = { dishId: dishIdToSelect, selectedSideId: defaultSideId, composition: dish.composition, protein: dish.protein, carbs: dish.carbs, fats: dish.fats, garnishGrams: dish.garnishGrams, sideDishGrams: dish.sideDishGrams };
        }
      } else {
        const defaultSideId = (dish.availableSideIds && dish.availableSideIds.length > 0 && dish.category === DishCategory.HOT_DISH) ? dish.availableSideIds[0] : undefined;
        newItems.push({ dishId: dishIdToSelect, selectedSideId: defaultSideId, composition: dish.composition, protein: dish.protein, carbs: dish.carbs, fats: dish.fats, garnishGrams: dish.garnishGrams, sideDishGrams: dish.sideDishGrams });
      }
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
      setLocalEmployeeName('');
      updateCurrentOrderDetails('employeeName', '');
      setLocalDepartment('');
      updateCurrentOrderDetails('department', '');
      setLocalOrderDate(getTodayDateString());
      updateCurrentOrderDetails('orderDate', getTodayDateString());
      setCurrentOrder(prev => ({
         ...prev,
         items: [],
      }));
      updateCurrentOrderItems([]);
   };

  const handleSubmit = () => {
    // Update parent state with local values
    updateCurrentOrderDetails('employeeName', localEmployeeName);
    updateCurrentOrderDetails('department', localDepartment);
    updateCurrentOrderDetails('orderDate', localOrderDate);

    let hasError = false;
    if (!localEmployeeName) {
      setShowNameError(true);
      hasError = true;
    }
    let departmentValue = localDepartment;
    if (address !== 'office') {
      departmentValue = addressLabel || '';
    }
    if (address === 'office' && !departmentValue) {
      setShowDeptError(true);
      hasError = true;
    }
    if (disabledRange && localOrderDate >= disabledRange.startDate && localOrderDate <= disabledRange.endDate) {
      setShowDateError(true);
      hasError = true;
    } else {
      setShowDateError(false);
    }
    if (hasError) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      const employeeNameInput = document.getElementById('employeeName') as HTMLInputElement;
      if (employeeNameInput) {
        employeeNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        employeeNameInput.focus();
      }
      return;
    }
    if (address !== 'office' && localDepartment !== departmentValue) {
      setCurrentOrder(prev => ({ ...prev, department: departmentValue }));
      setTimeout(() => onSubmit(), 0);
      return;
    }
    onSubmit();
  };

  if (isLoadingMenu) {
    return (
      <section aria-labelledby="order-form-title" className="bg-white p-6 md:p-8 rounded-lg shadow-lg space-y-8 border border-neutral-200">
        <div className="text-center py-8">
          <div className="text-gray-500">Загрузка меню...</div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="order-form-title" className="bg-white p-6 md:p-8 rounded-lg shadow-lg space-y-8 border border-neutral-200">
      <h2 id="order-form-title" className="text-3xl font-bold text-black mb-6">Создать новый заказ</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col">
          <Input
            label="Имя сотрудника"
            id="employeeName"
            name="employeeName"
            value={localEmployeeName}
            onChange={handleInputChange}
            placeholder="Например, Иван Иванов"
            required
            aria-required="true"
            disabled={isSubmitting}
            className={showNameError ? 'border-red-500 ring-2 ring-red-400' : ''}
          />
          {showNameError && (
            <div className="text-red-500 text-xs mt-1">Пожалуйста, введите имя сотрудника</div>
          )}
        </div>
        <div className="flex flex-col">
          {address === 'office' ? (
            <Select
              label="Отдел"
              id="department"
              name="department"
              value={localDepartment}
              onChange={handleInputChange}
              required
              aria-required="true"
              disabled={isSubmitting}
              className={showDeptError ? 'border-red-500 ring-2 ring-red-400' : ''}
            >
              <option value="" disabled>Выберите отдел...</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
          ) : (
            <Input
              label="Кофейня"
              id="department"
              name="department"
              value={addressLabel || ''}
              disabled
              readOnly
              required
              aria-required="true"
              className="bg-neutral-100 cursor-not-allowed"
            />
          )}
          {showDeptError && address === 'office' && (
            <div className="text-red-500 text-xs mt-1">Пожалуйста, выберите отдел</div>
          )}
        </div>
        <div className="flex flex-col">
          <Input
            label="Дата доставки еды"
            id="orderDate"
            name="orderDate"
            type="date"
            value={localOrderDate}
            onChange={handleInputChange}
            required
            aria-required="true"
            min={getTodayDateString()}
            disabled={isSubmitting}
            className={showDateError ? 'border-red-500 ring-2 ring-red-400' : ''}
          />
          {showDateError && disabledRange && (
            <div className="text-red-500 text-xs mt-1">{disabledRange.message}</div>
          )}
        </div>
      </div>

      <hr className="my-6 border-t border-neutral-200" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
        <div>
          <CategoryAsList
            category={DishCategory.SALAD}
            title="Первое блюдо"
            menuItems={menuItems}
            sideDishes={sideDishes}
            currentOrderItems={currentOrder.items}
            onSelectDish={isSubmitting ? () => {} : handleDishSelection}
            onSideDishChange={isSubmitting ? () => {} : handleSideDishChange}
          />
        </div>
        <div>
          <CategoryAsList
            category={DishCategory.HOT_DISH}
            title="Второе блюдо"
            menuItems={menuItems}
            sideDishes={sideDishes}
            currentOrderItems={currentOrder.items}
            onSelectDish={isSubmitting ? () => {} : handleDishSelection}
            onSideDishChange={isSubmitting ? () => {} : handleSideDishChange}
          />
        </div>
        <div>
          <CategoryAsList
            category={DishCategory.SINGLE_DISH}
            title="Одно блюдо"
            menuItems={menuItems}
            sideDishes={sideDishes}
            currentOrderItems={currentOrder.items}
            onSelectDish={isSubmitting ? () => {} : handleDishSelection}
            onSideDishChange={isSubmitting ? () => {} : handleSideDishChange}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || currentOrder.items.length === 0 || !currentOrder.orderDate}
          className={`flex-1 bg-black hover:bg-neutral-900 text-white font-semibold text-base py-3 rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-black ${shake ? 'animate-shake' : ''}`}
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
