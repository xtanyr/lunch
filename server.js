import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

// Admin code - should be set via environment variable OMSK_ADMIN_CODE
// Default fallback provided for development only - remove in production
const OMSK_ADMIN_CODE = process.env.OMSK_ADMIN_CODE || 'lunch20';

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  const code = req.headers['x-admin-code'];
  if (code !== OMSK_ADMIN_CODE) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
import { 
  initOmskDatabase, 
  getOrdersByDate, 
  getOrdersByDateRange,
  createOrder, 
  deleteOrder,
  hasUserOrderedToday,
  getMenuItems, 
  getMenuSides, 
  updateMenuItems, 
  getMenuConfig, 
  updateMenuConfig,
  getDisabledDates,
  setDisabledDates,
  getActiveWeek,
  setActiveWeek,
  getAllWeeks,
  getWeekMenuItems,
  updateWeekMenuItems,
  getVeganItems,
  updateVeganItems,
  insertVeganItem,
  deleteVeganItem,
  getOtherItems,
  updateOtherItems,
  getGarnishes,
  updateGarnishes,
  deleteGarnish,
  getSauces,
  updateSauces,
  deleteSauce,
  getPastries,
  updatePastries,
  getSetting,
  setSetting,
  omskDb
} from './src/database.ts';
import { CITY_ADDRESSES, OMSK_OFFICE_ADDRESSES } from './src/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const MENU_FILE = path.join(__dirname, 'data', 'menu.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');
const DISABLED_DATES_FILE = path.join(__dirname, 'data', 'disabled_dates.json');

app.use(cors());
app.use(express.json());

// Admin login verification endpoint
app.post('/api/omsk/admin/verify', express.json(), (req, res) => {
  const { code } = req.body;
  if (code === OMSK_ADMIN_CODE) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: 'Invalid code' });
  }
});

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

// Initialize Omsk SQLite database
let omskDbReady = false;
try {
  initOmskDatabase();
  omskDbReady = true;
  console.log('Omsk SQLite database ready');
} catch (error) {
  console.error('Failed to initialize Omsk SQLite database:', error);
}

// API Routes for Omsk (using SQLite)
app.get('/api/omsk/orders/:date', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { address } = req.query;
  const { date } = req.params;
  try {
    const orders = getOrdersByDate(date, address || 'office');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching Omsk orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// New endpoint for date range orders (for Excel export)
app.get('/api/omsk/orders-range', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { startDate, endDate, address } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }
  try {
    const addressParam = address ? String(address) : 'all';
    const orders = getOrdersByDateRange(String(startDate), String(endDate), addressParam);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching Omsk orders range:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Excel export endpoint
app.get('/api/omsk/export/excel', requireAdmin, (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  
  const { startDate, endDate, address } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }
  
  try {
    // Get garnishes and sauces for name lookup
    const garnishes = getGarnishes();
    const sauces = getSauces();
    
    // Create lookup maps
    const garnishMap = {};
    garnishes.forEach(g => garnishMap[g.id] = g.name);
    
    const sauceMap = {};
    sauces.forEach(s => sauceMap[s.id] = s.name);
    
    // Import CITY_ADDRESSES for address name lookup
    const addressMap = {};
    Object.values(CITY_ADDRESSES).flat().forEach(addr => {
      addressMap[addr.id] = addr.label;
    });
    
    // Add office floor addresses
    addressMap = { ...addressMap, ...OMSK_OFFICE_ADDRESSES };
    
    let orders;
    try {
      orders = getOrdersByDateRange(startDate, endDate, address || 'all');
    } catch (dbError) {
      console.error('Database error in getOrdersByDateRange:', dbError);
      return res.status(500).json({ error: 'Failed to fetch orders from database' });
    }
    
    console.log('Export: Found', orders.length, 'orders for date range', startDate, 'to', endDate);
    
    // Group orders by date
    const ordersByDate = {};
    orders.forEach(order => {
      if (!ordersByDate[order.orderDate]) {
        ordersByDate[order.orderDate] = [];
      }
      ordersByDate[order.orderDate].push(order);
    });
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // For each date, create a sheet
    Object.keys(ordersByDate).sort().forEach(date => {
      const dayOrders = ordersByDate[date];
      
      // Group orders by address
      const ordersByAddress = {};
      dayOrders.forEach(order => {
        const addr = order.address || 'unknown';
        if (!ordersByAddress[addr]) {
          ordersByAddress[addr] = [];
        }
        ordersByAddress[addr].push(order);
      });
      
      const excelData = [];
      
      // Track dish totals for the day
      const dishDayTotals = {};
      
      // Process each address
      Object.keys(ordersByAddress).sort().forEach(addr => {
        const addressOrders = ordersByAddress[addr];
        
        // Add address header
        const addressName = addressMap[addr] || addr;
        excelData.push([addressName]);
        excelData.push(['Блюдо', 'Гарнир', 'Соусы', 'Кол-во', 'Цена', 'Сумма']);
        
        // Aggregate dishes for this address
        const dishMap = {};
        addressOrders.forEach(order => {
          if (!order.items || !Array.isArray(order.items)) return;
          
          order.items.forEach(item => {
            // Look up garnish and sauce names
            const garnishName = item.garnish ? (garnishMap[item.garnish] || item.garnish) : '';
            const sauceName = item.sauce ? (sauceMap[item.sauce] || item.sauce) : '';
            
            const key = `${item.dishName}|||${garnishName || '---'}|||${sauceName || '---'}`;
            if (!dishMap[key]) {
              dishMap[key] = { 
                quantity: 0, 
                price: item.price || 0,
                dishName: item.dishName,
                garnish: garnishName || '',
                sauce: sauceName || ''
              };
            }
            dishMap[key].quantity += 1;
          });
        });
        
        let addressTotal = 0;
        
        // Add dishes sorted by name
        Object.values(dishMap)
          .sort((a, b) => a.dishName.localeCompare(b.dishName))
          .forEach((data) => {
            const totalPrice = data.price * data.quantity;
            addressTotal += totalPrice;
            
            excelData.push([
              data.dishName,
              data.garnish,
              data.sauce,
              data.quantity,
              data.price,
              totalPrice
            ]);
            
            // Track day totals
            const dayKey = `${data.dishName}|||${data.garnish}|||${data.sauce || ''}`;
            if (!dishDayTotals[dayKey]) {
              dishDayTotals[dayKey] = { dishName: data.dishName, garnish: data.garnish, sauce: data.sauce || '', quantity: 0 };
            }
            dishDayTotals[dayKey].quantity += data.quantity;
          });
        
        // Add address total
        excelData.push(['', '', '', '', 'Итого:', addressTotal]);
        excelData.push([]); // Empty row
      });
      
      // Add dish totals for the day at the bottom
      excelData.push(['Итого по блюдам за день']);
      excelData.push(['Блюдо', 'Гарнир', 'Соусы', 'Общее кол-во']);
      
      Object.values(dishDayTotals)
        .sort((a, b) => a.dishName.localeCompare(b.dishName))
        .forEach((data) => {
          excelData.push([data.dishName, data.garnish, data.sauce || '', data.quantity]);
        });
      
      // Create worksheet
      const sheetName = date.replace(/-/g, '').slice(2);
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      worksheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Create summary sheet with daily totals by address
    const summaryData = [['Наименование']];
    const allDates = Object.keys(ordersByDate).sort();
    allDates.forEach(date => summaryData[0].push(date));
    summaryData[0].push('ИТОГО');

    const addressDailyTotals = {}; // { address: { date: total, date: total, ... }, ... }
    const addressGrandTotals = {}; // { address: grandTotal, ... }
    const dailyGrandTotals = {}; // { date: total, ... }
    let overallGrandTotal = 0;

    // Initialize dailyGrandTotals
    allDates.forEach(date => dailyGrandTotals[date] = 0);

    // Populate addressDailyTotals and addressGrandTotals
    orders.forEach(order => {
      const addr = order.address || 'unknown';
      const orderDate = order.orderDate;
      const totalPrice = order.totalPrice || 0;

      if (!addressDailyTotals[addr]) {
        addressDailyTotals[addr] = {};
        allDates.forEach(date => addressDailyTotals[addr][date] = 0);
      }
      addressDailyTotals[addr][orderDate] += totalPrice;

      addressGrandTotals[addr] = (addressGrandTotals[addr] || 0) + totalPrice;
      dailyGrandTotals[orderDate] += totalPrice;
      overallGrandTotal += totalPrice;
    });

    // Add address rows to summaryData
    Object.keys(addressDailyTotals).sort().forEach(addr => {
      const addressName = addressMap[addr] || addr;
      const row = [addressName];
      allDates.forEach(date => row.push(addressDailyTotals[addr][date]));
      row.push(addressGrandTotals[addr]);
      summaryData.push(row);
    });

    // Add "ИТОГО ПО ДНЯМ" row
    const dailyTotalRow = ['ИТОГО ПО ДНЯМ'];
    allDates.forEach(date => dailyTotalRow.push(dailyGrandTotals[date]));
    dailyTotalRow.push(overallGrandTotal);
    summaryData.push(dailyTotalRow);

    // Create summary worksheet
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    const summaryCols = [{ wch: 25 }]; // Width for 'Наименование' column
    for (let i = 0; i < allDates.length + 1; i++) { // +1 for 'ИТОГО' column
      summaryCols.push({ wch: 15 }); // Width for date and total columns
    }
    summaryWorksheet['!cols'] = summaryCols;
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Сводка');
    
    // Send Excel file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=omsk_orders_${startDate}_${endDate}.xlsx`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Check if user can order today
app.get('/api/omsk/can-order', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  
  const { employeeName, department, orderDate, address } = req.query;
  
  if (!employeeName || !department || !orderDate || !address) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    // Normalize office addresses for duplicate check
    const normalizedAddress = (address === 'office_10' || address === 'office_14') ? 'office' : address;
    const hasOrderedToday = hasUserOrderedToday(employeeName, department, orderDate, normalizedAddress);
    res.json({ canOrder: !hasOrderedToday });
  } catch (error) {
    console.error('Error checking if user can order:', error);
    res.status(500).json({ error: 'Failed to check order status' });
  }
});

app.post('/api/omsk/orders', express.json(), (req, res) => {
  console.log('POST /api/omsk/orders received:', req.method, req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  if (!omskDbReady) {
    console.log('Database not ready, returning 503');
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { employeeName, department, orderDate, items, address, totalPrice, floor } = req.body;
  console.log('Creating order:', { employeeName, department, orderDate, items: items?.length, address, totalPrice, floor });
  
  if (!employeeName || !orderDate || !items || typeof address !== 'string') {
    console.log('Validation failed - missing fields:', { employeeName: !!employeeName, orderDate: !!orderDate, items: !!items, address: typeof address });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if user already ordered today
  // Normalize office addresses for duplicate check (office_10, office_14 should be treated as 'office')
  const normalizedAddress = (address === 'office_10' || address === 'office_14') ? 'office' : address;
  const hasOrderedToday = hasUserOrderedToday(employeeName, department, orderDate, normalizedAddress);
  if (hasOrderedToday) {
    console.log('Duplicate order attempt:', { employeeName, department, orderDate, address });
    return res.status(409).json({ error: 'Вы уже сделали заказ на этот день' });
  }

  // Check if order date is disabled
  const disabledRange = getDisabledDates();
  if (disabledRange && orderDate >= disabledRange.startDate && orderDate <= disabledRange.endDate) {
    return res.status(400).json({ error: disabledRange.message });
  }

  try {
    const newOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      employeeName,
      department: department || '',
      orderDate,
      items,
      address,
      city: 'omsk',
      timestamp: new Date().toISOString(),
      totalPrice,
      floor: floor || ''
    };
    createOrder(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating Omsk order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.delete('/api/omsk/orders/:id', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  try {
    deleteOrder(id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting Omsk order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Omsk Admin API - Dishes
// Public endpoint - reading dishes is allowed without auth
app.get('/api/omsk/dishes', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const items = getMenuItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({ error: 'Failed to fetch dishes' });
  }
});

app.post('/api/omsk/dishes', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { name, category, price, weekNumber, composition, protein, carbs, fats, grams, calories, isVegan, isVegetarian } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'name and category are required' });
  }
  // Validate price
  if (price !== undefined && (typeof price !== 'number' || price < 0 || price > 10000)) {
    return res.status(400).json({ error: 'Invalid price value' });
  }
  // Validate weekNumber
  if (weekNumber !== undefined && (typeof weekNumber !== 'number' || weekNumber < 1 || weekNumber > 5)) {
    return res.status(400).json({ error: 'Invalid weekNumber (must be 1-5)' });
  }
  try {
    const newDish = {
      id: `dish-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      category,
      price: price || 0,
      weekNumber: weekNumber || 1,
      composition: composition || null,
      protein: protein !== undefined && protein !== '' ? parseFloat(protein) : null,
      carbs: carbs !== undefined && carbs !== '' ? parseFloat(carbs) : null,
      fats: fats !== undefined && fats !== '' ? parseFloat(fats) : null,
      grams: grams !== undefined && grams !== '' ? parseInt(grams) : null,
      calories: calories !== undefined && calories !== '' ? parseInt(calories) : null,
      isVegan: isVegan || false,
      isVegetarian: isVegetarian || false,
      isActive: true
    };
    const items = getMenuItems();
    items.push(newDish);
    updateMenuItems(items);
    res.status(201).json(newDish);
  } catch (error) {
    console.error('Error creating dish:', error);
    res.status(500).json({ error: 'Failed to create dish' });
  }
});

app.patch('/api/omsk/dishes/:id', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  const updates = req.body;
  try {
    const items = getMenuItems();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Dish not found' });
    }
    items[index] = { ...items[index], ...updates };
    updateMenuItems(items);
    res.json(items[index]);
  } catch (error) {
    console.error('Error updating dish:', error);
    res.status(500).json({ error: 'Failed to update dish' });
  }
});

app.delete('/api/omsk/dishes/:id', requireAdmin, (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  try {
    const items = getMenuItems();
    const filtered = items.filter((item) => item.id !== id);
    updateMenuItems(filtered);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).json({ error: 'Failed to delete dish' });
  }
});

app.get('/api/omsk/menu/items', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const items = getMenuItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching Omsk menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.get('/api/omsk/menu/sides', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const sides = getMenuSides();
    res.json(sides);
  } catch (error) {
    console.error('Error fetching Omsk menu sides:', error);
    res.status(500).json({ error: 'Failed to fetch menu sides' });
  }
});

app.put('/api/omsk/menu/items', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const payload = req.body;
  const items = Array.isArray(payload) ? payload : payload?.items;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }
  try {
    const result = updateMenuItems(items);
    res.json(result);
  } catch (error) {
    console.error('Error updating Omsk menu items:', error);
    res.status(500).json({ error: 'Failed to update menu items' });
  }
});

app.get('/api/omsk/menu/config', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const config = getMenuConfig();
    res.json(config);
  } catch (error) {
    console.error('Error fetching Omsk menu config:', error);
    res.status(500).json({ error: 'Failed to fetch menu config' });
  }
});

app.put('/api/omsk/menu/config', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const config = req.body;
  if (!config.categories || !Array.isArray(config.categories)) {
    return res.status(400).json({ error: 'Config must have categories array' });
  }
  try {
    const result = updateMenuConfig(config);
    res.json(result);
  } catch (error) {
    console.error('Error updating Omsk menu config:', error);
    res.status(500).json({ error: 'Failed to update menu config' });
  }
});

app.get('/api/omsk/disabled-dates', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const range = getDisabledDates();
    res.json(range);
  } catch (error) {
    console.error('Error fetching Omsk disabled dates:', error);
    res.status(500).json({ error: 'Failed to fetch disabled dates' });
  }
});

app.put('/api/omsk/disabled-dates', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const range = req.body;
  if (range && (typeof range !== 'object' || !range.startDate || !range.endDate || !range.message)) {
    return res.status(400).json({ error: 'Invalid range format' });
  }
  try {
    const result = setDisabledDates(range);
    res.json(result);
  } catch (error) {
    console.error('Error updating Omsk disabled dates:', error);
    res.status(500).json({ error: 'Failed to update disabled dates' });
  }
});

// Add POST and DELETE endpoints for disabled dates
app.post('/api/omsk/disabled-dates', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const range = req.body;
  if (!range || !range.startDate || !range.endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }
  try {
    const result = setDisabledDates(range);
    res.json(result);
  } catch (error) {
    console.error('Error setting disabled dates:', error);
    res.status(500).json({ error: 'Failed to set disabled dates' });
  }
});

app.delete('/api/omsk/disabled-dates', requireAdmin, (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const result = setDisabledDates(null);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing disabled dates:', error);
    res.status(500).json({ error: 'Failed to remove disabled dates' });
  }
});

// New Omsk Week-based Menu API
// Public endpoint - reading weeks is allowed without auth
app.get('/api/omsk/weeks', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const weeks = getAllWeeks();
    res.json(weeks);
  } catch (error) {
    console.error('Error fetching weeks:', error);
    res.status(500).json({ error: 'Failed to fetch weeks' });
  }
});

app.get('/api/omsk/active-week', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const week = getActiveWeek();
    res.json(week);
  } catch (error) {
    console.error('Error fetching active week:', error);
    res.status(500).json({ error: 'Failed to fetch active week' });
  }
});

app.put('/api/omsk/active-week', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { weekNumber } = req.body;
  if (!weekNumber) {
    return res.status(400).json({ error: 'weekNumber is required' });
  }
  try {
    const result = setActiveWeek(weekNumber);
    res.json(result);
  } catch (error) {
    console.error('Error setting active week:', error);
    res.status(500).json({ error: 'Failed to set active week' });
  }
});

app.get('/api/omsk/week-menu/:weekNumber', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { weekNumber } = req.params;
  try {
    const items = getWeekMenuItems(parseInt(weekNumber));
    res.json(items);
  } catch (error) {
    console.error('Error fetching week menu:', error);
    res.status(500).json({ error: 'Failed to fetch week menu' });
  }
});

app.put('/api/omsk/week-menu/:weekNumber', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { weekNumber } = req.params;
  const items = req.body;
  try {
    const result = updateWeekMenuItems(parseInt(weekNumber), items);
    res.json(result);
  } catch (error) {
    console.error('Error updating week menu:', error);
    res.status(500).json({ error: 'Failed to update week menu' });
  }
});

app.get('/api/omsk/vegan-items', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const items = getVeganItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching vegan items:', error);
    res.status(500).json({ error: 'Failed to fetch vegan items' });
  }
});

app.put('/api/omsk/vegan-items', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const items = req.body;
  try {
    const result = updateVeganItems(items);
    res.json(result);
  } catch (error) {
    console.error('Error updating vegan items:', error);
    res.status(500).json({ error: 'Failed to update vegan items' });
  }
});

// Add individual vegan item endpoints
app.post('/api/omsk/vegan-items', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { name, price, composition, protein, carbs, fats, grams, calories, isVegan, isVegetarian } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  
  try {
    const newItem = insertVeganItem({
      name,
      price: parseFloat(price),
      composition,
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fats: fats ? parseFloat(fats) : undefined,
      grams: grams ? parseInt(grams) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      isVegan,
      isVegetarian
    });
    res.json(newItem);
  } catch (error) {
    console.error('Error adding vegan item:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to add vegan item', details: error.message });
  }
});

app.patch('/api/omsk/vegan-items/:id', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  const { isActive } = req.body;
  
  try {
    const stmt = omskDb.prepare('UPDATE vegan_items SET isActive = ? WHERE id = ?');
    stmt.run(isActive ? 1 : 0, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating vegan item:', error);
    res.status(500).json({ error: 'Failed to update vegan item' });
  }
});

app.delete('/api/omsk/vegan-items/:id', requireAdmin, (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  
  try {
    const result = deleteVeganItem(id);
    console.log(`Deleted vegan item ${id}, changes: ${result.changes}`);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Error deleting vegan item:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to delete vegan item', details: error.message });
  }
});

app.get('/api/omsk/other-items', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const items = getOtherItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching other items:', error);
    res.status(500).json({ error: 'Failed to fetch other items' });
  }
});

app.put('/api/omsk/other-items', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const items = req.body;
  try {
    const result = updateOtherItems(items);
    res.json(result);
  } catch (error) {
    console.error('Error updating other items:', error);
    res.status(500).json({ error: 'Failed to update other items' });
  }
});

app.get('/api/omsk/garnishes', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const items = getGarnishes();
    res.json(items);
  } catch (error) {
    console.error('Error fetching garnishes:', error);
    res.status(500).json({ error: 'Failed to fetch garnishes' });
  }
});

app.put('/api/omsk/garnishes', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const items = req.body;
  try {
    const result = updateGarnishes(items);
    res.json(result);
  } catch (error) {
    console.error('Error updating garnishes:', error);
    res.status(500).json({ error: 'Failed to update garnishes' });
  }
});

// Add individual garnish endpoints
app.post('/api/omsk/garnishes', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { name, grams, calories, composition, isVegan, isVegetarian } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  try {
    const id = `garnish_${Date.now()}`;
    const stmt = omskDb.prepare('INSERT INTO garnishes (id, name, composition, grams, calories, isVegan, isVegetarian) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, composition || null, grams || 50, calories || 0, isVegan ? 1 : 0, isVegetarian ? 1 : 0);
    res.json({ id, name, composition, grams: grams || 50, calories: calories || 0, isVegan: isVegan || false, isVegetarian: isVegetarian || false, isActive: 1 });
  } catch (error) {
    console.error('Error adding garnish:', error);
    res.status(500).json({ error: 'Failed to add garnish' });
  }
});

app.patch('/api/omsk/garnishes/:id', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  const { isActive } = req.body;
  
  try {
    const stmt = omskDb.prepare('UPDATE garnishes SET isActive = ? WHERE id = ?');
    stmt.run(isActive ? 1 : 0, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating garnish:', error);
    res.status(500).json({ error: 'Failed to update garnish' });
  }
});

app.delete('/api/omsk/garnishes/:id', requireAdmin, (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  
  try {
    const result = deleteGarnish(id);
    console.log(`Deleted garnish ${id}, changes: ${result.changes}`);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Error deleting garnish:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to delete garnish', details: error.message });
  }
});

app.get('/api/omsk/sauces', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const items = getSauces();
    res.json(items);
  } catch (error) {
    console.error('Error fetching sauces:', error);
    res.status(500).json({ error: 'Failed to fetch sauces' });
  }
});

app.put('/api/omsk/sauces', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const items = req.body;
  try {
    const result = updateSauces(items);
    res.json(result);
  } catch (error) {
    console.error('Error updating sauces:', error);
    res.status(500).json({ error: 'Failed to update sauces' });
  }
});

// Add individual sauce endpoints
app.post('/api/omsk/sauces', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { name, grams, calories, composition, isVegan, isVegetarian } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  try {
    const id = `sauce_${Date.now()}`;
    const stmt = omskDb.prepare('INSERT INTO sauces (id, name, composition, grams, calories, isVegan, isVegetarian) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, composition || null, grams || 30, calories || 0, isVegan ? 1 : 0, isVegetarian ? 1 : 0);
    res.json({ id, name, composition, grams: grams || 30, calories: calories || 0, isVegan: isVegan || false, isVegetarian: isVegetarian || false, isActive: 1 });
  } catch (error) {
    console.error('Error adding sauce:', error);
    res.status(500).json({ error: 'Failed to add sauce' });
  }
});

app.patch('/api/omsk/sauces/:id', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  const { isActive } = req.body;
  
  try {
    const stmt = omskDb.prepare('UPDATE sauces SET isActive = ? WHERE id = ?');
    stmt.run(isActive ? 1 : 0, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating sauce:', error);
    res.status(500).json({ error: 'Failed to update sauce' });
  }
});

app.delete('/api/omsk/sauces/:id', requireAdmin, (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { id } = req.params;
  
  try {
    const result = deleteSauce(id);
    console.log(`Deleted sauce ${id}, changes: ${result.changes}`);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Error deleting sauce:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to delete sauce', details: error.message });
  }
});

// Excel import for garnishes and sauces
app.post('/api/omsk/import/garnishes-sauces', requireAdmin, express.raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '10mb' }), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }

  try {
    const buffer = req.body;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const result = { garnishes: [], sauces: [], errors: [] };

    // Parse garnishes sheet (Гарниры)
    const garnishesSheet = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('гарнир') || name.toLowerCase().includes('garnish')
    );
    
    if (garnishesSheet) {
      const garnishesData = XLSX.utils.sheet_to_json(workbook.Sheets[garnishesSheet]);
      const garnishes = garnishesData.map((row, index) => ({
        id: row.id || `garnish_imported_${Date.now()}_${index}`,
        name: row.name || row['Название'] || row['Наименование'] || '',
        composition: row.composition || row['Состав'] || '',
        grams: parseInt(row.grams || row['Вес'] || row['грамм'] || 50),
        calories: parseInt(row.calories || row['Калории'] || row['ккал'] || 0),
        isActive: row.isActive !== false && row['Активно'] !== 'нет' ? 1 : 0
      })).filter(g => g.name);

      if (garnishes.length > 0) {
        updateGarnishes(garnishes);
        result.garnishes = garnishes;
      }
    }

    // Parse sauces sheet (Соусы)
    const saucesSheet = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('соус') || name.toLowerCase().includes('sauce')
    );
    
    if (saucesSheet) {
      const saucesData = XLSX.utils.sheet_to_json(workbook.Sheets[saucesSheet]);
      const sauces = saucesData.map((row, index) => ({
        id: row.id || `sauce_imported_${Date.now()}_${index}`,
        name: row.name || row['Название'] || row['Наименование'] || '',
        composition: row.composition || row['Состав'] || '',
        grams: parseInt(row.grams || row['Вес'] || row['грамм'] || 30),
        calories: parseInt(row.calories || row['Калории'] || row['ккал'] || 0),
        isActive: row.isActive !== false && row['Активно'] !== 'нет' ? 1 : 0
      })).filter(s => s.name);

      if (sauces.length > 0) {
        updateSauces(sauces);
        result.sauces = sauces;
      }
    }

    if (result.garnishes.length === 0 && result.sauces.length === 0) {
      return res.status(400).json({ error: 'No valid data found. Expected sheets: "Гарниры" (Garnishes) and/or "Соусы" (Sauces)' });
    }

    res.json({ success: true, message: `Imported ${result.garnishes.length} garnishes and ${result.sauces.length} sauces`, ...result });
  } catch (error) {
    console.error('Error importing garnishes/sauces:', error);
    res.status(500).json({ error: 'Failed to import garnishes/sauces', details: String(error) });
  }
});

// Export garnishes and sauces to Excel template
app.get('/api/omsk/export/garnishes-sauces-template', requireAdmin, (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }

  try {
    const garnishes = getGarnishes();
    const sauces = getSauces();

    const workbook = XLSX.utils.book_new();

    // Create garnishes sheet
    const garnishesData = garnishes.map(g => ({
      id: g.id,
      name: g.name,
      composition: g.composition || '',
      grams: g.grams || 50,
      calories: g.calories || 0,
      isActive: g.isActive ? 'да' : 'нет'
    }));
    const garnishesSheet = XLSX.utils.json_to_sheet(garnishesData);
    garnishesSheet['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, garnishesSheet, 'Гарниры');

    // Create sauces sheet
    const saucesData = sauces.map(s => ({
      id: s.id,
      name: s.name,
      composition: s.composition || '',
      grams: s.grams || 30,
      calories: s.calories || 0,
      isActive: s.isActive ? 'да' : 'нет'
    }));
    const saucesSheet = XLSX.utils.json_to_sheet(saucesData);
    saucesSheet['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, saucesSheet, 'Соусы');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=garnishes_sauces_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting garnishes/sauces template:', error);
    res.status(500).json({ error: 'Failed to export template', details: String(error) });
  }
});

// Pastries API
app.get('/api/omsk/pastries', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  try {
    const items = getPastries();
    res.json(items);
  } catch (error) {
    console.error('Error fetching pastries:', error);
    res.status(500).json({ error: 'Failed to fetch pastries' });
  }
});

app.put('/api/omsk/pastries', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const items = req.body;
  try {
    const result = updatePastries(items);
    res.json(result);
  } catch (error) {
    console.error('Error updating pastries:', error);
    res.status(500).json({ error: 'Failed to update pastries' });
  }
});

app.get('/api/omsk/settings/:key', (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { key } = req.params;
  try {
    const value = getSetting(key);
    res.json({ key, value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

app.put('/api/omsk/settings/:key', requireAdmin, express.json(), (req, res) => {
  if (!omskDbReady) {
    return res.status(503).json({ error: 'Omsk database not available' });
  }
  const { key } = req.params;
  const { value } = req.body;
  try {
    const result = setSetting(key, value);
    res.json(result);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

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
