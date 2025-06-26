export enum DishCategory {
  SALAD = "Салаты",
  HOT_DISH = "Горячее",
  SOUP = "Супы", // Keep for semantic consistency, but items will be recategorized
  // DESSERT = "Десерты", // Removed
}

export interface SideDish {
  id: string;
  name: string;
}

export interface Dish {
  id: string;
  name: string;
  // price: number; // Removed: Prices are no longer displayed or used
  category: DishCategory;
  availableSideIds?: string[];
}

export interface CurrentOrderItem {
  dishId: string;
  // quantity: number; // Removed: quantity is implicitly 1
  selectedSideId?: string;
}

export interface EmployeeOrder {
  id: string; // Unique ID for the order
  employeeName: string;
  department: string;
  orderDate: string; // Date for which the order is placed (YYYY-MM-DD)
  items: CurrentOrderItem[];
  // totalCost: number; // Removed: Prices are no longer displayed or used
  timestamp: Date; // Timestamp of when the order was submitted
}

export interface AggregatedOrderItem {
  dishId: string;
  dishName: string;
  category: DishCategory;
  selectedSideId?: string;
  selectedSideName?: string;
  totalQuantity: number; // This remains, representing how many people ordered it
  // unitPrice: number; // Removed: Prices are no longer displayed or used
}