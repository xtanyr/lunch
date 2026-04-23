export interface StorageValidationResult<T> {
  valid: boolean;
  data: T | null;
  error?: string;
}

export interface OrderItemSchema {
  dishId: string;
  dishName: string;
  category: string;
  price: number;
  garnish?: string;
  garnishName?: string;
  sauce?: string;
  sauceName?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
  grams?: number;
  calories?: number;
}

export interface OrderSchema {
  id: string;
  employeeName: string;
  department: string;
  orderDate: string;
  items: OrderItemSchema[];
  address: string;
  timestamp?: string;
  totalPrice?: number;
}

const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.length > 0;
};

const isValidArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

const isValidNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

const isValidOrderItem = (item: any): item is OrderItemSchema => {
  if (!item || typeof item !== 'object') return false;
  if (!isValidString(item.dishId)) return false;
  if (!isValidString(item.dishName)) return false;
  if (!isValidString(item.category)) return false;
  if (!isValidNumber(item.price)) return false;
  return true;
};

export const validateOrderSchema = (data: any): StorageValidationResult<OrderSchema> => {
  if (!data || typeof data !== 'object') {
    return { valid: false, data: null, error: 'Data is not an object' };
  }

  if (!isValidString(data.id)) {
    return { valid: false, data: null, error: 'Missing or invalid order id' };
  }

  if (!isValidString(data.employeeName)) {
    return { valid: false, data: null, error: 'Missing or invalid employee name' };
  }

  if (!isValidString(data.department)) {
    return { valid: false, data: null, error: 'Missing or invalid department' };
  }

  if (!isValidString(data.orderDate)) {
    return { valid: false, data: null, error: 'Missing or invalid order date' };
  }

  if (!isValidString(data.address)) {
    return { valid: false, data: null, error: 'Missing or invalid address' };
  }

  if (!isValidArray(data.items)) {
    return { valid: false, data: null, error: 'Missing or invalid items array' };
  }

  for (let i = 0; i < data.items.length; i++) {
    if (!isValidOrderItem(data.items[i])) {
      return { valid: false, data: null, error: `Invalid item at index ${i}` };
    }
  }

  return {
    valid: true,
    data: {
      id: data.id,
      employeeName: data.employeeName,
      department: data.department,
      orderDate: data.orderDate,
      items: data.items,
      address: data.address,
      timestamp: data.timestamp,
      totalPrice: data.totalPrice
    }
  };
};

export const safeGetItem = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    const item = localStorage.getItem(key);
    
    if (item === null || item === undefined) {
      return defaultValue;
    }
    
    if (typeof item !== 'string') {
      console.warn(`localStorage key "${key}" has non-string value, returning default`);
      return defaultValue;
    }
    
    if (item.trim() === '') {
      return defaultValue;
    }
    
    try {
      const parsed = JSON.parse(item);
      return parsed as T;
    } catch {
      console.warn(`localStorage key "${key}" contains invalid JSON, returning default`);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const safeSetItem = (key: string, value: any): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    
    if (value === undefined) {
      console.warn(`Attempted to store undefined value for key "${key}"`);
      return false;
    }
    
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
    return false;
  }
};

export const safeRemoveItem = (key: string): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};

export const validateAndSanitizeOrder = (order: any): OrderSchema | null => {
  const validation = validateOrderSchema(order);
  return validation.valid ? validation.data : null;
};

export interface LastOrder {
  employeeName: string;
  department: string;
  items: OrderItemSchema[];
  address: string;
  orderDate?: string;
}

export const getLastOrder = async (employeeName: string, department: string): Promise<LastOrder | null> => {
  try {
    // Fetch the user's most recent order from the database
    const response = await fetch(`/api/omsk/orders/last?employeeName=${encodeURIComponent(employeeName)}&department=${encodeURIComponent(department)}`);
    
    if (!response.ok) {
      console.error('Failed to fetch last order:', response.statusText);
      return null;
    }
    
    const order = await response.json();
    
    if (order && order.items && order.items.length > 0) {
      return {
        employeeName: order.employeeName,
        department: order.department,
        items: order.items,
        address: order.address,
        orderDate: order.orderDate
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching last order:', error);
    return null;
  }
};

export const setLastOrder = (order: LastOrder): boolean => {
  return safeSetItem('omsk_lastOrder', order);
};

export const clearLastOrder = (): boolean => {
  return safeRemoveItem('omsk_lastOrder');
};

export const validateIncomingOrderData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data === null || data === undefined) {
    errors.push('Order data is null or undefined');
    return { valid: false, errors };
  }
  
  if (typeof data !== 'object') {
    errors.push('Order data must be an object');
    return { valid: false, errors };
  }
  
  if (!isValidString(data.id) || data.id.length < 5) {
    errors.push('Invalid or missing order ID');
  }
  
  if (!isValidString(data.employeeName) || data.employeeName.length < 2) {
    errors.push('Invalid or missing employee name');
  }
  
  if (!isValidString(data.department) || data.department.length < 1) {
    errors.push('Invalid or missing department');
  }
  
  if (!isValidString(data.orderDate) || !/^\d{4}-\d{2}-\d{2}$/.test(data.orderDate)) {
    errors.push('Invalid or missing order date format (expected YYYY-MM-DD)');
  }
  
  if (!isValidString(data.address)) {
    errors.push('Invalid or missing address');
  }
  
  if (!isValidArray(data.items)) {
    errors.push('Items must be a valid array');
  } else if (data.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!isValidString(item?.dishId)) {
        errors.push(`Item ${index}: missing or invalid dish ID`);
      }
      if (!isValidString(item?.dishName)) {
        errors.push(`Item ${index}: missing or invalid dish name`);
      }
      if (!isValidString(item?.category)) {
        errors.push(`Item ${index}: missing or invalid category`);
      }
      if (!isValidNumber(item?.price)) {
        errors.push(`Item ${index}: missing or invalid price`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
};
