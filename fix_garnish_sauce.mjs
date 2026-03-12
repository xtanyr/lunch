// Run this on your server to fix old garnish/sauce IDs
// Usage: node fix_garnish_sauce.mjs

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'omsk.db');
const db = new Database(dbPath);

console.log('Scanning orders for garnish/sauce IDs...');

const orders = db.prepare('SELECT items FROM orders').all();
const garnishMap = {};
const sauceMap = {};

for (const order of orders) {
  try {
    const items = JSON.parse(order.items);
    for (const item of items) {
      // Check for garnish ID format (garnish_xxx)
      if (item.garnish && typeof item.garnish === 'string' && item.garnish.startsWith('garnish_')) {
        if (!garnishMap[item.garnish]) {
          garnishMap[item.garnish] = item.garnishName || 'Гарнир';
        }
      }
      // Check for sauce ID format (sauce_xxx)
      if (item.sauce && typeof item.sauce === 'string' && item.sauce.startsWith('sauce_')) {
        if (!sauceMap[item.sauce]) {
          sauceMap[item.sauce] = item.sauceName || 'Соус';
        }
      }
    }
  } catch(e) {
    console.log('Error parsing order:', e.message);
  }
}

console.log('\nFound garnish IDs:', garnishMap);
console.log('Found sauce IDs:', sauceMap);

// Insert missing garnishes
let garnishCount = 0;
for (const [id, name] of Object.entries(garnishMap)) {
  const result = db.prepare('INSERT OR IGNORE INTO garnishes (id, name, isActive) VALUES (?, ?, 1)').run(id, name);
  if (result.changes > 0) {
    console.log(`Added garnish: ${id} = ${name}`);
    garnishCount++;
  }
}

// Insert missing sauces
let sauceCount = 0;
for (const [id, name] of Object.entries(sauceMap)) {
  const result = db.prepare('INSERT OR IGNORE INTO sauces (id, name, isActive) VALUES (?, ?, 1)').run(id, name);
  if (result.changes > 0) {
    console.log(`Added sauce: ${id} = ${name}`);
    sauceCount++;
  }
}

console.log(`\nDone! Added ${garnishCount} garnishes and ${sauceCount} sauces`);
db.close();
