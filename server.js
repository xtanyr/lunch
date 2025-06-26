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

// Helper to read orders from file
function readOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to write orders to file
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Get all orders
app.get('/orders', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// Get orders for a specific date
app.get('/orders/:date', (req, res) => {
  const { date } = req.params;
  const orders = readOrders().filter(order => order.orderDate === date);
  res.json(orders);
});

// Add a new order
app.post('/orders', (req, res) => {
  const { employeeName, department, orderDate, items } = req.body;
  if (!employeeName || !department || !orderDate || !items) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const orders = readOrders();
  const newOrder = {
    id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    employeeName,
    department,
    orderDate,
    items,
    timestamp: new Date().toISOString(),
  };
  orders.push(newOrder);
  writeOrders(orders);
  res.status(201).json(newOrder);
});

// Delete an order by id
app.delete('/orders/:id', (req, res) => {
  const { id } = req.params;
  let orders = readOrders();
  const initialLength = orders.length;
  orders = orders.filter(order => order.id !== id);
  if (orders.length === initialLength) {
    return res.status(404).json({ error: 'Order not found' });
  }
  writeOrders(orders);
  res.status(204).end();
});

// Serve index.html for all non-API routes (for React Router support)
app.get(/^\/(?!orders).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 