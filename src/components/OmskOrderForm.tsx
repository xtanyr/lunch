import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { CITY_ADDRESSES, FLOOR_10_DEPARTMENTS, FLOOR_14_DEPARTMENTS, FLOOR_5_DEPARTMENTS } from '../constants';
import { SkeletonForm } from './ui/Skeleton';
import { getLastOrder, setLastOrder } from '../utils/localStorage';

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
  isVegan?: boolean | number;
  isVegetarian?: boolean | number;
  noGarnish?: boolean | number;
}

interface OrderItem {
  dishId: string;
  dishName: string;
  category: string;
  price: number;
  garnish?: string;
  garnishName?: string;
  garnishComposition?: string;
  garnishGrams?: number;
  garnishCalories?: number;
  sauce?: string;
  sauceName?: string;
  sauceComposition?: string;
  sauceGrams?: number;
  sauceCalories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  grams?: number;
  calories?: number;
  isVegan?: boolean | number;
  isVegetarian?: boolean | number;
  garnishInSameBox?: boolean; // New field to indicate if garnish should be in same box as dish
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

/** Normalize API shape: array of ranges or legacy single { startDate, endDate, message }. */
function getDisabledRanges(disabledDates: any): { startDate: string; endDate: string; message?: string }[] {
  if (!disabledDates) return [];
  if (Array.isArray(disabledDates)) {
    return disabledDates.filter((r) => r && r.startDate && r.endDate);
  }
  if (typeof disabledDates === 'object' && disabledDates.startDate && disabledDates.endDate) {
    return [disabledDates];
  }
  return [];
}

/** String YYYY-MM-DD compare matches server logic in POST /api/omsk/orders */
function getOrderDateBlockInfo(
  orderDate: string,
  disabledDates: any
): { blocked: boolean; message?: string } {
  if (!orderDate) return { blocked: false };
  for (const range of getDisabledRanges(disabledDates)) {
    if (orderDate >= range.startDate && orderDate <= range.endDate) {
      return { blocked: true, message: range.message };
    }
  }
  return { blocked: false };
}

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

  if (!currentOrder) {
    return <div>Loading...</div>;
  }

  // Floor selection state
  const [selectedFloor, setSelectedFloor] = useState<string>('');

  // Get departments based on selected floor
  const getFloorDepartments = () => {
    if (selectedFloor === '10') return FLOOR_10_DEPARTMENTS;
    if (selectedFloor === '14') return FLOOR_14_DEPARTMENTS;
    if (selectedFloor === '5') return FLOOR_5_DEPARTMENTS;
    return FLOOR_10_DEPARTMENTS;
  };
  
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
  }, [selectedAddress, setCurrentOrder]);
  
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
  const [selectedHotSauce, setSelectedHotSauce] = useState<string>('');
  const [selectedVeganSauce, setSelectedVeganSauce] = useState<string>('');
  const [selectedOtherSauce, setSelectedOtherSauce] = useState<string>('');
  const [savedOrder, setSavedOrder] = useState<any>(null);

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

  useEffect(() => {
    const loadLastOrder = async () => {
      if (!currentOrder?.employeeName || !currentOrder?.department) {
        return;
      }
      
      try {
        const saved = await getLastOrder(currentOrder.employeeName, currentOrder.department);
        if (saved && saved.items && saved.items.length > 0) {
          setSavedOrder(saved);
        }
      } catch (error) {
        console.error('Error loading last order:', error);
      }
    };
    
    loadLastOrder();
  }, [currentOrder.employeeName, currentOrder.department]);

  // Check if user has already ordered when current order or address changes
  useEffect(() => {
    const checkIfUserOrdered = async () => {
      if (!currentOrder || !currentOrder.employeeName || !currentOrder.department || !currentOrder.orderDate || !selectedAddress || selectedAddress === '') {
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

    checkIfUserOrdered();
  }, [currentOrder.employeeName, currentOrder.department, currentOrder.orderDate, selectedAddress]);

  // Match server: block when selected order date falls in any disabled range (see POST /api/omsk/orders)
  const orderDateBlock = getOrderDateBlockInfo(currentOrder.orderDate, disabledDates);
  const isOrderingDisabled = () => orderDateBlock.blocked;

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
  const hasAnySelection = selectedSoup || selectedHotDish || selectedSalad || selectedVegan || selectedOther || !!selectedPastry || selectedGarnish || selectedHotSauce || selectedVeganSauce || selectedOtherSauce;
  const canSubmit = hasAnySelection && totalPrice <= MAX_ORDER_PRICE;

  // Helper functions to check if adding items would exceed limit
  const wouldExceedLimit = (category: string, currentItemPrice?: number) => {
    let newTotal = totalPrice;
    
    // Add price for the item we're considering
    if (currentItemPrice) {
      newTotal += currentItemPrice;
    } else {
      // Use category price if no specific item price provided
      newTotal += CATEGORY_PRICES[category] || 0;
    }
    
    return newTotal > MAX_ORDER_PRICE;
  };

  const wouldExceedLimitWithSoup = (soup: DishItem) => {
    let newTotal = totalPrice;
    // Remove current soup price if selected
    if (selectedSoup) {
      newTotal -= CATEGORY_PRICES[selectedSoup.category] || 0;
    }
    // Add new soup price
    newTotal += CATEGORY_PRICES[soup.category] || 0;
    return newTotal > MAX_ORDER_PRICE;
  };

  const wouldExceedLimitWithHot = (_hot: DishItem) => {
    let newTotal = totalPrice;
    // Remove current hot dish price if selected
    if (selectedHotDish) {
      newTotal -= CATEGORY_PRICES.hot || 0;
    }
    // Add new hot dish price
    newTotal += CATEGORY_PRICES.hot || 0;
    return newTotal > MAX_ORDER_PRICE;
  };

  const wouldExceedLimitWithSalad = (_salad: DishItem) => {
    let newTotal = totalPrice;
    // Remove current salad price if selected
    if (selectedSalad) {
      newTotal -= CATEGORY_PRICES.salad || 0;
    }
    // Add new salad price
    newTotal += CATEGORY_PRICES.salad || 0;
    return newTotal > MAX_ORDER_PRICE;
  };

  const wouldExceedLimitWithVegan = (_vegan: DishItem) => {
    let newTotal = totalPrice;
    // Remove current vegan price if selected
    if (selectedVegan) {
      newTotal -= CATEGORY_PRICES.vegan || 0;
    }
    // Add new vegan price
    newTotal += CATEGORY_PRICES.vegan || 0;
    return newTotal > MAX_ORDER_PRICE;
  };

  const wouldExceedLimitWithOther = (_other: DishItem) => {
    let newTotal = totalPrice;
    // Remove current other price if selected
    if (selectedOther) {
      newTotal -= CATEGORY_PRICES.other || 0;
    }
    // Add new other price
    newTotal += CATEGORY_PRICES.other || 0;
    return newTotal > MAX_ORDER_PRICE;
  };

  const wouldExceedLimitWithGarnish = () => {
    return wouldExceedLimit('garnish');
  };

  const wouldExceedLimitWithSauce = () => {
    return wouldExceedLimit('sauce');
  };

  const renderSauceSelector = (
    title: string,
    selectedSauceId: string,
    setSelectedSauceId: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {sauces.map(sauce => {
          const wouldExceed = wouldExceedLimitWithSauce();
          const isSelected = selectedSauceId === sauce.id;
          return (
          <button
            key={sauce.id}
            onClick={() => {
              if (!wouldExceed || isSelected) {
                setSelectedSauceId(isSelected ? '' : sauce.id);
              }
            }}
            disabled={wouldExceed && !isSelected}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              isSelected ? 'border-current' : ''
            } ${wouldExceed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ 
              borderColor: isSelected ? palette.colors.primary : palette.colors.border,
              backgroundColor: isSelected ? palette.colors.primary + '20' : palette.colors.cardBg,
              color: wouldExceed && !isSelected ? palette.colors.textSecondary : palette.colors.text
            }}
          >
            <div className="font-medium">
              {sauce.name}
              {(sauce.isVegan || sauce.isVegetarian) ? (
                <span className="ml-2">
                  {sauce.isVegan ? <span className="text-green-600">🌱</span> : null}
                  {!sauce.isVegan && sauce.isVegetarian ? <span className="text-green-500">🥬</span> : null}
                </span>
              ) : null}
            </div>
            {sauce.composition && (
              <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                {sauce.composition}
              </div>
            )}
            {(sauce.protein || sauce.carbs || sauce.fats || sauce.grams || sauce.calories) && (
              <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                {sauce.protein && <span>Б: {sauce.protein}г </span>}
                {sauce.carbs && <span>У: {sauce.carbs}г </span>}
                {sauce.fats && <span>Ж: {sauce.fats}г</span>}
                {(sauce.protein || sauce.carbs || sauce.fats) && (sauce.grams || sauce.calories) && <span> | </span>}
                {sauce.grams && `${sauce.grams}г`}{sauce.grams && sauce.calories && ' / '}{sauce.calories && `${sauce.calories}ккал`}
              </div>
            )}
          </button>
        );
        })}
      </div>
    </div>
  );

  // Validate combination
  const validateCombination = (): string | null => {
    const hasSoup = !!selectedSoup;
    const hasPastry = !!selectedPastry;
    const hasHot = !!selectedHotDish;
    const hasSalad = !!selectedSalad;
    const hasVegan = !!selectedVegan;
    const hasOther = !!selectedOther;
    const hasGarnish = !!selectedGarnish;
    const hasSauce = !!selectedHotSauce || !!selectedVeganSauce || !!selectedOtherSauce;
    
    // Pastry requires soup or broth
    if (hasPastry && !hasSoup) {
      return 'Выпечка только к супу или бульону';
    }
    
    // Allow any combination that has at least one main item (soup, hot dish, salad, vegan, or other)
    // Garnish is only allowed with a hot dish, sauce is allowed with hot/vegan/other
    if (hasSoup || hasHot || hasSalad || hasVegan || hasOther) {
      if (hasGarnish && !hasHot) {
        return 'Гарнир доступен только с горячим блюдом';
      }
      if (selectedHotSauce && !hasHot) {
        return 'Соус для горячего доступен только с горячим блюдом';
      }
      if (selectedVeganSauce && !hasVegan) {
        return 'Соус для дополнительного блюда доступен только при выборе этого блюда';
      }
      if (selectedOtherSauce && !hasOther) {
        return 'Соус для раздела "Дополнительно" доступен только при выборе этого блюда';
      }
      if (hasSauce && !hasHot && !hasVegan && !hasOther) {
        return 'Соусы доступны только с горячим или дополнительным блюдом';
      }
      return null;
    }
    
    return null; // Allow empty order
  };

  const validationError = validateCombination();

  // Reset all selections
  const resetSelections = () => {
    setSelectedSoup(null);
    setSelectedPastry('');
    setSelectedHotDish(null);
    setSelectedSalad(null);
    setSelectedVegan(null);
    setSelectedOther(null);
    setSelectedGarnish('');
    setSelectedHotSauce('');
    setSelectedVeganSauce('');
    setSelectedOtherSauce('');
  };

  // Quick reorder handler
  const handleQuickReorder = () => {
    if (!savedOrder) return;
    
    setCurrentOrder((prev: any) => ({
      ...prev,
      employeeName: savedOrder.employeeName || prev.employeeName,
      department: savedOrder.department || prev.department,
    }));
    
    if (savedOrder.items && savedOrder.items.length > 0) {
      savedOrder.items.forEach((item: any) => {
        const itemCategory = item.category;
        
        if (itemCategory === 'soup' || itemCategory === 'broth') {
          const dish = weekMenu.find(d => d.id === item.dishId);
          if (dish) setSelectedSoup(dish);
        } else if (itemCategory === 'hot') {
          const dish = weekMenu.find(d => d.id === item.dishId);
          if (dish) {
            setSelectedHotDish(dish);
            if (item.garnish) {
              const garnishMatch = garnishes.find(g => g.id === item.garnish || g.id === item.garnishName);
              if (garnishMatch) setSelectedGarnish(garnishMatch.id);
            }
            if (item.sauce) {
              const sauceMatch = sauces.find(s => s.id === item.sauce || s.id === item.sauceName);
              if (sauceMatch) setSelectedHotSauce(sauceMatch.id);
            }
          }
        } else if (itemCategory === 'salad') {
          const dish = weekMenu.find(d => d.id === item.dishId) || saladDishes.find(d => d.id === item.dishId);
          if (dish) setSelectedSalad(dish);
        } else if (itemCategory === 'vegan') {
          const dish = veganItems.find(d => d.id === item.dishId);
          if (dish) {
            setSelectedVegan(dish);
            if (item.sauce) {
              const sauceMatch = sauces.find(s => s.id === item.sauce || s.id === item.sauceName);
              if (sauceMatch) setSelectedVeganSauce(sauceMatch.id);
            }
          }
        } else if (itemCategory === 'other') {
          const dish = otherItems.find(d => d.id === item.dishId);
          if (dish) {
            setSelectedOther(dish);
            if (item.sauce) {
              const sauceMatch = sauces.find(s => s.id === item.sauce || s.id === item.sauceName);
              if (sauceMatch) setSelectedOtherSauce(sauceMatch.id);
            }
          }
        } else if (itemCategory === 'pastry') {
          const pastry = pastries.find(p => p.id === item.dishId);
          if (pastry) setSelectedPastry(pastry.id);
        }
      });
    }
    
    if (savedOrder.orderDate && savedOrder.orderDate !== currentOrder.orderDate) {
      const savedDate = new Date(savedOrder.orderDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (savedDate < today) {
        const newDate = today.toISOString().split('T')[0];
        setCurrentOrder((prev: any) => ({ ...prev, orderDate: newDate }));
      }
    }
  };

  const handleSubmit = () => {
    // Validate floor selection for office orders
    if (selectedAddress === 'office' && !selectedFloor) {
      alert('Пожалуйста, выберите этаж');
      return;
    }
    if (selectedAddress === 'office' && !currentOrder.department) {
      alert('Пожалуйста, выберите отдел');
      return;
    }

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
      const garnishItem = garnishes.find(g => g.id === selectedGarnish);
      const sauceItem = sauces.find(s => s.id === selectedHotSauce);
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
        ...(selectedGarnish && garnishItem ? { 
          garnish: garnishItem.id,
          garnishName: garnishItem.name,
          garnishComposition: garnishItem.composition,
          garnishGrams: garnishItem.grams,
          garnishCalories: garnishItem.calories
        } : {}),
        ...(selectedHotSauce && sauceItem ? { 
          sauce: sauceItem.id,
          sauceName: sauceItem.name,
          sauceComposition: sauceItem.composition,
          sauceGrams: sauceItem.grams,
          sauceCalories: sauceItem.calories
        } : {}),
        garnishInSameBox: true,
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
      const sauceItem = sauces.find(s => s.id === selectedVeganSauce);
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
        ...(selectedVeganSauce && sauceItem ? {
          sauce: sauceItem.id,
          sauceName: sauceItem.name,
          sauceComposition: sauceItem.composition,
          sauceGrams: sauceItem.grams,
          sauceCalories: sauceItem.calories
        } : {}),
      });
    }
    if (selectedOther) {
      const sauceItem = sauces.find(s => s.id === selectedOtherSauce);
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
        ...(selectedOtherSauce && sauceItem ? {
          sauce: sauceItem.id,
          sauceName: sauceItem.name,
          sauceComposition: sauceItem.composition,
          sauceGrams: sauceItem.grams,
          sauceCalories: sauceItem.calories
        } : {}),
      });
    }

    setLastOrder({
      employeeName: currentOrder.employeeName,
      department: currentOrder.department,
      items,
      address: selectedAddress === 'office' ? `office_${selectedFloor}` : selectedAddress,
      orderDate: currentOrder.orderDate
    });

    setCurrentOrder({
      ...currentOrder,
      items,
      address: selectedAddress === 'office' ? `office_${selectedFloor}` : selectedAddress,
    });
    
    // Reset all selections after order submission
    resetSelections();
    
    onSubmit();
  };

  if (isLoading) {
    return <SkeletonForm />;
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
            <>
              <select
                value={selectedFloor}
                onChange={(e) => {
                  setSelectedFloor(e.target.value);
                  setCurrentOrder((prev: any) => ({ ...prev, department: '' }));
                }}
                className="w-full px-4 py-2 rounded-lg border mb-2"
                style={{ 
                  borderColor: !selectedFloor ? '#ef4444' : palette.colors.border,
                  backgroundColor: palette.colors.cardBg,
                  color: palette.colors.text
                }}
                required
              >
                <option value="" disabled>Выберите этаж...</option>
                <option value="10">10 этаж</option>
                <option value="14">14 этаж</option>
                <option value="5">5 этаж</option>
              </select>
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
                {getFloorDepartments().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {soupDishes.map(dish => {
                const wouldExceed = wouldExceedLimitWithSoup(dish);
                const isSelected = selectedSoup?.id === dish.id;
                return (
                <button
                  key={dish.id}
                  onClick={() => {
                    if (!wouldExceed || isSelected) {
                      setSelectedSoup(isSelected ? null : dish);
                      setSelectedPastry('');
                    }
                  }}
                  disabled={wouldExceed && !isSelected}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected ? 'border-current' : ''
                  } ${wouldExceed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ 
                    borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                    backgroundColor: isSelected ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: wouldExceed && !isSelected ? palette.colors.textSecondary : palette.colors.text
                  }}
                >
                  <div className="font-medium">
                    {dish.name}
                    {(dish.isVegan || dish.isVegetarian) ? (
                      <span className="ml-2">
                        {dish.isVegan ? <span className="text-green-600">🌱</span> : null}
                        {!dish.isVegan && dish.isVegetarian ? <span className="text-green-500">🥬</span> : null}
                      </span>
                    ) : null}
                  </div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                  {(dish.protein || dish.carbs || dish.fats || dish.grams || dish.calories) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                      {dish.grams && <span> | {dish.grams}г</span>}
                      {dish.calories && <span> | {dish.calories}ккал</span>}
                    </div>
                  )}
                </button>
              );
              })}
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
                      {p.name} {p.isVegan ? '🌱' : p.isVegetarian ? '🥬' : ''}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {brothDishes.map(dish => {
                const wouldExceed = wouldExceedLimitWithSoup(dish);
                const isSelected = selectedSoup?.id === dish.id;
                return (
                <button
                  key={dish.id}
                  onClick={() => {
                    if (!wouldExceed || isSelected) {
                      setSelectedSoup(isSelected ? null : dish);
                      setSelectedPastry('');
                    }
                  }}
                  disabled={wouldExceed && !isSelected}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected ? 'border-current' : ''
                  } ${wouldExceed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ 
                    borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                    backgroundColor: isSelected ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: wouldExceed && !isSelected ? palette.colors.textSecondary : palette.colors.text
                  }}
                >
                  <div className="font-medium">
                    {dish.name}
                    {(dish.isVegan || dish.isVegetarian) ? (
                      <span className="ml-2">
                        {dish.isVegan ? <span className="text-green-600">🌱</span> : null}
                        {!dish.isVegan && dish.isVegetarian ? <span className="text-green-500">🥬</span> : null}
                      </span>
                    ) : null}
                  </div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                  {(dish.protein || dish.carbs || dish.fats || dish.grams || dish.calories) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                      {dish.grams && <span> | {dish.grams}г</span>}
                      {dish.calories && <span> | {dish.calories}ккал</span>}
                    </div>
                  )}
                </button>
              );
              })}
            </div>
          </div>
        )}

        {/* Hot Dish */}
        {hotDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Горячее
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {hotDishes.map(dish => {
                const wouldExceed = wouldExceedLimitWithHot(dish);
                const isSelected = selectedHotDish?.id === dish.id;
                return (
                <button
                  key={dish.id}
                  onClick={() => {
                    if (!wouldExceed || isSelected) {
                      setSelectedHotDish(isSelected ? null : dish);
                      setSelectedGarnish('');
                      setSelectedHotSauce('');
                      setSelectedPastry('');
                    }
                  }}
                  disabled={wouldExceed && !isSelected}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected ? 'border-current' : ''
                  } ${wouldExceed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ 
                    borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                    backgroundColor: isSelected ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: wouldExceed && !isSelected ? palette.colors.textSecondary : palette.colors.text
                  }}
                >
                  <div className="font-medium">
                    {dish.name}
                    {(dish.isVegan || dish.isVegetarian) ? (
                      <span className="ml-2">
                        {dish.isVegan ? <span className="text-green-600">🌱</span> : null}
                        {!dish.isVegan && dish.isVegetarian ? <span className="text-green-500">🥬</span> : null}
                      </span>
                    ) : null}
                    {dish.noGarnish ? (
                      <span className="ml-2 text-xs text-neutral-500">(без гарнира)</span>
                    ) : null}
                  </div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                  {(dish.protein || dish.carbs || dish.fats || dish.grams || dish.calories) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                      {dish.grams && <span> | {dish.grams}г</span>}
                      {dish.calories && <span> | {dish.calories}ккал</span>}
                    </div>
                  )}
                </button>
              );
              })}
            </div>
            
            {/* Garnish - only show when hot dish is selected and noGarnish is not set */}
            {selectedHotDish && !selectedHotDish.noGarnish && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
                  Гарнир (бесплатно)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {garnishes.map(garnish => {
                    const wouldExceed = wouldExceedLimitWithGarnish();
                    const isSelected = selectedGarnish === garnish.id;
                    return (
                    <button
                      key={garnish.id}
                      onClick={() => {
                        if (!wouldExceed || isSelected) {
                          setSelectedGarnish(isSelected ? '' : garnish.id);
                        }
                      }}
                      disabled={wouldExceed && !isSelected}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected ? 'border-current' : ''
                      } ${wouldExceed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                      style={{ 
                        borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                        backgroundColor: isSelected ? palette.colors.primary + '20' : palette.colors.cardBg,
                        color: wouldExceed && !isSelected ? palette.colors.textSecondary : palette.colors.text
                      }}
                    >
                      <div className="font-medium">
                        {garnish.name}
                        {(garnish.isVegan || garnish.isVegetarian) ? (
                          <span className="ml-2">
                            {garnish.isVegan ? <span className="text-green-600">🌱</span> : null}
                            {!garnish.isVegan && garnish.isVegetarian ? <span className="text-green-500">🥬</span> : null}
                          </span>
                        ) : null}
                      </div>
                      {garnish.composition && (
                        <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                          {garnish.composition}
                        </div>
                      )}
                      {(garnish.protein || garnish.carbs || garnish.fats || garnish.grams || garnish.calories) && (
                        <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                          {garnish.protein && <span>Б: {garnish.protein}г </span>}
                          {garnish.carbs && <span>У: {garnish.carbs}г </span>}
                          {garnish.fats && <span>Ж: {garnish.fats}г</span>}
                          {(garnish.protein || garnish.carbs || garnish.fats) && (garnish.grams || garnish.calories) && <span> | </span>}
                          {garnish.grams && `${garnish.grams}г`}{garnish.grams && garnish.calories && ' / '}{garnish.calories && `${garnish.calories}ккал`}
                        </div>
                      )}
                    </button>
                  );
                  })}
                </div>
                
                {renderSauceSelector('Соусы к горячему (бесплатно)', selectedHotSauce, setSelectedHotSauce)}
              </div>
            )}
            {selectedHotDish && selectedHotDish.noGarnish && (
              <div className="mt-4 p-3 rounded-lg bg-neutral-100 border border-neutral-300">
                <div className="text-sm text-neutral-600" style={{ color: palette.colors.textSecondary }}>
                  К этому блюду гарнир не предусмотрен
                </div>
              </div>
            )}
            {selectedHotDish && selectedHotDish.noGarnish && renderSauceSelector('Соусы к горячему (бесплатно)', selectedHotSauce, setSelectedHotSauce)}
          </div>
        )}

        {/* Salad */}
        {saladDishes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Салат
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {saladDishes.map(dish => {
                const wouldExceed = wouldExceedLimitWithSalad(dish);
                const isSelected = selectedSalad?.id === dish.id;
                return (
                <button
                  key={dish.id}
                  onClick={() => {
                    if (!wouldExceed || isSelected) {
                      setSelectedSalad(isSelected ? null : dish);
                      setSelectedPastry('');
                    }
                  }}
                  disabled={wouldExceed && !isSelected}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected ? 'border-current' : ''
                  } ${wouldExceed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ 
                    borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                    backgroundColor: isSelected ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: wouldExceed && !isSelected ? palette.colors.textSecondary : palette.colors.text
                  }}
                >
                  <div className="font-medium">
                    {dish.name}
                    {(dish.isVegan || dish.isVegetarian) ? (
                      <span className="ml-2">
                        {dish.isVegan ? <span className="text-green-600">🌱</span> : null}
                        {!dish.isVegan && dish.isVegetarian ? <span className="text-green-500">🥬</span> : null}
                      </span>
                    ) : null}
                  </div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                  {(dish.protein || dish.carbs || dish.fats || dish.grams || dish.calories) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                      {dish.grams && <span> | {dish.grams}г</span>}
                      {dish.calories && <span> | {dish.calories}ккал</span>}
                    </div>
                  )}
                </button>
              );
              })}
            </div>
          </div>
        )}

        {/* Vegan Dishes */}
        {veganItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Дополнительные блюда
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {veganItems.map(dish => {
                const wouldExceed = wouldExceedLimitWithVegan(dish);
                const isSelected = selectedVegan?.id === dish.id;
                return (
                <button
                  key={dish.id}
                  onClick={() => {
                    if (!wouldExceed || isSelected) {
                      setSelectedVegan(isSelected ? null : dish);
                      setSelectedVeganSauce('');
                      setSelectedPastry('');
                    }
                  }}
                  disabled={wouldExceed && !isSelected}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected ? 'border-current' : ''
                  } ${wouldExceed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ 
                    borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                    backgroundColor: isSelected ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: wouldExceed && !isSelected ? palette.colors.textSecondary : palette.colors.text
                  }}
                >
                  <div className="font-medium">
                    {dish.name}
                    {(dish.isVegan || dish.isVegetarian) ? (
                      <span className="ml-2">
                        {dish.isVegan ? <span className="text-green-600">🌱</span> : null}
                        {!dish.isVegan && dish.isVegetarian ? <span className="text-green-500">🥬</span> : null}
                      </span>
                    ) : null}
                  </div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                  {(dish.protein || dish.carbs || dish.fats || dish.grams || dish.calories) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                      {dish.grams && <span> | {dish.grams}г</span>}
                      {dish.calories && <span> | {dish.calories}ккал</span>}
                    </div>
                  )}
                </button>
              );
              })}
            </div>
            {selectedVegan && renderSauceSelector('Соусы к дополнительному блюду (бесплатно)', selectedVeganSauce, setSelectedVeganSauce)}
          </div>
        )}

        {/* Other Dishes */}
        {otherItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>
              Дополнительно
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {otherItems.map(dish => {
                const wouldExceed = wouldExceedLimitWithOther(dish);
                const isSelected = selectedOther?.id === dish.id;
                return (
                <button
                  key={dish.id}
                  onClick={() => {
                    if (!wouldExceed || isSelected) {
                      setSelectedOther(isSelected ? null : dish);
                      setSelectedOtherSauce('');
                      setSelectedPastry('');
                    }
                  }}
                  disabled={wouldExceed && !isSelected}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected ? 'border-current' : ''
                  } ${wouldExceed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ 
                    borderColor: isSelected ? palette.colors.primary : palette.colors.border,
                    backgroundColor: isSelected ? palette.colors.primary + '20' : palette.colors.cardBg,
                    color: wouldExceed && !isSelected ? palette.colors.textSecondary : palette.colors.text
                  }}
                >
                  <div className="font-medium">
                    {dish.name}
                    {(dish.isVegan || dish.isVegetarian) ? (
                      <span className="ml-2">
                        {dish.isVegan ? <span className="text-green-600">🌱</span> : null}
                        {!dish.isVegan && dish.isVegetarian ? <span className="text-green-500">🥬</span> : null}
                      </span>
                    ) : null}
                  </div>
                  {dish.composition && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.composition}
                    </div>
                  )}
                  {(dish.protein || dish.carbs || dish.fats || dish.grams || dish.calories) && (
                    <div className="text-xs mt-1" style={{ color: palette.colors.textSecondary }}>
                      {dish.protein && <span>Б: {dish.protein}г </span>}
                      {dish.carbs && <span>У: {dish.carbs}г </span>}
                      {dish.fats && <span>Ж: {dish.fats}г</span>}
                      {dish.grams && <span> | {dish.grams}г</span>}
                      {dish.calories && <span> | {dish.calories}ккал</span>}
                    </div>
                  )}
                </button>
              );
              })}
            </div>
            {selectedOther && renderSauceSelector('Соусы к блюду "Дополнительно" (бесплатно)', selectedOtherSauce, setSelectedOtherSauce)}
          </div>
        )}

      {/* Order Summary */}
      {hasAnySelection && (
        <div 
          className="p-4 rounded-lg"
          style={{ 
            backgroundColor: palette.colors.cardBg,
            border: `2px solid ${palette.colors.border}`
          }}
        >
          <div className="font-semibold mb-2" style={{ color: palette.colors.text }}>Ваш заказ:</div>
          <div className="space-y-1 text-sm" style={{ color: palette.colors.textSecondary }}>
            {selectedSoup && <div>• Суп: {selectedSoup.name}</div>}
            {selectedPastry && <div>• Выпечка: {pastries.find(p => p.id === selectedPastry)?.name}</div>}
            {selectedHotDish && (
              <div>
                • Горячее: {selectedHotDish.name}
                {selectedGarnish && <span> + {garnishes.find(g => g.id === selectedGarnish)?.name}</span>}
                {selectedHotSauce && <span> + {sauces.find(s => s.id === selectedHotSauce)?.name}</span>}
              </div>
            )}
            {selectedSalad && <div>• Салат: {selectedSalad.name}</div>}
            {selectedVegan && <div>• Веган: {selectedVegan.name}{selectedVeganSauce ? ` + ${sauces.find(s => s.id === selectedVeganSauce)?.name}` : ''}</div>}
            {selectedOther && <div>• Другое: {selectedOther.name}{selectedOtherSauce ? ` + ${sauces.find(s => s.id === selectedOtherSauce)?.name}` : ''}</div>}
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
            {orderDateBlock.message || 'Прием заказов временно недоступен'}
          </div>
        )}
        
        {hasOrderedToday && (
          <div className="mt-2 text-red-500 text-sm font-semibold">
            Вы уже сделали заказ на этот день
          </div>
        )}
      </div>

      {/* Quick Reorder Button */}
      {savedOrder && savedOrder.items && savedOrder.items.length > 0 && (
        <button
          type="button"
          onClick={handleQuickReorder}
          className="w-full py-3 rounded-lg font-semibold border-2 transition-all hover:opacity-90"
          style={{ 
            borderColor: palette.colors.primary,
            color: palette.colors.primary,
            backgroundColor: 'transparent'
          }}
        >
          Повторить заказ ({savedOrder.items.length} {savedOrder.items.length === 1 ? 'блюдо' : savedOrder.items.length <= 4 ? 'блюда' : 'блюд'})
        </button>
      )}

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
