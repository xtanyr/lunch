const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'omsk.db');
const db = new Database(dbPath);

const garnishes = {
  'garnish_1772756612735': 'Картофель отварной',
  'garnish_1772756692272': 'Гречка отварная',
  'garnish_1772756592745': 'Картофель печеный',
  'garnish_1772756630282': 'Рис припущенный c овощами',
  'garnish_1772756645593': 'Картофельное пюре',
  'garnish_1772756671708': 'Перлотта',
  'garnish_1772756684966': 'Без гарнира'
};

const sauces = {
  'sauce_1772756542262': 'Ореховый',
  'sauce_1772756556844': '"Наш" майонез',
  'sauce_1772756568329': 'Томатный красный'
};

for (const [id, name] of Object.entries(garnishes)) {
  db.prepare('UPDATE garnishes SET name = ? WHERE id = ?').run(name, id);
  console.log('Updated garnish:', id, '->', name);
}

for (const [id, name] of Object.entries(sauces)) {
  db.prepare('UPDATE sauces SET name = ? WHERE id = ?').run(name, id);
  console.log('Updated sauce:', id, '->', name);
}

console.log('Done!');
db.close();
