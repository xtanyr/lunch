import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/m7', express.static(path.join(__dirname, 'm7')));

// Получить путь к файлу заказов по адресу
function getOrdersFileByAddress(address) {
  if (!address || address === 'office') return ORDERS_FILE;
  const safe = address.toLowerCase().replace(/[^a-zа-я0-9]/gi, '_');
  return path.join(__dirname, `orders_${safe}.json`);
}

// Helper to read orders from file по адресу
function readOrders(address) {
  const file = getOrdersFileByAddress(address);
  if (!fs.existsSync(file)) return [];
  const data = fs.readFileSync(file, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}
// Helper to write orders to file по адресу
function writeOrders(orders, address) {
  const file = getOrdersFileByAddress(address);
  fs.writeFileSync(file, JSON.stringify(orders, null, 2));
}

// Get all orders for a date and address
app.get('/orders/:date', (req, res) => {
  const { address } = req.query;
  const { date } = req.params;
  const orders = readOrders(address).filter(o => o.orderDate === date);
  res.json(orders);
});

// Add a new order (address required)
app.post('/orders', express.json(), (req, res) => {
  const { employeeName, department, orderDate, items, address } = req.body;
  if (!employeeName || !orderDate || !items || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const orders = readOrders(address);
  const newOrder = {
    id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    employeeName,
    department: department || '',
    orderDate,
    items,
    address,
    timestamp: new Date().toISOString(),
  };
  orders.push(newOrder);
  writeOrders(orders, address);
  res.status(201).json(newOrder);
});

// Delete an order by id
app.delete('/orders/:id', (req, res) => {
  const { id } = req.params;
  const { address } = req.query;
  let orders = readOrders(address);
  const initialLength = orders.length;
  orders = orders.filter(order => order.id !== id);
  if (orders.length === initialLength) {
    return res.status(404).json({ error: 'Order not found' });
  }
  writeOrders(orders, address);
  res.status(204).end();
});

// Serve index.html for all non-API routes (for React Router support)
app.get(/^\/(?!orders).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 