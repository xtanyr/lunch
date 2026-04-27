import React, { useCallback, useEffect, useState } from 'react';
import { CurrentOrderItem, Dish, SideDish } from '../types';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { useTheme } from '../theme/ThemeContext';

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type CurrentOrderFormState = {
  employeeName: string;
  department: string;
  orderDate: string;
  items: CurrentOrderItem[];
  address: string;
  floor: string;
};

interface OrderFormProps {
  currentOrder: CurrentOrderFormState;
  setCurrentOrder: React.Dispatch<React.SetStateAction<CurrentOrderFormState>>;
  onSubmit: () => void;
  menuItems: Dish[];
  sideDishes: SideDish[];
  isSubmitting: boolean;
  selectedAddress: string;
  addressLabel?: string;
  isLoadingMenu: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
  minDate: string;
  maxDate: string;
  currentPeriodName?: string;
}

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const SpbOrderForm: React.FC<OrderFormProps> = ({
  currentOrder,
  setCurrentOrder,
  onSubmit,
  menuItems,
  sideDishes,
  isSubmitting,
  selectedAddress,
  addressLabel,
  isLoadingMenu,
  selectedDate,
  onDateChange,
  minDate,
  maxDate,
  currentPeriodName,
}: OrderFormProps) => {
  const { palette } = useTheme();
  const [shake, setShake] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [showDeptError, setShowDeptError] = useState(false);
  const [showDateError, setShowDateError] = useState(false);
  const [showComboError, setShowComboError] = useState(false);
  const [localEmployeeName, setLocalEmployeeName] = useState(currentOrder.employeeName);
  const [localDepartment, setLocalDepartment] = useState(currentOrder.department);
  const [localOrderDate, setLocalOrderDate] = useState(currentOrder.orderDate);

  useEffect(() => {
    setLocalEmployeeName(currentOrder.employeeName);
    setLocalDepartment(currentOrder.department);
    setLocalOrderDate(currentOrder.orderDate);
  }, [currentOrder.employeeName, currentOrder.department, currentOrder.orderDate]);

  useEffect(() => {
    if (selectedDate !== localOrderDate) {
      setLocalOrderDate(selectedDate);
    }
  }, [selectedDate]);

  const updateEmployeeName = useCallback((value: string) => {
    setLocalEmployeeName(value);
  }, []);

  const updateOrderDate = useCallback((value: string) => {
    setLocalOrderDate(value);
    onDateChange(value);
  }, [onDateChange]);

  const debouncedUpdateOrderDate = useCallback(
    debounce(updateOrderDate, 300),
    [updateOrderDate]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) => {
    if (typeof e === 'string') {
      setLocalDepartment(e);
      setCurrentOrder(prev => ({ ...prev, department: e }));
      setShowDeptError(false);
    } else {
      if (e.target.name === 'employeeName') {
        setLocalEmployeeName(e.target.value);
        setShowNameError(false);
      } else if (e.target.name === 'orderDate') {
        setLocalOrderDate(e.target.value);
        debouncedUpdateOrderDate(e.target.value);
        setShowDateError(false);
      } else if (e.target.name === 'department') {
        setLocalDepartment(e.target.value);
        setCurrentOrder(prev => ({ ...prev, department: e.target.value }));
        setShowDeptError(false);
      }
    }
  };

  const handleEmployeeNameBlur = () => {
    updateEmployeeName(localEmployeeName);
  };

  const getDishType = useCallback((dish: Dish): 'soup' | 'salad' | 'hot' | undefined => {
    if (dish.dishType) return dish.dishType;
    // Map SINGLE_DISH category to soup for SPB
    if (dish.category === 'Одно блюдо') return 'soup';
    // Map SOUP category to soup
    if (dish.category === 'Супы') return 'soup';
    // Map SALAD category to salad
    if (dish.category === 'Салаты') return 'salad';
    // Map HOT_DISH category to hot
    if (dish.category === 'Горячее') return 'hot';
    return undefined;
  }, []);

  const isValidCombo = useCallback((items: CurrentOrderItem[]): boolean => {
    if (items.length !== 2) return false;
    
    const selectedDishes = items.map(item => menuItems.find(d => d.id === item.dishId)).filter(Boolean) as Dish[];
    const dishTypes = selectedDishes.map(d => getDishType(d));
    
    const hasHot = dishTypes.includes('hot');
    const hasSoupOrSalad = dishTypes.includes('soup') || dishTypes.includes('salad');
    
    // Valid combos: hot + soup OR hot + salad
    return hasHot && hasSoupOrSalad;
  }, [menuItems, getDishType]);

  const handleDishSelection = useCallback((dishIdToSelect: string) => {
    const dish = menuItems.find(d => d.id === dishIdToSelect);
    if (!dish) return;

    const dishType = getDishType(dish);
    if (!dishType) return;

    let newItems = [...currentOrder.items];
    const existingIndex = newItems.findIndex(item => item.dishId === dishIdToSelect);

    if (existingIndex !== -1) {
      // Deselect if already selected
      newItems.splice(existingIndex, 1);
    } else {
      // Treat soup and salad as the same group (first column)
      const isFirstColumn = dishType === 'soup' || dishType === 'salad';
      
      const existingTypeIndex = newItems.findIndex(item => {
        const existingDish = menuItems.find(d => d.id === item.dishId);
        if (!existingDish) return false;
        const existingType = getDishType(existingDish);
        
        if (isFirstColumn) {
          // Replace any existing soup or salad
          return existingType === 'soup' || existingType === 'salad';
        } else {
          // Replace existing hot dish
          return existingType === 'hot';
        }
      });

      if (existingTypeIndex !== -1) {
        // Replace existing item of same group
        const defaultSideId = (dish.availableSideIds && dish.availableSideIds.length > 0) ? dish.availableSideIds[0] : undefined;
        newItems[existingTypeIndex] = { dishId: dishIdToSelect, selectedSideId: defaultSideId, composition: dish.composition, protein: dish.protein, carbs: dish.carbs, fats: dish.fats, calories: dish.calories, garnishGrams: dish.garnishGrams, sideDishGrams: dish.sideDishGrams };
      } else if (newItems.length < 2) {
        // Add new item if we have room
        const defaultSideId = (dish.availableSideIds && dish.availableSideIds.length > 0) ? dish.availableSideIds[0] : undefined;
        newItems.push({ dishId: dishIdToSelect, selectedSideId: defaultSideId, composition: dish.composition, protein: dish.protein, carbs: dish.carbs, fats: dish.fats, calories: dish.calories, garnishGrams: dish.garnishGrams, sideDishGrams: dish.sideDishGrams });
      }
    }
    
    setShowComboError(false);
    setCurrentOrder(prev => ({ ...prev, items: newItems }));
  }, [currentOrder.items, menuItems, setCurrentOrder, getDishType]);

  const handleSideDishChange = useCallback((dishId: string, sideDishId: string) => {
    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.dishId === dishId ? { ...item, selectedSideId: sideDishId } : item
      )
    }));
  }, [setCurrentOrder]);

  const handleClearOrder = () => {
    setLocalEmployeeName('');
    setLocalDepartment('');
    setLocalOrderDate(minDate);
    setCurrentOrder({
       employeeName: '',
       department: '',
       orderDate: minDate,
       items: [],
       address: selectedAddress,
       floor: '',
    });
  };

  const handleSubmit = () => {
    updateEmployeeName(localEmployeeName);
    onDateChange(localOrderDate);

    let hasError = false;
    if (!localEmployeeName || localEmployeeName.trim() === '') {
      setShowNameError(true);
      hasError = true;
    }
    let departmentValue = localDepartment;
    if (departmentValue === '' && addressLabel) {
      departmentValue = addressLabel;
    }
    if (!departmentValue) {
      setShowDeptError(true);
      hasError = true;
    }
    if (!isValidCombo(currentOrder.items)) {
      setShowComboError(true);
      hasError = true;
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
    // Update currentOrder with the latest values before submitting
    setCurrentOrder(prev => ({ 
      ...prev, 
      employeeName: localEmployeeName,
      department: departmentValue,
      orderDate: localOrderDate
    }));
    setTimeout(() => onSubmit(), 0);
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
      <div className="mb-6">
        <h2 id="order-form-title" className="text-3xl font-bold text-black">Создать новый заказ</h2>
        {currentPeriodName && (
          <p className="text-sm text-gray-600 mt-1">
            Актуальное меню: {currentPeriodName}
          </p>
        )}
        <details className="mt-2">
          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">Информация о КБЖУ</summary>
          <p className="text-xs text-gray-600 mt-1">КБЖУ указано на 100г. Для блюд с гарниром, КБЖУ указано только для основного блюда.</p>
        </details>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col">
          <Input
            label="Имя сотрудника"
            id="employeeName"
            name="employeeName"
            value={localEmployeeName}
            onChange={handleInputChange}
            onBlur={handleEmployeeNameBlur}
            placeholder="Например, Иван Иванов"
            required
            aria-required="true"
            disabled={isSubmitting}
            className={showNameError ? 'border-red-500 ring-2 ring-red-400' : ''}
          />
          {showNameError && (
            <div className="text-red-500 text-xs mt-1">Пожалуйста, введите имя сотрудника</div>
          )}
          {showComboError && (
            <div className="text-red-500 text-xs mt-1">Выберите комбо: суп + горячее или салат + горячее</div>
          )}
        </div>

        <div className="flex flex-col">
          {addressLabel ? (
            <Input
              label="Кофейня"
              id="department"
              name="department"
              value={addressLabel}
              disabled
              readOnly
              className="bg-neutral-100 cursor-not-allowed"
            />
          ) : (
            <Input
              label="Отдел"
              id="department"
              name="department"
              value={localDepartment}
              onChange={handleInputChange}
              required
              aria-required="true"
              disabled={isSubmitting}
              placeholder="Например, Маркетинг"
              className={showDeptError ? 'border-red-500 ring-2 ring-red-400' : ''}
            />
          )}
          {showDeptError && !addressLabel && (
            <div className="text-red-500 text-xs mt-1">Пожалуйста, введите отдел</div>
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
            min={minDate}
            max={maxDate}
            disabled={isSubmitting}
            className={showDateError ? 'border-red-500 ring-2 ring-red-400' : ''}
          />
          {currentPeriodName && (
            <div className="text-xs mt-1" style={{ color: palette.colors.primary }}>
              Меню: {currentPeriodName}
            </div>
          )}
        </div>
      </div>

      <hr className="my-6 border-t border-neutral-200" />

      {menuItems.length === 0 && !isLoadingMenu && (
        <div className="text-center p-4" style={{ color: palette.colors.textSecondary }}>
          На выбранную дату меню пока не заполнено. Выберите другую дату.
        </div>
      )}

      {menuItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-black">Выберите 1 блюдо из каждой колонки</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Soup/Salad Column */}
            <div>
              <h4 className="text-md font-semibold mb-3 text-black border-b pb-2">Суп или Салат</h4>
              <div className="space-y-3">
                {menuItems.filter(dish => {
                  const type = getDishType(dish);
                  return type === 'soup' || type === 'salad';
                }).map((dish) => {
                  const isSelected = currentOrder.items.some(item => item.dishId === dish.id);
                  const dishType = getDishType(dish);
                  const dishTypeLabel = dishType === 'soup' ? 'Суп' : dishType === 'salad' ? 'Салат' : '';
                  const dishTypeColor = dishType === 'soup' ? 'bg-blue-100 text-blue-800' : dishType === 'salad' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
                  
                  return (
                    <div
                      key={dish.id}
                      onClick={() => !isSubmitting && handleDishSelection(dish.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                        isSelected
                          ? 'border-black bg-neutral-100'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-black">{dish.name}</div>
                        {dishTypeLabel && (
                          <span className={`text-xs px-2 py-1 rounded ${dishTypeColor}`}>{dishTypeLabel}</span>
                        )}
                      </div>
                      {dish.composition && (
                        <div className="text-xs text-gray-600 mt-1">{dish.composition}</div>
                      )}
                      {isSelected && (
                        <div className="mt-2 text-xs text-green-600 font-semibold">✓ Выбрано</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hot Dish Column */}
            <div>
              <h4 className="text-md font-semibold mb-3 text-black border-b pb-2">Горячее</h4>
              <div className="space-y-3">
                {menuItems.filter(dish => getDishType(dish) === 'hot').map((dish) => {
                  const isSelected = currentOrder.items.some(item => item.dishId === dish.id);
                  
                  return (
                    <div
                      key={dish.id}
                      onClick={() => !isSubmitting && handleDishSelection(dish.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                        isSelected
                          ? 'border-black bg-neutral-100'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-black">{dish.name}</div>
                        <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">Горячее</span>
                      </div>
                      {dish.composition && (
                        <div className="text-xs text-gray-600 mt-1">{dish.composition}</div>
                      )}
                      {isSelected && (
                        <div className="mt-2 text-xs text-green-600 font-semibold">✓ Выбрано</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {currentOrder.items.length > 0 && sideDishes.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-semibold text-black">Гарниры:</h4>
              {currentOrder.items.map((item) => {
                const dish = menuItems.find(d => d.id === item.dishId);
                if (!dish?.availableSideIds || dish.availableSideIds.length === 0) return null;
                return (
                  <div key={item.dishId} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-black">{dish.name}:</span>
                    <Select
                      id={`side-${item.dishId}`}
                      value={item.selectedSideId || ''}
                      onChange={(value) => !isSubmitting && handleSideDishChange(item.dishId, value)}
                      disabled={isSubmitting}
                      className="max-w-xs"
                    >
                      <option value="">Без гарнира</option>
                      {sideDishes
                        .filter(side => dish.availableSideIds?.includes(side.id))
                        .map(side => (
                          <option key={side.id} value={side.id}>{side.name}</option>
                        ))}
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Order Summary */}
      {currentOrder.items.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-neutral-100 border border-neutral-300">
          <div className="font-semibold mb-2 text-black">Ваш заказ:</div>
          <div className="space-y-1 text-sm text-neutral-600">
            {currentOrder.items.map((item, idx) => {
              const dish = menuItems.find(d => d.id === item.dishId);
              const side = item.selectedSideId ? sideDishes.find(s => s.id === item.selectedSideId) : null;
              return (
                <div key={idx}>
                  • {dish?.name || 'Блюдо'}
                  {side && <span className="text-neutral-500"> + {side.name}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || currentOrder.items.length === 0 || !currentOrder.orderDate || menuItems.length === 0 || !isValidCombo(currentOrder.items)}
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

export default SpbOrderForm;
