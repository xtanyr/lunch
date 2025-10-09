export enum DishCategory {
  SALAD = "Салаты",
  HOT_DISH = "Горячее",
  SOUP = "Супы", // Keep for semantic consistency, but items will be recategorized
  SINGLE_DISH = "Одно блюдо", // New category for third table
}

export interface SideDish {
  id: string;
  name: string;
}

export interface Dish {
  id: string;
  name: string;
  price?: number; // Цена для экспорта в Excel
  category: DishCategory;
  availableSideIds?: string[];
  composition?: string; // Состав блюда
  protein?: number; // Белки (г)
  carbs?: number;   // Углеводы (г)
  fats?: number;    // Жиры (г)
  garnishGrams?: number;  // Вес гарнира (г)
  sideDishGrams?: number; // Вес гарнира (г)
  isActive?: boolean; // Новое поле для управления доступностью блюда
}

export interface CurrentOrderItem {
  dishId: string;
  selectedSideId?: string;
  composition?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
  garnishGrams?: number;
  sideDishGrams?: number;
}

export interface EmployeeOrder {
  id: string; // Unique ID for the order
  employeeName: string;
  department: string;
  orderDate: string; // Date for which the order is placed (YYYY-MM-DD)
  items: CurrentOrderItem[];
  timestamp: Date;
  address: string; // Новый адрес (офис/кофейня)
}

export interface AggregatedOrderItem {
  dishId: string;
  dishName: string;
  category: DishCategory;
  selectedSideId?: string;
  selectedSideName?: string;
  composition?: string;
  totalQuantity: number; // This remains, representing how many people ordered it
  price?: number; // Цена для экспорта в Excel
}

// Новые типы для админки
export interface MenuCategory {
  id: string;
  name: string;
  dishIds: string[];
}

export interface MenuConfig {
  categories: MenuCategory[];
  lastUpdated: string;
}
