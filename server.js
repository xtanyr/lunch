import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const MENU_FILE = path.join(__dirname, 'data', 'menu.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');
const DISABLED_DATES_FILE = path.join(__dirname, 'data', 'disabled_dates.json');

app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/m7', express.static(path.join(__dirname, 'm7')));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize default menu data if files don't exist
const initializeDefaultData = () => {
  if (!fs.existsSync(MENU_FILE)) {
    const defaultMenu = {
      items: [
        // Seed with a few example dishes so the app works out of the box
        { id: 'salad_ham', name: 'Салат ветчинный', price: 150, category: 'Салаты', composition: 'ветчина, огурцы, сыр, капуста, зелень, майонез', garnishGrams: 140, isActive: true },
        { id: 'soup_solyanka_meat', name: 'Солянка', price: 250, category: 'Горячее', composition: 'мясо, колбаски, огурцы, маслины, томаты, сметана, лимон', garnishGrams: 250, isActive: true },
        { id: 'single_salmon_roll', name: 'Ролл с семгой', price: 350, category: 'Одно блюдо', protein: 15.8, carbs: 45.2, fats: 8.3, garnishGrams: 250, isActive: true }
      ],
      sides: [
        { id: 'no_garnish', name: 'Без гарнира' },
        { id: 'grilled_vegetables', name: 'Овощи гриль' },
        { id: 'rice_with_vegetables', name: 'Рис с овощами' },
        { id: 'boiled_rice', name: 'Рис отварной' },
        { id: 'mashed_potatoes', name: 'Картофельное пюре' },
        { id: 'baked_potatoes', name: 'Запеченный картофель' },
        { id: 'steamed_vegetables', name: 'Овощи на пару' },
        { id: 'bulgur', name: 'Булгур' },
        { id: 'grechka', name: 'Гречка' },
        { id: 'spaghetti', name: 'Спагетти' },
        { id: 'ptitim', name: 'Паста пти-тим' },
        { id: 'poppy_seeds', name: 'Мак' },
        { id: 'apple', name: 'Яблоко' },
      ]
    };
    fs.writeFileSync(MENU_FILE, JSON.stringify(defaultMenu, null, 2));
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      categories: [
        {
          id: 'Салаты',
          name: 'Салаты',
          dishIds: ['salad_ham']
        },
        {
          id: 'Горячее',
          name: 'Горячее',
          dishIds: ['soup_solyanka_meat']
        },
        {
          id: 'Одно блюдо',
          name: 'Одно блюдо',
          dishIds: ['single_salmon_roll']
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
};

// Helpers for per-city storage
function toSafeSegment(value) {
  if (!value) return 'default';
  return String(value).toLowerCase().replace(/[^a-zа-я0-9]/gi, '_');
}

function getMenuFileByCity(city) {
  const safeCity = toSafeSegment(city);
  return path.join(__dirname, 'data', `menu_${safeCity}.json`);
}

function getConfigFileByCity(city) {
  const safeCity = toSafeSegment(city);
  return path.join(__dirname, 'data', `config_${safeCity}.json`);
}

function getDisabledDatesFile(city) {
  const safeCity = toSafeSegment(city);
  return path.join(__dirname, 'data', `disabled_dates_${safeCity}.json`);
}

function getOrdersFile(city, address) {
  const safeCity = toSafeSegment(city);
  const safeAddr = (!address || address === 'office') ? 'office' : toSafeSegment(address);
  return path.join(__dirname, 'data', `orders_${safeCity}_${safeAddr}.json`);
}

// Helper to read orders from file by address
function readOrders(address, city) {
  const file = getOrdersFile(city, address);
  if (!fs.existsSync(file)) return [];
  const data = fs.readFileSync(file, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to write orders to file by address
function writeOrders(orders, address, city) {
  const file = getOrdersFile(city, address);
  fs.writeFileSync(file, JSON.stringify(orders, null, 2));
}

// Helper to read menu data
function readMenuData(city) {
  const file = city ? getMenuFileByCity(city) : MENU_FILE;
  if (!fs.existsSync(file)) {
    if (city && fs.existsSync(MENU_FILE)) {
      fs.copyFileSync(MENU_FILE, file);
    } else {
      initializeDefaultData();
    }
  }
  const data = fs.readFileSync(file, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return { items: [], sides: [] };
  }
}

// Helper to write menu data
function writeMenuData(menuData, city) {
  const file = city ? getMenuFileByCity(city) : MENU_FILE;
  fs.writeFileSync(file, JSON.stringify(menuData, null, 2));
}

// Helper to read config data
function readConfigData(city) {
  const file = city ? getConfigFileByCity(city) : CONFIG_FILE;
  if (!fs.existsSync(file)) {
    if (city && fs.existsSync(CONFIG_FILE)) {
      fs.copyFileSync(CONFIG_FILE, file);
    } else {
      initializeDefaultData();
    }
  }
  const data = fs.readFileSync(file, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return { categories: [], lastUpdated: new Date().toISOString() };
  }
}

// Helper to write config data
function writeConfigData(configData, city) {
  const file = city ? getConfigFileByCity(city) : CONFIG_FILE;
  fs.writeFileSync(file, JSON.stringify(configData, null, 2));
}

// Helper to read disabled dates range
function readDisabledDates(city) {
  const file = city ? getDisabledDatesFile(city) : DISABLED_DATES_FILE;
  if (!fs.existsSync(file)) {
    return null;
  }
  const data = fs.readFileSync(file, 'utf-8');
  try {
    const range = JSON.parse(data);
    return range && range.startDate && range.endDate ? range : null;
  } catch {
    return null;
  }
}

// Helper to write disabled dates range
function writeDisabledDates(range, city) {
  const file = city ? getDisabledDatesFile(city) : DISABLED_DATES_FILE;
  fs.writeFileSync(file, JSON.stringify(range, null, 2));
}

// Initialize default data on startup
initializeDefaultData();

// API Routes for Orders (existing functionality)
app.get('/api/orders/:date', (req, res) => {
  const { address, city } = req.query;
  const { date } = req.params;
  const orders = readOrders(address, city).filter(o => o.orderDate === date);
  res.json(orders);
});

app.post('/api/orders', express.json(), (req, res) => {
  const { employeeName, department, orderDate, items, address, city } = req.body;
  if (!employeeName || !orderDate || !items || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if order date is disabled
  const disabledRange = readDisabledDates(city);
  if (disabledRange && orderDate >= disabledRange.startDate && orderDate <= disabledRange.endDate) {
    return res.status(400).json({ error: disabledRange.message });
  }

  const orders = readOrders(address, city);
  const newOrder = {
    id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    employeeName,
    department: department || '',
    orderDate,
    items,
    address,
    city: city || 'omsk',
    timestamp: new Date().toISOString(),
  };
  orders.push(newOrder);
  writeOrders(orders, address, city);
  res.status(201).json(newOrder);
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { address, city } = req.query;
  let orders = readOrders(address, city);
  const initialLength = orders.length;
  orders = orders.filter(order => order.id !== id);
  if (orders.length === initialLength) {
    return res.status(404).json({ error: 'Order not found' });
  }
  writeOrders(orders, address, city);
  res.status(204).end();
});

// API Routes for Menu Management
app.get('/api/menu/items', (req, res) => {
  try {
    const { city } = req.query;
    const menuData = readMenuData(city);
    res.json(menuData.items);
  } catch (error) {
    console.error('Error reading menu items:', error);
    res.status(500).json({ error: 'Failed to read menu items' });
  }
});

app.get('/api/menu/sides', (req, res) => {
  try {
    const { city } = req.query;
    const menuData = readMenuData(city);
    res.json(menuData.sides);
  } catch (error) {
    console.error('Error reading side dishes:', error);
    res.status(500).json({ error: 'Failed to read side dishes' });
  }
});

app.put('/api/menu/items', (req, res) => {
  try {
    const { city } = req.query;
    const payload = req.body;
    const items = Array.isArray(payload) ? payload : payload?.items;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    // Persist items
    const prevMenu = readMenuData(city);
    const prevIds = new Set(prevMenu.items.map((it) => it.id));
    const newIds = new Set(items.map((it) => it.id));

    const addedIds = items.filter((it) => !prevIds.has(it.id)).map((it) => it.id);
    const removedIds = prevMenu.items.filter((it) => !newIds.has(it.id)).map((it) => it.id);

    const menuData = { ...prevMenu, items };
    writeMenuData(menuData, city);

    // Auto-sync config: add newly added dishes to their category; remove deleted dishes
    try {
      const cfg = readConfigData(city);
      const categoriesById = new Map(cfg.categories.map((c) => [c.id, c]));

      // Helper to ensure dish id in category
      const ensureInCategory = (categoryName, dishId) => {
        const cat = categoriesById.get(categoryName);
        if (!cat) return;
        if (!Array.isArray(cat.dishIds)) cat.dishIds = [];
        if (!cat.dishIds.includes(dishId)) cat.dishIds.push(dishId);
      };

      // Helper to remove dish id from all categories
      const removeFromAll = (dishId) => {
        for (const cat of categoriesById.values()) {
          if (Array.isArray(cat.dishIds)) {
            cat.dishIds = cat.dishIds.filter((id) => id !== dishId);
          }
        }
      };

      // Add newly added items into their categories by name (DishCategory strings)
      for (const id of addedIds) {
        const it = items.find((x) => x.id === id);
        if (!it) continue;
        // Only add if active is not explicitly false
        if (it.isActive === false) continue;
        ensureInCategory(it.category, id);
      }

      // Remove deleted ids
      for (const id of removedIds) removeFromAll(id);

      const merged = { ...cfg, categories: Array.from(categoriesById.values()), lastUpdated: new Date().toISOString() };
      writeConfigData(merged, city);
    } catch (e) {
      console.warn('Config auto-sync warning:', e);
    }

    res.json({ success: true, message: 'Menu items updated successfully', addedIds, removedIds });
  } catch (error) {
    console.error('Error updating menu items:', error);
    res.status(500).json({ error: 'Failed to update menu items' });
  }
});

app.get('/api/menu/config', (req, res) => {
  try {
    const { city } = req.query;
    const config = readConfigData(city);
    res.json(config);
  } catch (error) {
    console.error('Error reading menu config:', error);
    res.status(500).json({ error: 'Failed to read menu config' });
  }
});

app.put('/api/menu/config', (req, res) => {
  try {
    const { city } = req.query;
    const config = req.body;
    if (!config.categories || !Array.isArray(config.categories)) {
      return res.status(400).json({ error: 'Config must have categories array' });
    }

    const current = readConfigData(city);
    const merged = {
      ...current,
      ...config,
      lastUpdated: new Date().toISOString()
    };
    writeConfigData(merged, city);

    res.json({ success: true, message: 'Menu config updated successfully' });
  } catch (error) {
    console.error('Error updating menu config:', error);
    res.status(500).json({ error: 'Failed to update menu config' });
  }
});

// API Routes for Disabled Dates
app.get('/api/disabled-dates', (req, res) => {
  try {
    const { city } = req.query;
    const range = readDisabledDates(city);
    res.json(range);
  } catch (error) {
    console.error('Error reading disabled dates:', error);
    res.status(500).json({ error: 'Failed to read disabled dates' });
  }
});

app.put('/api/disabled-dates', (req, res) => {
  try {
    const { city } = req.query;
    const range = req.body;
    if (range && (typeof range !== 'object' || !range.startDate || !range.endDate || !range.message)) {
      return res.status(400).json({ error: 'Invalid range format' });
    }

    writeDisabledDates(range, city);
    res.json({ success: true, message: 'Disabled dates updated successfully' });
  } catch (error) {
    console.error('Error updating disabled dates:', error);
    res.status(500).json({ error: 'Failed to update disabled dates' });
  }
});

// Serve index.html for all non-API routes (for React Router support)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
