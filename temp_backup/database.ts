import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'omsk.db');

// Initialize database
let db: Database.Database;

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
        isActive INTEGER DEFAULT 1
      );

      -- Garnishes (free, for hot dish)
      CREATE TABLE IF NOT EXISTS garnishes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        isActive INTEGER DEFAULT 1
      );

      -- Sauces (free, for hot dish)
      CREATE TABLE IF NOT EXISTS sauces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
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

  // Seed default settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('max_order_price', '400');

  console.log('Default data seeded successfully');
}

// Week-based menu operations
export function getActiveWeek() {
  const stmt = db.prepare('SELECT * FROM weeks WHERE isActive = 1 LIMIT 1');
  return stmt.get();
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
  const stmt = db.prepare('SELECT * FROM weeks ORDER BY weekNumber');
  return stmt.all();
}

export function getWeekMenuItems(weekNumber: number) {
  const stmt = db.prepare('SELECT * FROM week_menu_items WHERE weekNumber = ? AND isActive = 1');
  return stmt.all(weekNumber);
}

export function updateWeekMenuItems(weekNumber: number, items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM week_menu_items WHERE weekNumber = ?').run(weekNumber);
    const insertStmt = db.prepare(`
      INSERT INTO week_menu_items (id, weekNumber, name, category, price, composition, protein, carbs, fats, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertStmt.run(
        item.id, weekNumber, item.name, item.category, item.price || 0,
        item.composition || null, item.protein || null, item.carbs || null,
        item.fats || null, item.isActive !== false ? 1 : 0
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
    const insertStmt = db.prepare('INSERT INTO garnishes (id, name, isActive) VALUES (?, ?, ?)');
    for (const item of items) {
      insertStmt.run(item.id, item.name, item.isActive !== false ? 1 : 0);
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
    const insertStmt = db.prepare('INSERT INTO sauces (id, name, isActive) VALUES (?, ?, ?)');
    for (const item of items) {
      insertStmt.run(item.id, item.name, item.isActive !== false ? 1 : 0);
    }
  });
  transaction();
  return { success: true };
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
  const stmt = db.prepare(`
    SELECT * FROM orders 
    WHERE orderDate = ? AND address = ?
    ORDER BY timestamp DESC
  `);
  return stmt.all(date, address).map(parseOrderItems);
}

export function createOrder(order: any) {
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
  return order;
}

export function deleteOrder(id: string) {
  const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
  return stmt.run(id);
}

function parseOrderItems(order: any) {
  return {
    ...order,
    items: JSON.parse(order.items)
  };
}

// Legacy menu operations (for compatibility)
export function getMenuItems() {
  const week = getActiveWeek();
  if (week) {
    return getWeekMenuItems((week as any).weekNumber);
  }
  return [];
}

export function getMenuSides() {
  // Return garnishes as sides for compatibility
  return getGarnishes();
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
  return null;
}

export function setDisabledDates(range: any) {
  return { success: true };
}

export function getDatabase() {
  return db;
}
