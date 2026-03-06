import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';

// Types for the new Omsk ordering system
interface DishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  composition?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
}

interface OrderItem {
  dishId: string;
  dishName: string;
  category: string;
  price: number;
  garnish?: string;
  sauce?: string;
}

interface OmskOrderFormProps {
  currentOrder: any;
  setCurrentOrder: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

// API functions
const fetchOmskMenu = async () => {
  const [week, vegan, other, garnishes, sauces] = await Promise.all([
    fetch('/api/omsk/active-week').then(r => r.json()),
    fetch('/api/omsk/vegan-items').then(r => r.json()),
    fetch('/api/omsk/other-items').then(r => r.json()),
    fetch('/api/omsk/garnishes').then(r => r.json()),
    fetch('/api/omsk/sauces').then(r => r.json()),
  ]);
  
  let weekMenu: DishItem[] = [];
  if (week && week.weekNumber) {
    weekMenu = await fetch(`/api/omsk/week-menu/${week.weekNumber}`).then(r => r.json());
  }
  
  return { weekMenu, veganItems: vegan, otherItems: other, garnishes, sauces };
};

const MAX_ORDER_PRICE = 400;

const OmskOrderForm: React.FC<OmskOrderFormProps> = ({
  currentOrder,
  setCurrentOrder,
  onSubmit,
  isSubmitting,
}) => {
  const { palette } = useTheme();
  
  const [weekMenu, setWeekMenu] = useState<DishItem[]>([]);
  const [veganItems, setVeganItems] = useState<DishItem[]>([]);
  const [otherItems, setOtherItems] = useState<DishItem[]>([]);
  const [garnishes, setGarnishes] = useState<any[]>([]);
  const [sauces, setSauces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected items state
  const [selectedSoup, setSelectedSoup] = useState<DishItem | null>(null);
  const [selectedHotDish, setSelectedHotDish] = useState<DishItem | null>(null);
  const [selectedPatty, setSelectedPatty] = useState<DishItem | null>(null);
  const [selectedSalad, setSelectedSalad] = useState<DishItem | null>(null);
  const [selectedVegan, setSelectedVegan] = useState<DishItem | null>(null);
  const [selectedOther, setSelectedOther] = useState<DishItem | null>(null);
  const [selectedGarnish, setSelectedGarnish] = useState<string>('');
  const [selectedSauce, setSelectedSauce] = useState<string>('');
  const [standaloneGarnish, setStandaloneGarnish] = useState<string>('');

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchOmskMenu();
        setWeekMenu(data.weekMenu);
        setVeganItems(data.veganItems);
        setOtherItems(data.otherItems);
        setGarnishes(data.garnishes);
        setSauces(data.sauces);
      } catch (err) {
        setError('Failed to load menu');
      } finally {
        setIsLoading(false);
      }
    };
    loadMenu();
  }, []);

  // Get dishes by category
  const soupDishes = weekMenu.filter(d => d.category === 'soup');
  const hotDishes = weekMenu.filter(d => d.category === 'hot');
  const pattyDishes = weekMenu.filter(d => d.category === 'patty');
  const saladDishes = weekMenu.filter(d => d.category === 'salad');

  // Calculate total price
  const calculateTotal = () => {
    let total = 0;
    if (selectedSoup) total += selectedSoup.price;
    if (selectedHotDish) total += selectedHotDish.price;
    if (selectedPatty) total += selectedPatty.price;
    if (selectedSalad) total += selectedSalad.price;
    if (selectedVegan) total += selectedVegan.price;
    if (selectedOther) total += selectedOther.price;
    return total;
  };

  const totalPrice = calculateTotal();
  const canSubmit = totalPrice > 0 && totalPrice <= MAX_ORDER_PRICE;

  // Validate combination
  const validateCombination = (): string | null => {
    const hasSoup = !!selectedSoup;
    const hasBroth = selectedSoup?.name?.toLowerCase().includes('бульон');
    const hasHot = !!selectedHotDish;
    const hasPatty = !!selectedPatty;
    const hasSalad = !!selectedSalad;
    const hasVegan = !!selectedVegan;
    const hasOther = !!selectedOther;

    // Vegan can combine with almost anything except soup+patty+salad full
    if (hasVegan) {
      if (hasSoup && hasPatty && hasSalad) return 'Нельзя взять веган + суп + котлета + салат';
      if (hasHot && hasPatty) return 'Нельзя взять веган + горячее + котлета';
      return null;
    }

    // Soup + patty + salad
    if (hasSoup && !hasBroth && hasPatty && hasSalad && !hasHot && !hasVegan && !hasOther) return null;
    
    // Broth + patty + hot + garnish + sauce
    if (hasBroth && hasPatty && hasHot && (selectedGarnish || selectedSauce) && !hasSalad && !hasVegan && !hasOther) return null;
    
    // Salad + hot + garnish + sauce
    if (hasSalad && hasHot && (selectedGarnish || selectedSauce) && !hasSoup && !hasPatty && !hasVegan && !hasOther) return null;
    
    // Vegan + salad + other
    if (hasVegan && hasSalad && hasOther && !hasSoup && !hasPatty && !hasHot) return null;
    
    // Vegan + salad
    if (hasVegan && hasSalad && !hasSoup && !hasPatty && !hasHot && !hasOther) return null;
    
    // Vegan + soup
    if (hasVegan && hasSoup && !hasPatty && !hasSalad && !hasHot && !hasOther) return null;
    
    // Vegan + hot + garnish + sauce
    if (hasVegan && hasHot && (selectedGarnish || selectedSauce) && !hasSoup && !hasPatty && !hasSalad && !hasOther) return null;

    // If nothing selected, allow
    if (!hasSoup && !hasHot && !hasPatty && !hasSalad && !hasVegan && !hasOther) return null;

    return 'Неверная комбинация блюд';
  };

  const validationError = validateCombination();

  const handleSubmit = () => {
    // Build order items
    const items: OrderItem[] = [];
    
    if (selectedSoup) {
      items.push({
        dishId: selectedSoup.id,
        dishName: selectedSoup.name,
        category: 'soup',
        price: selectedSoup.price,
      });
    }
    if (selectedPatty) {
      items.push({
        dishId: selectedPatty.id,
        dishName: selectedPatty.name,
        category: 'patty',
        price: selectedPatty.price,
      });
    }
    if (selectedHotDish) {
      items.push({
        dishId: selectedHotDish.id,
        dishName: selectedHotDish.name,
        category: 'hot',
        price: selectedHotDish.price,
        garnish: selectedGarnish || undefined,
        sauce: selectedSauce || undefined,
      });
    }
    if (selectedSalad) {
      items.push({
        dishId: selectedSalad.id,
        dishName: selectedSalad.name,
        category: 'salad',
        price: selectedSalad.price,
      });
    }
    if (selectedVegan) {
      items.push({
        dishId: selectedVegan.id,
        dishName: selectedVegan.name,
        category: 'vegan',
        price: selectedVegan.price,
      });
    }
    if (selectedOther) {
      items.push({
        dishId: selectedOther.id,
        dishName: selectedOther.name,
        category: 'other',
        price: selectedOther.price,
      });
    }
    if (standaloneGarnish && !selectedHotDish) {
      items.push({
        dishId: standaloneGarnish,
        dishName: garnishes.find(g => g.id === standaloneGarnish)?.name || '',
        category: 'garnish_only',
        price: 0,
      });
    }

    setCurrentOrder({
      ...currentOrder,
      items,
    });
    onSubmit();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg" style={{ color: palette.colors.text }}>Загрузка меню...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: palette.colors.text }}>
            Имя сотрудника *
          </label>
          <input
            type="text"
            value={currentOrder.employeeName}
            onChange={(e) => setCurrentOrder({ ...currentOrder, employeeName: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border"
            style={{ 
              borderColor: palette.colors.border,
              backgroundColor: palette.colors.cardBg,
              color: palette.colors.text
            }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: palette.colors.text }}>
            Отдел *
          </label>
          <input
            type="text"
            value={currentOrder.department}
            onChange={(e) => setCurrentOrder({ ...currentOrder, department: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border"
            style={{ 
              borderColor: palette.colors.border,
              backgroundColor: palette.colors.cardBg,
              color: palette.colors.text
            }}
            required
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: palette.colors.text }}>
          Дата *
        </label>
        <input
          type="date"
          value={currentOrder.orderDate}
          onChange={(e) => setCurrentOrder({ ...currentOrder, orderDate: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border"
          style={{ 
            borderColor: palette.colors.border,
            backgroundColor: palette.colors.cardBg,
            color: palette.colors.text
          }}
          required
        />
      </div>

      {/* Dish Selection */}
      <div className="space-y-4">
        {/* Soup / Broth */}
        {soupDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Суп / Бульон (250 / 150 ₽)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {soupDishes.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => {
                    setSelectedSoup(selectedSoup?.id === dish.id ? null : dish);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedSoup?.id === dish.id ? 'border-current' : ''
                  }`}
                  style={{ 
                    borderColor: selectedSoup?.id === dish.id ? palette.colors.primary : palette.colors.border,
                    backgroundColor: selectedSoup?.id === dish.id ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: palette.colors.text
                  }}
                >
                  <div className="font-medium">{dish.name}</div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Patty */}
        {pattyDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Котлета (к супу/бульону)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {pattyDishes.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => {
                    setSelectedPatty(selectedPatty?.id === dish.id ? null : dish);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedPatty?.id === dish.id ? 'border-current' : ''
                  }`}
                  style={{ 
                    borderColor: selectedPatty?.id === dish.id ? palette.colors.primary : palette.colors.border,
                    backgroundColor: selectedPatty?.id === dish.id ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: palette.colors.text
                  }}
                >
                  <div className="font-medium">{dish.name}</div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hot Dish */}
        {hotDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Горячее (250 ₽)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {hotDishes.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => {
                    setSelectedHotDish(selectedHotDish?.id === dish.id ? null : dish);
                    if (selectedHotDish?.id === dish.id) {
                      setSelectedGarnish('');
                      setSelectedSauce('');
                    }
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedHotDish?.id === dish.id ? 'border-current' : ''
                  }`}
                  style={{ 
                    borderColor: selectedHotDish?.id === dish.id ? palette.colors.primary : palette.colors.border,
                    backgroundColor: selectedHotDish?.id === dish.id ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: palette.colors.text
                  }}
                >
                  <div className="font-medium">{dish.name}</div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Garnish and Sauce for Hot Dish */}
            {selectedHotDish && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2" style={{ color: palette.colors.text }}>Гарнир (бесплатно)</h4>
                  <select
                    value={selectedGarnish}
                    onChange={(e) => setSelectedGarnish(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ 
                      borderColor: palette.colors.border,
                      backgroundColor: palette.colors.cardBg,
                      color: palette.colors.text
                    }}
                  >
                    <option value="">Выберите гарнир</option>
                    {garnishes.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <h4 className="font-medium mb-2" style={{ color: palette.colors.text }}>Соусы (бесплатно)</h4>
                  <select
                    value={selectedSauce}
                    onChange={(e) => setSelectedSauce(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ 
                      borderColor: palette.colors.border,
                      backgroundColor: palette.colors.cardBg,
                      color: palette.colors.text
                    }}
                  >
                    <option value="">Выберите соус</option>
                    {sauces.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Salad */}
        {saladDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Салат (150 ₽)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {saladDishes.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => {
                    setSelectedSalad(selectedSalad?.id === dish.id ? null : dish);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedSalad?.id === dish.id ? 'border-current' : ''
                  }`}
                  style={{ 
                    borderColor: selectedSalad?.id === dish.id ? palette.colors.primary : palette.colors.border,
                    backgroundColor: selectedSalad?.id === dish.id ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: palette.colors.text
                  }}
                >
                  <div className="font-medium">{dish.name}</div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vegan Dishes */}
        {veganItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Веганские блюда (150 ₽)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {veganItems.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => {
                    setSelectedVegan(selectedVegan?.id === dish.id ? null : dish);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedVegan?.id === dish.id ? 'border-current' : ''
                  }`}
                  style={{ 
                    borderColor: selectedVegan?.id === dish.id ? palette.colors.primary : palette.colors.border,
                    backgroundColor: selectedVegan?.id === dish.id ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: palette.colors.text
                  }}
                >
                  <div className="font-medium">{dish.name}</div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Other Dishes */}
        {otherItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Дополнительно (100 ₽)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {otherItems.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => {
                    setSelectedOther(selectedOther?.id === dish.id ? null : dish);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedOther?.id === dish.id ? 'border-current' : ''
                  }`}
                  style={{ 
                    borderColor: selectedOther?.id === dish.id ? palette.colors.primary : palette.colors.border,
                    backgroundColor: selectedOther?.id === dish.id ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: palette.colors.text
                  }}
                >
                  <div className="font-medium">{dish.name}</div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Standalone Garnish (without hot dish) */}
        <div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
            Гарнир без горячего
          </h3>
          <select
            value={standaloneGarnish}
            onChange={(e) => setStandaloneGarnish(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border"
            style={{ 
              borderColor: palette.colors.border,
              backgroundColor: palette.colors.cardBg,
              color: palette.colors.text
            }}
          >
            <option value="">Выберите гарнир (бесплатно)</option>
            {garnishes.filter(g => g.id !== 'garnish_none').map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Price Summary */}
      <div 
        className="p-4 rounded-lg"
        style={{ 
          backgroundColor: palette.colors.cardBg,
          border: `2px solid ${palette.colors.border}`
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold" style={{ color: palette.colors.text }}>Итого:</span>
          <span 
            className="text-2xl font-bold"
            style={{ 
              color: totalPrice > MAX_ORDER_PRICE ? '#ef4444' : palette.colors.primary 
            }}
          >
            {totalPrice} ₽
          </span>
        </div>
        <div className="text-sm" style={{ color: palette.colors.textSecondary }}>
          Максимальная сумма заказа: {MAX_ORDER_PRICE} ₽
        </div>
        
        {validationError && (
          <div className="mt-2 text-red-500 text-sm">
            {validationError}
          </div>
        )}
        
        {totalPrice > MAX_ORDER_PRICE && (
          <div className="mt-2 text-red-500 text-sm">
            Превышена максимальная сумма заказа!
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting || !!validationError}
        className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
        style={{ 
          backgroundColor: canSubmit && !validationError ? palette.colors.primary : palette.colors.border 
        }}
      >
        {isSubmitting ? 'Отправка...' : 'Оформить заказ'}
      </button>
    </div>
  );
};

export default OmskOrderForm;
