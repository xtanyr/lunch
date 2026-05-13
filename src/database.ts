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
        isVegan INTEGER DEFAULT 0,
        isVegetarian INTEGER DEFAULT 0,
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
        isVegan INTEGER DEFAULT 0,
        isVegetarian INTEGER DEFAULT 0,
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
        isVegan INTEGER DEFAULT 0,
        isVegetarian INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Garnishes (free, for hot dish)
      CREATE TABLE IF NOT EXISTS garnishes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        composition TEXT,
        grams INTEGER DEFAULT 50,
        calories INTEGER DEFAULT 0,
        protein REAL DEFAULT 0,
        carbs REAL DEFAULT 0,
        fats REAL DEFAULT 0,
        isVegan INTEGER DEFAULT 0,
        isVegetarian INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Sauces (free, for hot dish)
      CREATE TABLE IF NOT EXISTS sauces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        composition TEXT,
        grams INTEGER DEFAULT 30,
        calories INTEGER DEFAULT 0,
        protein REAL DEFAULT 0,
        carbs REAL DEFAULT 0,
        fats REAL DEFAULT 0,
        isVegan INTEGER DEFAULT 0,
        isVegetarian INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );

      -- Pastries (free, for soup/broth)
      CREATE TABLE IF NOT EXISTS pastries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        isVegan INTEGER DEFAULT 0,
        isVegetarian INTEGER DEFAULT 0,
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

    // Migration: Add isVegan and isVegetarian columns if they don't exist
    try {
      db.exec(`ALTER TABLE week_menu_items ADD COLUMN isVegan INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE week_menu_items ADD COLUMN isVegetarian INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE vegan_items ADD COLUMN isVegan INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE vegan_items ADD COLUMN isVegetarian INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE other_items ADD COLUMN isVegan INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE other_items ADD COLUMN isVegetarian INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE garnishes ADD COLUMN isVegan INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE garnishes ADD COLUMN isVegetarian INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE sauces ADD COLUMN isVegan INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE sauces ADD COLUMN isVegetarian INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE pastries ADD COLUMN isVegetarian INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE week_menu_items ADD COLUMN noGarnish INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE vegan_items ADD COLUMN noGarnish INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE other_items ADD COLUMN noGarnish INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE garnishes ADD COLUMN protein REAL DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE garnishes ADD COLUMN carbs REAL DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE garnishes ADD COLUMN fats REAL DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE sauces ADD COLUMN protein REAL DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE sauces ADD COLUMN carbs REAL DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }
    try {
      db.exec(`ALTER TABLE sauces ADD COLUMN fats REAL DEFAULT 0`);
    } catch (e) {
      // Column already exists
    }

    // Create order_logs table if not exists
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS order_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          orderId TEXT NOT NULL,
          action TEXT NOT NULL,
          employeeName TEXT,
          department TEXT,
          details TEXT,
          performedBy TEXT,
          timestamp TEXT NOT NULL
        )
      `);
    } catch (e) {
      // Table might already exist
    }
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_order_logs_timestamp ON order_logs(timestamp)`);
    } catch (e) {
      // Index might already exist
    }

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

// Migration: Add old garnish/sauce IDs from orders to the database
// This fixes old orders that stored garnish/sauce IDs that don't exist in the database
function migrateOldGarnishSauceIds() {
  try {
    // Check if we've already run this migration
    const migrationCheck = db.prepare('SELECT value FROM settings WHERE key = ?').get('migration_garnish_sauce_ids') as { value: string } | undefined;
    if (migrationCheck) {
      console.log('Old garnish/sauce IDs migration already completed');
      return;
    }

    console.log('Running migration for old garnish/sauce IDs...');

    // Get all existing garnishes and sauces
    const existingGarnishes = db.prepare('SELECT id, name FROM garnishes').all() as { id: string; name: string }[];
    const existingSauces = db.prepare('SELECT id, name FROM sauces').all() as { id: string; name: string }[];

    const garnishIds = new Set(existingGarnishes.map(g => g.id));
    const garnishNames = new Set(existingGarnishes.map(g => g.name.toLowerCase()));
    const sauceIds = new Set(existingSauces.map(s => s.id));
    const sauceNames = new Set(existingSauces.map(s => s.name.toLowerCase()));

    // Get all orders
    const orders = db.prepare('SELECT id, items FROM orders').all() as { id: string; items: string }[];

    const newGarnishes: { id: string; name: string }[] = [];
    const newSauces: { id: string; name: string }[] = [];

    // Scan each order for garnish/sauce IDs and names
    for (const order of orders) {
      try {
        const items = JSON.parse(order.items);
        if (!Array.isArray(items)) continue;

        for (const item of items) {
          // Check for garnish - can be ID (new format) or name (old format)
          if (item.garnish) {
            const garnishValue = item.garnish;
            
            // New format: ID like "garnish_xxx"
            if (typeof garnishValue === 'string' && garnishValue.startsWith('garnish_')) {
              if (!garnishIds.has(garnishValue)) {
                // Check if we already found this garnish
                if (!newGarnishes.find(g => g.id === garnishValue)) {
                  const name = item.garnishName || 'Гарнир';
                  newGarnishes.push({ id: garnishValue, name });
                  garnishIds.add(garnishValue);
                }
              }
            }
            // Old format: plain name like "Рис" or "Гречка"
            else if (typeof garnishValue === 'string' && !garnishNames.has(garnishValue.toLowerCase())) {
              if (!newGarnishes.find(g => g.name.toLowerCase() === garnishValue.toLowerCase())) {
                // Create an ID for this old name format
                const id = `garnish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                newGarnishes.push({ id, name: garnishValue });
                garnishNames.add(garnishValue.toLowerCase());
              }
            }
          }

          // Check for sauce - can be ID (new format) or name (old format)
          if (item.sauce) {
            const sauceValue = item.sauce;
            
            // New format: ID like "sauce_xxx"
            if (typeof sauceValue === 'string' && sauceValue.startsWith('sauce_')) {
              if (!sauceIds.has(sauceValue)) {
                // Check if we already found this sauce
                if (!newSauces.find(s => s.id === sauceValue)) {
                  const name = item.sauceName || 'Соус';
                  newSauces.push({ id: sauceValue, name });
                  sauceIds.add(sauceValue);
                }
              }
            }
            // Old format: plain name like "Тартар" or "Сырный"
            else if (typeof sauceValue === 'string' && !sauceNames.has(sauceValue.toLowerCase())) {
              if (!newSauces.find(s => s.name.toLowerCase() === sauceValue.toLowerCase())) {
                // Create an ID for this old name format
                const id = `sauce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                newSauces.push({ id, name: sauceValue });
                sauceNames.add(sauceValue.toLowerCase());
              }
            }
          }
        }
      } catch (e) {
        // Skip orders with invalid JSON
        console.warn('Skipping order with invalid items JSON:', order.id);
      }
    }

    // Insert new garnishes
    if (newGarnishes.length > 0) {
      console.log(`Adding ${newGarnishes.length} old garnish entries to database...`);
      const insertGarnish = db.prepare('INSERT OR IGNORE INTO garnishes (id, name, isActive) VALUES (?, ?, 1)');
      for (const g of newGarnishes) {
        insertGarnish.run(g.id, g.name);
      }
    }

    // Insert new sauces
    if (newSauces.length > 0) {
      console.log(`Adding ${newSauces.length} old sauce entries to database...`);
      const insertSauce = db.prepare('INSERT OR IGNORE INTO sauces (id, name, isActive) VALUES (?, ?, 1)');
      for (const s of newSauces) {
        insertSauce.run(s.id, s.name);
      }
    }

    // Mark migration as complete
    if (newGarnishes.length > 0 || newSauces.length > 0) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('migration_garnish_sauce_ids', new Date().toISOString());
      console.log('Old garnish/sauce migration completed:', newGarnishes.length, 'garnishes,', newSauces.length, 'sauces');
    } else {
      console.log('No old garnish/sauce entries found');
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('migration_garnish_sauce_ids', new Date().toISOString());
    }
  } catch (error) {
    console.error('Error migrating old garnish/sauce IDs:', error);
  }
}

// Migration: Add grams and calories columns to existing tables
export function migrateDatabase() {
  try {
    // Run migration for old garnish/sauce IDs from orders
    migrateOldGarnishSauceIds();

    // Check and add grams/calories columns to garnishes
    try {
      db.prepare('SELECT grams FROM garnishes LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to garnishes table...');
      db.prepare('ALTER TABLE garnishes ADD COLUMN grams INTEGER DEFAULT 50').run();
      db.prepare('ALTER TABLE garnishes ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    // Check and add composition column to garnishes
    try {
      db.prepare('SELECT composition FROM garnishes LIMIT 1').get();
    } catch (error) {
      console.log('Adding composition column to garnishes table...');
      db.prepare('ALTER TABLE garnishes ADD COLUMN composition TEXT').run();
    }

    // Check and add protein/carbs/fats columns to garnishes
    try {
      db.prepare('SELECT protein FROM garnishes LIMIT 1').get();
    } catch (error) {
      console.log('Adding protein, carbs, fats columns to garnishes table...');
      db.prepare('ALTER TABLE garnishes ADD COLUMN protein INTEGER DEFAULT 0').run();
      db.prepare('ALTER TABLE garnishes ADD COLUMN carbs INTEGER DEFAULT 0').run();
      db.prepare('ALTER TABLE garnishes ADD COLUMN fats INTEGER DEFAULT 0').run();
    }

    // Check and add grams/calories columns to sauces
    try {
      db.prepare('SELECT grams FROM sauces LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to sauces table...');
      db.prepare('ALTER TABLE sauces ADD COLUMN grams INTEGER DEFAULT 30').run();
      db.prepare('ALTER TABLE sauces ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    // Check and add composition column to sauces
    try {
      db.prepare('SELECT composition FROM sauces LIMIT 1').get();
    } catch (error) {
      console.log('Adding composition column to sauces table...');
      db.prepare('ALTER TABLE sauces ADD COLUMN composition TEXT').run();
    }

    // Check and add grams/calories columns to pastries
    try {
      db.prepare('SELECT grams FROM pastries LIMIT 1').get();
    } catch (error) {
      console.log('Adding grams and calories columns to pastries table...');
      db.prepare('ALTER TABLE pastries ADD COLUMN grams INTEGER DEFAULT 80').run();
      db.prepare('ALTER TABLE pastries ADD COLUMN calories INTEGER DEFAULT 0').run();
    }

    // Check and add composition/protein/carbs/fats columns to pastries
    try {
      db.prepare('SELECT composition FROM pastries LIMIT 1').get();
    } catch (error) {
      console.log('Adding composition, protein, carbs, and fats columns to pastries table...');
      db.prepare('ALTER TABLE pastries ADD COLUMN composition TEXT').run();
      db.prepare('ALTER TABLE pastries ADD COLUMN protein REAL DEFAULT 0').run();
      db.prepare('ALTER TABLE pastries ADD COLUMN carbs REAL DEFAULT 0').run();
      db.prepare('ALTER TABLE pastries ADD COLUMN fats REAL DEFAULT 0').run();
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

    // Check and add totalPrice column to orders
    try {
      db.prepare('SELECT totalPrice FROM orders LIMIT 1').get();
    } catch (error) {
      console.log('Adding totalPrice column to orders table...');
      db.prepare('ALTER TABLE orders ADD COLUMN totalPrice REAL DEFAULT 0').run();
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

// Admin version - returns ALL items including hidden ones
export function getWeekMenuItemsAdmin(weekNumber: number) {
  try {
    const stmt = db.prepare('SELECT * FROM week_menu_items WHERE weekNumber = ?');
    return stmt.all(weekNumber);
  } catch (error) {
    console.error('Error getting week menu items (admin):', error);
    return [];
  }
}

export function updateWeekMenuItems(weekNumber: number, items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM week_menu_items WHERE weekNumber = ?').run(weekNumber);
    const insertStmt = db.prepare(`
      INSERT INTO week_menu_items (id, weekNumber, name, category, price, composition, protein, carbs, fats, grams, calories, isVegan, isVegetarian, isActive, noGarnish)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertStmt.run(
        item.id, weekNumber, item.name, item.category, item.price || 0,
        item.composition || null, item.protein || null, item.carbs || null,
        item.fats || null, item.grams || null, item.calories || null,
        item.isVegan ? 1 : 0, item.isVegetarian ? 1 : 0,
        item.isActive !== false ? 1 : 0,
        item.noGarnish ? 1 : 0
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

// Admin version - returns ALL items including hidden ones
export function getVeganItemsAdmin() {
  const stmt = db.prepare('SELECT * FROM vegan_items');
  return stmt.all();
}

export function updateVeganItems(items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM vegan_items').run();
    const insertStmt = db.prepare(`
      INSERT INTO vegan_items (id, name, price, composition, protein, carbs, fats, grams, calories, isVegan, isVegetarian, isActive, noGarnish)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertStmt.run(
        item.id, item.name, item.price || 150, item.composition || null,
        item.protein || null, item.carbs || null, item.fats || null,
        item.grams || null, item.calories || null,
        item.isVegan ? 1 : 0, item.isVegetarian ? 1 : 0,
        item.isActive !== false ? 1 : 0,
        item.noGarnish ? 1 : 0
      );
    }
  });
  transaction();
  return { success: true };
}

export function insertVeganItem(item: { name: string; price: number; composition?: string; protein?: number; carbs?: number; fats?: number; grams?: number; calories?: number; isVegan?: boolean; isVegetarian?: boolean; noGarnish?: boolean }) {
  const id = `vegan_${Date.now()}`;
  const stmt = db.prepare('INSERT INTO vegan_items (id, name, price, composition, protein, carbs, fats, grams, calories, isVegan, isVegetarian, isActive, noGarnish) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, item.name, item.price, item.composition || null, item.protein || null, item.carbs || null, item.fats || null, item.grams || null, item.calories || null, item.isVegan ? 1 : 0, item.isVegetarian ? 1 : 0, 1, item.noGarnish ? 1 : 0);
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

// Admin version - returns ALL items including hidden ones
export function getOtherItemsAdmin() {
  const stmt = db.prepare('SELECT * FROM other_items');
  return stmt.all();
}

export function updateOtherItems(items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM other_items').run();
    const insertStmt = db.prepare(`
      INSERT INTO other_items (id, name, price, composition, protein, carbs, fats, grams, calories, isVegan, isVegetarian, isActive, noGarnish)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      insertStmt.run(
        item.id, item.name, item.price || 100, item.composition || null,
        item.protein || null, item.carbs || null, item.fats || null,
        item.grams || null, item.calories || null,
        item.isVegan ? 1 : 0, item.isVegetarian ? 1 : 0,
        item.isActive !== false ? 1 : 0,
        item.noGarnish ? 1 : 0
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

// Admin version - returns ALL items including hidden ones
export function getGarnishesAdmin() {
  const stmt = db.prepare('SELECT * FROM garnishes');
  return stmt.all();
}

export function updateGarnishes(items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM garnishes').run();
    const insertStmt = db.prepare('INSERT INTO garnishes (id, name, composition, grams, calories, protein, carbs, fats, isVegan, isVegetarian, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const item of items) {
      insertStmt.run(
        item.id, item.name, item.composition || null, item.grams || 50, item.calories || 0,
        item.protein || 0, item.carbs || 0, item.fats || 0,
        item.isVegan ? 1 : 0, item.isVegetarian ? 1 : 0, item.isActive !== false ? 1 : 0
      );
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

// Admin version - returns ALL items including hidden ones
export function getSaucesAdmin() {
  const stmt = db.prepare('SELECT * FROM sauces');
  return stmt.all();
}

export function updateSauces(items: any[]) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM sauces').run();
    const insertStmt = db.prepare('INSERT INTO sauces (id, name, composition, grams, calories, protein, carbs, fats, isVegan, isVegetarian, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const item of items) {
      insertStmt.run(
        item.id, item.name, item.composition || null, item.grams || 30, item.calories || 0,
        item.protein || 0, item.carbs || 0, item.fats || 0,
        item.isVegan ? 1 : 0, item.isVegetarian ? 1 : 0, item.isActive !== false ? 1 : 0
      );
    }
  });
  transaction();
  return { success: true };
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

// Admin version - returns ALL items including hidden ones
export function getPastriesAdmin() {
  try {
    const stmt = db.prepare('SELECT * FROM pastries');
    return stmt.all();
  } catch (error) {
    console.error('Error getting pastries (admin):', error);
    return [];
  }
}

export function updatePastries(items: any[]) {
  try {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM pastries').run();
      const insertStmt = db.prepare('INSERT INTO pastries (id, name, isVegan, isVegetarian, isActive) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) {
        insertStmt.run(item.id, item.name, item.isVegan ? 1 : 0, item.isVegetarian ? 1 : 0, item.isActive !== false ? 1 : 0);
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
      // Handle 'office' address to include both floor 10 and 14 orders (office_10, office_14)
      if (address === 'office') {
        query += ` AND (address = ? OR address LIKE ?)`;
        params.push('office');
        params.push('office_%');
      } else {
        query += ` AND address = ?`;
        params.push(address);
      }
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
      // Handle 'office' address to include both floor 10 and 14 orders (office_10, office_14)
      if (address === 'office') {
        query += ` AND (address = ? OR address LIKE ?)`;
        params.push('office');
        params.push('office_%');
      } else {
        query += ` AND address = ?`;
        params.push(address);
      }
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
    let query = 'SELECT COUNT(*) as count FROM orders WHERE employeeName = ? AND department = ? AND orderDate = ?';
    const params: string[] = [employeeName, department, orderDate];
    
    // Handle 'office' address to include both floor 10 and 14 orders
    if (address && address === 'office') {
      query += ' AND (address = ? OR address LIKE ?)';
      params.push('office');
      params.push('office_%');
    } else if (address) {
      query += ' AND address = ?';
      params.push(address);
    }
    
    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
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

// Admin version - returns ALL items including hidden ones
export function getMenuItemsAdmin() {
  try {
    const week = getActiveWeek();
    if (week) {
      return getWeekMenuItemsAdmin((week as any).weekNumber);
    }
    return [];
  } catch (error) {
    console.error('Error getting menu items (admin):', error);
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
  try {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get('menu_config') as { value: string } | undefined;
    if (result?.value) {
      return JSON.parse(result.value);
    }
    return { categories: [], lastUpdated: new Date().toISOString() };
  } catch (error) {
    console.error('Error getting menu config:', error);
    return { categories: [], lastUpdated: new Date().toISOString() };
  }
}

export function updateMenuConfig(config: { categories: any[]; lastUpdated: string }) {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('menu_config', JSON.stringify(config));
    return { success: true };
  } catch (error) {
    console.error('Error updating menu config:', error);
    throw error;
  }
}

export function updateMenuItems(items: any[]) {
  const week = getActiveWeek();
  if (week) {
    return updateWeekMenuItems((week as any).weekNumber, items);
  }
  return { success: false, error: 'No active week' };
}

export function getDisabledDates() {
  try {
    const stmt = db.prepare('SELECT * FROM settings WHERE key = ?');
    const result = stmt.get('disabled_dates') as { value: string } | undefined;
    if (!result?.value) return [];
    try {
      const parsed = JSON.parse(result.value);
      // Handle backward compatibility - if it's a single object, convert to array
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return [parsed];
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Error getting disabled dates:', error);
    return [];
  }
}

export function setDisabledDates(ranges: any[]) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run('disabled_dates', JSON.stringify(ranges));
  return { success: true };
}

export function addDisabledDateRange(range: any) {
  try {
    const currentRanges = getDisabledDates();
    const newRange = {
      id: Date.now().toString(), // Add unique ID
      startDate: range.startDate,
      endDate: range.endDate,
      message: range.message || ''
    };
    currentRanges.push(newRange);
    return setDisabledDates(currentRanges);
  } catch (error) {
    console.error('Error adding disabled date range:', error);
    return { success: false, error: String(error) };
  }
}

export function removeDisabledDateRange(id: string) {
  try {
    const currentRanges = getDisabledDates();
    const filteredRanges = currentRanges.filter((range: any) => range.id !== id);
    return setDisabledDates(filteredRanges);
  } catch (error) {
    console.error('Error removing disabled date range:', error);
    return { success: false, error: String(error) };
  }
}

export function updateDisabledDateRange(id: string, updatedRange: any) {
  try {
    const currentRanges = getDisabledDates();
    const index = currentRanges.findIndex((range: any) => range.id === id);
    if (index === -1) {
      return { success: false, error: 'Range not found' };
    }
    currentRanges[index] = { ...currentRanges[index], ...updatedRange };
    return setDisabledDates(currentRanges);
  } catch (error) {
    console.error('Error updating disabled date range:', error);
    return { success: false, error: String(error) };
  }
}

export function getDatabase() {
  return db;
}

// Order activity logs
export function addOrderLog(orderId: string, action: string, employeeName?: string, department?: string, details?: string, ipAddress?: string) {
  try {
    const stmt = db.prepare('INSERT INTO order_logs (orderId, action, employeeName, department, details, performedBy, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(orderId, action, employeeName || null, department || null, details || null, ipAddress || null, new Date().toISOString());
    return { success: true };
  } catch (error) {
    console.error('Error adding order log:', error);
    return { success: false, error: String(error) };
  }
}

export function getOrderLogs(limit: number = 100) {
  try {
    const stmt = db.prepare('SELECT * FROM order_logs ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit);
  } catch (error) {
    console.error('Error getting order logs:', error);
    return [];
  }
}

export function getOrderLogsByDate(startDate: string, endDate: string) {
  try {
    const stmt = db.prepare('SELECT * FROM order_logs WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC');
    return stmt.all(startDate, endDate + 'T23:59:59');
  } catch (error) {
    console.error('Error getting order logs by date:', error);
    return [];
  }
}
