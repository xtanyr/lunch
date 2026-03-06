import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { CITY_ADDRESSES } from '../constants';

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
  grams?: number;
  calories?: number;
}

interface OrderItem {
  dishId: string;
  dishName: string;
  category: string;
  price: number;
  garnish?: string;
  sauce?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
  grams?: number;
  calories?: number;
}

interface OmskOrderFormProps {
  currentOrder: any;
  setCurrentOrder: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => void;
  isSubmitting: boolean;
  selectedAddress?: string;
}

// API functions
const fetchOmskMenu = async () => {
  const [week, vegan, other, garnishes, sauces, pastries, disabled] = await Promise.all([
    fetch('/api/omsk/active-week').then(r => r.json()),
    fetch('/api/omsk/vegan-items').then(r => r.json()),
    fetch('/api/omsk/other-items').then(r => r.json()),
    fetch('/api/omsk/garnishes').then(r => r.json()),
    fetch('/api/omsk/sauces').then(r => r.json()),
    fetch('/api/omsk/pastries').then(r => r.json()),
    fetch('/api/omsk/disabled-dates').then(r => r.json()),
  ]);
  
  let weekMenu: DishItem[] = [];
  if (week && week.weekNumber) {
    weekMenu = await fetch(`/api/omsk/week-menu/${week.weekNumber}`).then(r => r.json());
  }
  
  return { weekMenu, veganItems: vegan, otherItems: other, garnishes, sauces, pastries, disabledDates: disabled };
};

const MAX_ORDER_PRICE = 400;

// Price by category (rubles)
const CATEGORY_PRICES: Record<string, number> = {
  soup: 250,
  broth: 150,
  hot: 250,
  salad: 150,
  vegan: 150,
  other: 100,
  pastry: 0, // Free with soup/broth
  garnish: 0, // Free with hot
  sauce: 0 // Free with hot
};

const OmskOrderForm: React.FC<OmskOrderFormProps> = ({
  currentOrder,
  setCurrentOrder,
  onSubmit,
  isSubmitting,
  selectedAddress = 'office',
}) => {
  const { palette } = useTheme();
  
  // Department options for office
  const OFFICE_DEPARTMENTS = [
    'HR+Университет',
    'Маркетинг',
    'Финансовый отдел',
    'Снабжение',
    'Тренеры по кофе',
    'IT Отдел',
    'Отдел Напитки',
    'Развитие Сети',
  ];
  
  // Get coffee shop name for the selected address
  const coffeeShop = selectedAddress !== 'office' 
    ? CITY_ADDRESSES.omsk?.find(a => a.id === selectedAddress)?.label || ''
    : '';
  
  // Auto-set department when coffee shop is selected
  useEffect(() => {
    if (selectedAddress !== 'office' && coffeeShop) {
      setCurrentOrder((prev: any) => ({ ...prev, department: coffeeShop, address: selectedAddress }));
    } else if (selectedAddress === 'office') {
      setCurrentOrder((prev: any) => ({ ...prev, address: selectedAddress }));
    }
  }, [selectedAddress]);
  
  const isCoffeeShop = selectedAddress !== 'office';
  
  const [weekMenu, setWeekMenu] = useState<DishItem[]>([]);
  const [veganItems, setVeganItems] = useState<DishItem[]>([]);
  const [otherItems, setOtherItems] = useState<DishItem[]>([]);
  const [garnishes, setGarnishes] = useState<any[]>([]);
  const [sauces, setSauces] = useState<any[]>([]);
  const [pastries, setPastries] = useState<any[]>([]);
  const [disabledDates, setDisabledDates] = useState<any>(null);
  const [hasOrderedToday, setHasOrderedToday] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected items state
  const [selectedSoup, setSelectedSoup] = useState<DishItem | null>(null);
  const [selectedPastry, setSelectedPastry] = useState<string>('');
  const [selectedHotDish, setSelectedHotDish] = useState<DishItem | null>(null);
  const [selectedSalad, setSelectedSalad] = useState<DishItem | null>(null);
  const [selectedVegan, setSelectedVegan] = useState<DishItem | null>(null);
  const [selectedOther, setSelectedOther] = useState<DishItem | null>(null);
  const [selectedGarnish, setSelectedGarnish] = useState<string>('');
  const [selectedSauce, setSelectedSauce] = useState<string>('');

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchOmskMenu();
        setWeekMenu(data.weekMenu);
        setVeganItems(data.veganItems);
        setOtherItems(data.otherItems);
        setGarnishes(data.garnishes);
        setSauces(data.sauces);
        setPastries(data.pastries || []);
        setDisabledDates(data.disabledDates);
      } catch (err) {
        setError('Failed to load menu');
      } finally {
        setIsLoading(false);
      }
    };
    loadMenu();
  }, []);

  // Check if user has already ordered when current order or address changes
  useEffect(() => {
    checkIfUserOrdered();
  }, [currentOrder?.employeeName, currentOrder?.department, currentOrder?.orderDate, selectedAddress]);

  // Check if current user has already ordered today
  const checkIfUserOrdered = async () => {
    if (!currentOrder?.employeeName || !currentOrder?.department || !currentOrder?.orderDate || !selectedAddress) {
      return;
    }
    
    try {
      const params = new URLSearchParams({
        employeeName: currentOrder.employeeName,
        department: currentOrder.department,
        orderDate: currentOrder.orderDate,
        address: selectedAddress
      });
      
      const response = await fetch(`/api/omsk/can-order?${params}`);
      const data = await response.json();
      setHasOrderedToday(!data.canOrder);
    } catch (error) {
      console.error('Error checking if user ordered:', error);
    }
  };

  // Check if ordering is disabled for the current date
  const isOrderingDisabled = () => {
    if (!disabledDates || !disabledDates.startDate || !disabledDates.endDate) {
      return false;
    }
    
    const today = new Date();
    const startDate = new Date(disabledDates.startDate);
    const endDate = new Date(disabledDates.endDate);
    
    // Set time to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return today >= startDate && today <= endDate;
  };

  // Get dishes by category
  const soupDishes = weekMenu.filter(d => d.category === 'soup');
  const brothDishes = weekMenu.filter(d => d.category === 'broth');
  const hotDishes = weekMenu.filter(d => d.category === 'hot');
  const saladDishes = weekMenu.filter(d => d.category === 'salad');

  // Calculate total price based on category
  const calculateTotal = () => {
    let total = 0;
    if (selectedSoup) total += CATEGORY_PRICES[selectedSoup.category] || 0;
    if (selectedPastry) total += 0; // Pastry is free with soup/broth
    if (selectedHotDish) total += CATEGORY_PRICES.hot || 0;
    if (selectedSalad) total += CATEGORY_PRICES.salad || 0;
    if (selectedVegan) total += CATEGORY_PRICES.vegan || 0;
    if (selectedOther) total += CATEGORY_PRICES.other || 0;
    return total;
  };

  const totalPrice = calculateTotal();
  const hasAnySelection = selectedSoup || selectedHotDish || selectedSalad || selectedVegan || selectedOther || !!selectedPastry || selectedGarnish || selectedSauce;
  const canSubmit = hasAnySelection && totalPrice <= MAX_ORDER_PRICE;

  // Validate combination
  const validateCombination = (): string | null => {
    const hasSoup = !!selectedSoup;
    const hasPastry = !!selectedPastry;
    const hasHot = !!selectedHotDish;
    const hasSalad = !!selectedSalad;
    const hasVegan = !!selectedVegan;
    const hasOther = !!selectedOther;
    const hasGarnish = !!selectedGarnish;
    const hasSauce = !!selectedSauce;
    
    // Pastry requires soup or broth
    if (hasPastry && !hasSoup) {
      return 'Выпечка только к супу или бульону';
    }
    
    // Allow any combination that has at least one main item (soup, hot dish, salad, vegan, or other)
    // Garnish and sauce are only allowed with a hot dish
    if (hasSoup || hasHot || hasSalad || hasVegan || hasOther) {
      // If garnish or sauce is selected, must have a hot dish
      if ((hasGarnish || hasSauce) && !hasHot) {
        return 'Гарнир и соусы доступны только с горячим блюдом';
      }
      return null;
    }
    
    return null; // Allow empty order
  };

  const validationError = validateCombination();

  const handleSubmit = () => {
    // Build order items
    const items: OrderItem[] = [];
    
    if (selectedSoup) {
      items.push({
        dishId: selectedSoup.id,
        dishName: selectedSoup.name,
        category: selectedSoup.category,
        price: CATEGORY_PRICES[selectedSoup.category] || 0,
        protein: selectedSoup.protein,
        carbs: selectedSoup.carbs,
        fats: selectedSoup.fats,
      });
    }
    if (selectedPastry) {
      const pastryItem = pastries.find(p => p.id === selectedPastry);
      items.push({
        dishId: selectedPastry,
        dishName: pastryItem?.name || 'Выпечка',
        category: 'pastry',
        price: 0,
      });
    }
    if (selectedHotDish) {
      items.push({
        dishId: selectedHotDish.id,
        dishName: selectedHotDish.name,
        category: 'hot',
        price: CATEGORY_PRICES.hot || 0,
        protein: selectedHotDish.protein,
        carbs: selectedHotDish.carbs,
        fats: selectedHotDish.fats,
        grams: selectedHotDish.grams,
        calories: selectedHotDish.calories,
        ...(selectedGarnish ? { garnish: selectedGarnish } : {}),
        ...(selectedSauce ? { sauce: selectedSauce } : {}),
      });
    }
    if (selectedSalad) {
      items.push({
        dishId: selectedSalad.id,
        dishName: selectedSalad.name,
        category: 'salad',
        price: CATEGORY_PRICES.salad || 0,
        protein: selectedSalad.protein,
        carbs: selectedSalad.carbs,
        fats: selectedSalad.fats,
        grams: selectedSalad.grams,
        calories: selectedSalad.calories,
      });
    }
    if (selectedVegan) {
      items.push({
        dishId: selectedVegan.id,
        dishName: selectedVegan.name,
        category: 'vegan',
        price: CATEGORY_PRICES.vegan || 0,
        protein: selectedVegan.protein,
        carbs: selectedVegan.carbs,
        fats: selectedVegan.fats,
        grams: selectedVegan.grams,
        calories: selectedVegan.calories,
      });
    }
    if (selectedOther) {
      items.push({
        dishId: selectedOther.id,
        dishName: selectedOther.name,
        category: 'other',
        price: CATEGORY_PRICES.other || 0,
        protein: selectedOther.protein,
        carbs: selectedOther.carbs,
        fats: selectedOther.fats,
        grams: selectedOther.grams,
        calories: selectedOther.calories,
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
          {isCoffeeShop ? (
            <input
              type="text"
              value={coffeeShop}
              readOnly
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                borderColor: palette.colors.border,
                backgroundColor: palette.colors.cardBg,
                color: palette.colors.text,
                opacity: 0.8
              }}
            />
          ) : (
            <select
              value={currentOrder.department}
              onChange={(e) => setCurrentOrder({ ...currentOrder, department: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                borderColor: palette.colors.border,
                backgroundColor: palette.colors.cardBg,
                color: palette.colors.text
              }}
              required
            >
              <option value="">Выберите отдел</option>
              {OFFICE_DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}
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
              Суп
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {soupDishes.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => {
                    setSelectedSoup(selectedSoup?.id === dish.id ? null : dish);
                    if (selectedSoup?.id !== dish.id) {
                      setSelectedPastry('');
                    }
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
                  {(dish.protein || dish.carbs || dish.fats) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Pastry option - appears when soup/broth is selected */}
            {selectedSoup && pastries.length > 0 && (
              <div className="mt-3">
                <label className="text-sm font-medium" style={{ color: palette.colors.text }}>
                  Выберите выпечку (бесплатно):
                </label>
                <select
                  value={selectedPastry}
                  onChange={(e) => setSelectedPastry(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border"
                  style={{ 
                    borderColor: palette.colors.border,
                    backgroundColor: palette.colors.cardBg,
                    color: palette.colors.text
                  }}
                >
                  <option value="">— Не нужно —</option>
                  {pastries.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isVegan ? '🌱' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Broth dishes */}
        {brothDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Бульон
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {brothDishes.map(dish => (
                <button
                  key={dish.id}
                  onClick={() => {
                    setSelectedSoup(selectedSoup?.id === dish.id ? null : dish);
                    if (selectedSoup?.id !== dish.id) {
                      setSelectedPastry('');
                    }
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
                  {(dish.protein || dish.carbs || dish.fats) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Pastry option - appears when broth is selected */}
            {selectedSoup && pastries.length > 0 && (
              <div className="mt-3">
                <label className="text-sm font-medium" style={{ color: palette.colors.text }}>
                  Выберите выпечку (бесплатно):
                </label>
                <select
                  value={selectedPastry}
                  onChange={(e) => setSelectedPastry(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border"
                  style={{ 
                    borderColor: palette.colors.border,
                    backgroundColor: palette.colors.cardBg,
                    color: palette.colors.text
                  }}
                >
                  <option value="">— Не нужно —</option>
                  {pastries.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isVegan ? '🌱' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Hot Dish */}
        {hotDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Горячее
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
                  {(dish.protein || dish.carbs || dish.fats) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Garnish and Sauce - only show when hot dish is selected */}
            {selectedHotDish && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
                  Гарнир (бесплатно)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {garnishes.map(garnish => (
                    <button
                      key={garnish.id}
                      onClick={() => setSelectedGarnish(selectedGarnish === garnish.id ? '' : garnish.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedGarnish === garnish.id ? 'border-current' : ''
                      }`}
                      style={{ 
                        borderColor: selectedGarnish === garnish.id ? palette.colors.primary : palette.colors.border,
                        backgroundColor: selectedGarnish === garnish.id ? palette.colors.primary + '20' : palette.colors.cardBg,
                        color: palette.colors.text
                      }}
                    >
                      <div className="font-medium">{garnish.name}</div>
                    </button>
                  ))}
                </div>
                
                <h3 className="text-lg font-semibold mb-2 mt-4" style={{ color: palette.colors.text }}>
                  Соусы (бесплатно)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {sauces.map(sauce => (
                    <button
                      key={sauce.id}
                      onClick={() => setSelectedSauce(selectedSauce === sauce.id ? '' : sauce.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedSauce === sauce.id ? 'border-current' : ''
                      }`}
                      style={{ 
                        borderColor: selectedSauce === sauce.id ? palette.colors.primary : palette.colors.border,
                        backgroundColor: selectedSauce === sauce.id ? palette.colors.primary + '20' : palette.colors.cardBg,
                        color: palette.colors.text
                      }}
                    >
                      <div className="font-medium">{sauce.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Salad */}
        {saladDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Салат
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
                  {(dish.protein || dish.carbs || dish.fats) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
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
              Дополнительные блюда
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
                  {(dish.protein || dish.carbs || dish.fats) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
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
              Дополнительно
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
                  {(dish.protein || dish.carbs || dish.fats) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
            {totalPrice > 0 ? '✓' : '—'}
          </span>
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
        
        {isOrderingDisabled() && (
          <div className="mt-2 text-red-500 text-sm font-semibold">
            {disabledDates?.message || 'Прием заказов временно недоступен'}
          </div>
        )}
        
        {hasOrderedToday && (
          <div className="mt-2 text-red-500 text-sm font-semibold">
            Вы уже сделали заказ на этот день
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting || !!validationError || isOrderingDisabled() || hasOrderedToday}
        className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
        style={{ 
          backgroundColor: canSubmit && !validationError && !isOrderingDisabled() && !hasOrderedToday ? palette.colors.primary : palette.colors.border 
        }}
      >
        {hasOrderedToday ? 'Уже заказано' : isOrderingDisabled() ? 'Заказы заблокированы' : isSubmitting ? 'Отправка...' : 'Оформить заказ'}
      </button>
    </div>
  </div>
);
};

export default OmskOrderForm;
