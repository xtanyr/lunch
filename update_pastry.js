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

// Insert new pastries
const insertPastry = db.prepare('INSERT INTO pastries (id, name, isVegan, isVegetarian, isActive) VALUES (?, ?, ?, ?, ?)');

// Пирог с капустой, луком и яйцом ВЕГАН
insertPastry.run('pie_with_cabbage_onion_egg_vegan', 'Пирог с капустой, луком и яйцом ВЕГАН', 1, 1, 1);

// Пирог с луком и яйцом ВЕГЕТАРИАН
insertPastry.run('pie_with_onion_egg_vegetarian', 'Пирог с луком и яйцом ВЕГЕТАРИАН', 0, 1, 1);

// Пирог с рис-сайра
insertPastry.run('rice_pie', 'Пирог с рис-сайра', 0, 0, 1);

console.log('Pastry updated successfully!');
console.log('Now there are 3 pastries: Пирог с капустой, луком и яйцом ВЕГАН, Пирог с луком и яйцом ВЕГЕТАРИАН, Пирог с рис-сайра');

db.close();
