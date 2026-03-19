import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'omsk.db');

const db = new Database(DB_PATH);

// Check and add isVegetarian column if it doesn't exist
try {
  db.prepare('SELECT isVegetarian FROM pastries LIMIT 1').get();
} catch (e) {
  console.log('Adding isVegetarian column to pastries...');
  db.prepare('ALTER TABLE pastries ADD COLUMN isVegetarian INTEGER DEFAULT 0').run();
}

// Delete all existing pastries
db.prepare('DELETE FROM pastries').run();

// Insert the new single pastry: Кутаб с картофелем и зеленью
const insertPastry = db.prepare('INSERT INTO pastries (id, name, isVegan, isVegetarian, isActive) VALUES (?, ?, ?, ?, ?)');
insertPastry.run('kutab_potato_greens', 'Кутаб с картофелем и зеленью', 1, 1, 1);

console.log('Pastry updated successfully!');
console.log('Now there is only 1 pastry: Кутаб с картофелем и зеленью');

db.close();
