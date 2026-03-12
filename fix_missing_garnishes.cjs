const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'omsk.db');
const db = new Database(dbPath);

// Add missing garnishes with their proper names
const garnishesToAdd = [
  ['garnish_1772756612735', 'Картофель отварной'],
  ['garnish_1772756692272', 'Гречка отварная'],
  ['garnish_1772756592745', 'Картофель печеный'],
  ['garnish_1772756630282', 'Рис припущенный c овощами'],
  ['garnish_1772756645593', 'Картофельное пюре'],
  ['garnish_1772756671708', 'Перлотта'],
  ['garnish_1772756684966', 'Без гарнира']
];

const saucesToAdd = [
  ['sauce_1772756542262', 'Ореховый'],
  ['sauce_1772756556844', '"Наш" майонез'],
  ['sauce_1772756568329', 'Томатный красный']
];

console.log('Adding missing garnishes...');
for (const [id, name] of garnishesToAdd) {
  const result = db.prepare('INSERT OR IGNORE INTO garnishes (id, name, isActive) VALUES (?, ?, 1)').run(id, name);
  if (result.changes > 0) {
    console.log('Added garnish:', id, '=', name);
  } else {
    // Try update if exists
    db.prepare('UPDATE garnishes SET name = ? WHERE id = ?').run(name, id);
    console.log('Updated garnish:', id, '=', name);
  }
}

console.log('Adding missing sauces...');
for (const [id, name] of saucesToAdd) {
  const result = db.prepare('INSERT OR IGNORE INTO sauces (id, name, isActive) VALUES (?, ?, 1)').run(id, name);
  if (result.changes > 0) {
    console.log('Added sauce:', id, '=', name);
  } else {
    // Try update if exists
    db.prepare('UPDATE sauces SET name = ? WHERE id = ?').run(name, id);
    console.log('Updated sauce:', id, '=', name);
  }
}

console.log('\nDone!');
db.close();
