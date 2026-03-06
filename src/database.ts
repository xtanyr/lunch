import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'omsk.db');

// Initialize database
let db: Database.Database;

export { db as omskDb };

export function initOmskDatabase() {
  try {
    db = new Database(DB_PATH);
    console.log('SQLite database connected:', DB_PATH);
    
    // Create tables
    db.exec(`
      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        employeeName TEXT NOT NULL,
        department TEXT,
        orderDate TEXT NOT NULL,
        items TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT DEFAULT 'omsk',
        timestamp TEXT NOT NULL,
        totalPrice REAL
      );

      -- Week-based menu items (5 weeks)
      CREATE TABLE IF NOT EXISTS week_menu_items (
        id TEXT PRIMARY KEY,
        weekNumber INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL DEFAULT 0,
        composition TEXT,
        protein REAL,
        carbs REAL,
        fats REAL,
        grams INTEGER DEFAULT 100,
        calories INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Vegan dishes (same across all weeks)
      CREATE TABLE IF NOT EXISTS vegan_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL DEFAULT 150,
        composition TEXT,
        protein REAL,
        carbs REAL,
        fats REAL,
        grams INTEGER DEFAULT 100,
        calories INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Other dishes (100 rubles)
      CREATE TABLE IF NOT EXISTS other_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL DEFAULT 100,
        composition TEXT,
        protein REAL,
        carbs REAL,
        fats REAL,
        grams INTEGER DEFAULT 100,
        calories INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Garnishes (free, for hot dish)
      CREATE TABLE IF NOT EXISTS garnishes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grams INTEGER DEFAULT 50,
        calories INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Sauces (free, for hot dish)
      CREATE TABLE IF NOT EXISTS sauces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grams INTEGER DEFAULT 30,
        calories INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Pastries (free, for soup/broth)
      CREATE TABLE IF NOT EXISTS pastries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        isVegan INTEGER DEFAULT 0,
        grams INTEGER DEFAULT 80,
        calories INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Week management
      CREATE TABLE IF NOT EXISTS weeks (
        weekNumber INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        isActive INTEGER DEFAULT 0
      );

      -- Order settings
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Check if we need to seed default data
    const weeksCount = db.prepare('SELECT COUNT(*) as count FROM weeks').get() as { count: number };
    
    if (weeksCount.count === 0) {
      seedDefaultData();
    }

    // Run migrations to add new columns
    migrateDatabase();

    console.log('Omsk database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
    throw error;
  }
}

function seedDefaultData() {
  // Seed weeks
  const insertWeek = db.prepare('INSERT INTO weeks (weekNumber, name, isActive) VALUES (?, ?, ?)');
  for (let i = 1; i <= 5; i++) {
    insertWeek.run(i, `Неделя ${i}`, i === 1 ? 1 : 0); // Week 1 is active by default
  }

  // Seed garnishes
  const defaultGarnishes = [
    { id: 'garnish_rice', name: 'Рис' },
    { id: 'garnish_grechka', name: 'Гречка' },
    { id: 'garnish_potatoes', name: 'Картофель' },
    { id: 'garnish_vegetables', name: 'Овощи' },
    { id: 'garnish_pasta', name: 'Паста' },
    { id: 'garnish_none', name: 'Без гарнира' },
  ];
  const insertGarnish = db.prepare('INSERT INTO garnishes (id, name) VALUES (?, ?)');
  for (const g of defaultGarnishes) {
    insertGarnish.run(g.id, g.name);
  }

  // Seed sauces
  const defaultSauces = [
    { id: 'sauce_tartar', name: 'Тартар' },
    { id: 'sauce_cheese', name: 'Сырный' },
    { id: 'sauce_bbq', name: 'BBQ' },
    { id: 'sauce_garlic', name: 'Чесночный' },
    { id: 'sauce_none', name: 'Без соуса' },
  ];
  const insertSauce = db.prepare('INSERT INTO sauces (id, name) VALUES (?, ?)');
  for (const s of defaultSauces) {
    insertSauce.run(s.id, s.name);
  }

  // Seed pastries
  const defaultPastries = [
    { id: 'pastry_cabbage', name: 'Пирог с капустой', isVegan: 1 },
    { id: 'pastry_egg_onion', name: 'Пирог с луком и яйцом', isVegan: 0 },
    { id: 'pastry_rice_sayra', name: 'Пирог с рис-сайра', isVegan: 0 },
  ];
  const insertPastry = db.prepare('INSERT INTO pastries (id, name, isVegan) VALUES (?, ?, ?)');
  for (const p of defaultPastries) {
    insertPastry.run(p.id, p.name, p.isVegan);
  }

  // Seed vegan items
  const defaultVeganItems = [
    { id: 'vegan_salad', name: 'Веганский салат', price: 150, composition: 'Овощи, зелень', protein: 5, carbs: 10, fats: 8 },
    { id: 'vegan_burger', name: 'Веганский бургер', price: 200, composition: 'Растительная котлета, овощи', protein: 15, carbs: 30, fats: 12 },
    { id: 'vegan_soup', name: 'Веганский суп', price: 150, composition: 'Овощи, крупа', protein: 8, carbs: 20, fats: 5 },
  ];
  const insertVegan = db.prepare('INSERT INTO vegan_items (id, name, price, composition, protein, carbs, fats, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const item of defaultVeganItems) {
    insertVegan.run(item.id, item.name, item.price, item.composition, item.protein, item.carbs, item.fats, 1);
  }

  // Seed default settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('max_order_price', '400');

  console.log('Default data seeded successfully');
}

// Migration: Add grams and calories columns to existing tables
export function migrateDatabase() {
  try {
    // Check and add grams/calories columns to garnishes
    try {
      db.prepare('SELECT grams FROM garnishes LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to garnishes table...');
      db.prepare('ALTER TABLE garnishes ADD COLUMN grams INTEGER DEFAULT 50').run();
      db.prepare('ALTER TABLE garnishes ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    // Check and add grams/calories columns to sauces
    try {
      db.prepare('SELECT grams FROM sauces LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to sauces table...');
      db.prepare('ALTER TABLE sauces ADD COLUMN grams INTEGER DEFAULT 30').run();
      db.prepare('ALTER TABLE sauces ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    // Check and add grams/calories columns to pastries
    try {
      db.prepare('SELECT grams FROM pastries LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to pastries table...');
      db.prepare('ALTER TABLE pastries ADD COLUMN grams INTEGER DEFAULT 80').run();
      db.prepare('ALTER TABLE pastries ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    // Check and add grams/calories columns to week_menu_items
    try {
      db.prepare('SELECT grams FROM week_menu_items LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to week_menu_items table...');
      db.prepare('ALTER TABLE week_menu_items ADD COLUMN grams INTEGER DEFAULT 100').run();
      db.prepare('ALTER TABLE week_menu_items ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    // Check and add grams/calories columns to vegan_items
    try {
      db.prepare('SELECT grams FROM vegan_items LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to vegan_items table...');
      db.prepare('ALTER TABLE vegan_items ADD COLUMN grams INTEGER DEFAULT 100').run();
      db.prepare('ALTER TABLE vegan_items ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    // Check and add grams/calories columns to other_items
    try {
      db.prepare('SELECT grams FROM other_items LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to other_items table...');
      db.prepare('ALTER TABLE other_items ADD COLUMN grams INTEGER DEFAULT 100').run();
      db.prepare('ALTER TABLE other_items ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
  }
}

// Week-based menu operations
export function getActiveWeek() {
  try {
    const stmt = db.prepare('SELECT * FROM weeks WHERE isActive = 1 LIMIT 1');
    return stmt.get();
  } catch (error) {
    console.error('Error getting active week:', error);
    return null;
  }
}

export function setActiveWeek(weekNumber: number) {
  const transaction = db.transaction(() => {
    db.prepare('UPDATE weeks SET isActive = 0').run();
    db.prepare('UPDATE weeks SET isActive = 1 WHERE weekNumber = ?').run(weekNumber);
  });
  transaction();
  return { success: true };
}

export function getAllWeeks() {
  try {
    const stmt = db.prepare('SELECT * FROM weeks ORDER BY weekNumber');
    return stmt.all();
  } catch (error) {
    console.error('Error getting all weeks:', error);
    return [];
  }
}

export function getWeekMenuItems(weekNumber: number) {
  try {
    const stmt = db.prepare('SELECT * FROM week_menu_items WHERE weekNumber = ? AND isActive = 1');
    return stmt.all(weekNumber);
  } catch (error) {
    console.error('Error getting week menu items:', error);
    return [];
  }
}

export function updateWeekMenuItems(weekNumber: number, items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM week_menu_items WHERE weekNumber = ?').run(weekNumber);
    const insertStmt = db.prepare(`
      INSERT INTO week_menu_items (id, weekNumber, name, category, price, composition, protein, carbs, fats, grams, calories, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertStmt.run(
        item.id, weekNumber, item.name, item.category, item.price || 0,
        item.composition || null, item.protein || null, item.carbs || null,
        item.fats || null, item.grams || null, item.calories || null,
        item.isActive !== false ? 1 : 0
      );
    }
  });
  transaction();
  return { success: true };
}

// Vegan items operations
export function getVeganItems() {
  const stmt = db.prepare('SELECT * FROM vegan_items WHERE isActive = 1');
  return stmt.all();
}

export function updateVeganItems(items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM vegan_items').run();
    const insertStmt = db.prepare(`
      INSERT INTO vegan_items (id, name, price, composition, protein, carbs, fats, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertStmt.run(
        item.id, item.name, item.price || 150, item.composition || null,
        item.protein || null, item.carbs || null, item.fats || null,
        item.isActive !== false ? 1 : 0
      );
    }
  });
  transaction();
  return { success: true };
}

export function insertVeganItem(item: { name: string; price: number; composition?: string; protein?: number; carbs?: number; fats?: number; grams?: number; calories?: number }) {
  const id = `vegan_${Date.now()}`;
  const stmt = db.prepare('INSERT INTO vegan_items (id, name, price, composition, protein, carbs, fats, grams, calories, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, item.name, item.price, item.composition || null, item.protein || null, item.carbs || null, item.fats || null, item.grams || null, item.calories || null, 1);
  return { id, ...item, isActive: 1 };
}

export function deleteVeganItem(id: string) {
  const stmt = db.prepare('DELETE FROM vegan_items WHERE id = ?');
  const result = stmt.run(id);
  return result;
}

// Other items operations
export function getOtherItems() {
  const stmt = db.prepare('SELECT * FROM other_items WHERE isActive = 1');
  return stmt.all();
}

export function updateOtherItems(items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM other_items').run();
    const insertStmt = db.prepare(`
      INSERT INTO other_items (id, name, price, composition, protein, carbs, fats, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertStmt.run(
        item.id, item.name, item.price || 100, item.composition || null,
        item.protein || null, item.carbs || null, item.fats || null,
        item.isActive !== false ? 1 : 0
      );
    }
  });
  transaction();
  return { success: true };
}

// Garnishes operations
export function getGarnishes() {
  const stmt = db.prepare('SELECT * FROM garnishes WHERE isActive = 1');
  return stmt.all();
}

export function updateGarnishes(items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM garnishes').run();
    const insertStmt = db.prepare('INSERT INTO garnishes (id, name, grams, calories, isActive) VALUES (?, ?, ?, ?, ?)');
    for (const item of items) {
      insertStmt.run(item.id, item.name, item.grams || 50, item.calories || 0, item.isActive !== false ? 1 : 0);
    }
  });
  transaction();
  return { success: true };
}

// Sauces operations
export function getSauces() {
  const stmt = db.prepare('SELECT * FROM sauces WHERE isActive = 1');
  return stmt.all();
}

export function updateSauces(items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM sauces').run();
    const insertStmt = db.prepare('INSERT INTO sauces (id, name, grams, calories, isActive) VALUES (?, ?, ?, ?, ?)');
    for (const item of items) {
      insertStmt.run(item.id, item.name, item.grams || 30, item.calories || 0, item.isActive !== false ? 1 : 0);
    }
  });
  transaction();
}

export function deleteGarnish(id: string) {
  const stmt = db.prepare('DELETE FROM garnishes WHERE id = ?');
  const result = stmt.run(id);
  return result;
}

export function deleteSauce(id: string) {
  const stmt = db.prepare('DELETE FROM sauces WHERE id = ?');
  const result = stmt.run(id);
  return result;
}

// Pastries operations
export function getPastries() {
  try {
    const stmt = db.prepare('SELECT * FROM pastries WHERE isActive = 1');
    return stmt.all();
  } catch (error) {
    console.error('Error getting pastries:', error);
    return [];
  }
}

export function updatePastries(items: any[]) {
  try {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM pastries').run();
      const insertStmt = db.prepare('INSERT INTO pastries (id, name, isVegan, isActive) VALUES (?, ?, ?, ?)');
      for (const item of items) {
        insertStmt.run(item.id, item.name, item.isVegan ? 1 : 0, item.isActive !== false ? 1 : 0);
      }
    });
    transaction();
    return { success: true };
  } catch (error) {
    console.error('Error updating pastries:', error);
    return { success: false, error: String(error) };
  }
}

// Settings operations
export function getSetting(key: string) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  return result?.value;
}

export function setSetting(key: string, value: string) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
  return { success: true };
}

// Order operations
export function getOrdersByDate(date: string, address: string) {
  try {
    let query = `SELECT * FROM orders WHERE orderDate = ?`;
    const params: string[] = [date];
    
    // Handle 'all' address to return orders from all addresses
    if (address && address !== 'all') {
      query += ` AND address = ?`;
      params.push(address);
    }
    
    query += ` ORDER BY timestamp DESC`;
    
    const stmt = db.prepare(query);
    return stmt.all(...params).map(parseOrderItems);
  } catch (error) {
    console.error('Error getting orders by date:', error);
    return [];
  }
}

export function getOrdersByDateRange(startDate: string, endDate: string, address: string) {
  try {
    console.log('getOrdersByDateRange called:', { startDate, endDate, address });
    let query = `SELECT * FROM orders WHERE orderDate >= ? AND orderDate <= ?`;
    const params: string[] = [startDate, endDate];
    
    if (address && address !== 'all') {
      query += ` AND address = ?`;
      params.push(address);
    }
    
    query += ` ORDER BY orderDate DESC, timestamp DESC`;
    
    console.log('Query:', query, 'Params:', params);
    
    const stmt = db.prepare(query);
    const results = stmt.all(...params);
    console.log('Results:', results.length);
    return results.map(parseOrderItems);
  } catch (error) {
    console.error('Error getting orders by date range:', error);
    return [];
  }
}

export function hasUserOrderedToday(employeeName: string, department: string, orderDate: string, address: string): boolean {
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM orders WHERE employeeName = ? AND department = ? AND orderDate = ? AND address = ?');
    const result = stmt.get(employeeName, department, orderDate, address) as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Error checking if user ordered today:', error);
    return false;
  }
}

export function createOrder(order: any) {
  try {
    console.log('Inserting order into database:', order);
    const stmt = db.prepare(`
      INSERT INTO orders (id, employeeName, department, orderDate, items, address, city, timestamp, totalPrice)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      order.id,
      order.employeeName,
      order.department || '',
      order.orderDate,
      JSON.stringify(order.items),
      order.address,
      order.city || 'omsk',
      order.timestamp,
      order.totalPrice || 0
    );
    console.log('Order inserted successfully:', order);
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export function deleteOrder(id: string) {
  try {
    const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
    return stmt.run(id);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

function parseOrderItems(order: any) {
  try {
    return {
      ...order,
      items: JSON.parse(order.items)
    };
  } catch (error) {
    console.error('Error parsing order items:', error);
    return { ...order, items: [] };
  }
}

// Legacy menu operations (for compatibility)
export function getMenuItems() {
  try {
    const week = getActiveWeek();
    if (week) {
      return getWeekMenuItems((week as any).weekNumber);
    }
    return [];
  } catch (error) {
    console.error('Error getting menu items:', error);
    return [];
  }
}

export function getMenuSides() {
  // Return garnishes as sides for compatibility
  try {
    return getGarnishes();
  } catch (error) {
    console.error('Error getting menu sides:', error);
    return [];
  }
}

export function getMenuConfig() {
  return { categories: [], lastUpdated: new Date().toISOString() };
}

export function updateMenuItems(items: any[]) {
  const week = getActiveWeek();
  if (week) {
    return updateWeekMenuItems((week as any).weekNumber, items);
  }
  return { success: false, error: 'No active week' };
}

export function updateMenuConfig(config: any) {
  // Not used in new system
  return { success: true };
}

export function getDisabledDates() {
  try {
    const stmt = db.prepare('SELECT * FROM settings WHERE key = ?');
    const result = stmt.get('disabled_dates') as { value: string } | undefined;
    if (!result?.value) return null;
    try {
      return JSON.parse(result.value);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Error getting disabled dates:', error);
    return null;
  }
}

export function setDisabledDates(range: any) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run('disabled_dates', JSON.stringify(range));
  return { success: true };
}

export function getDatabase() {
  return db;
}
