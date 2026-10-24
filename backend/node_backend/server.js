const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;
const JWT_SECRET = process.env.JWT_SECRET || 'stockwise_super_secret_jwt_key_2026';
const DB_FILE = path.join(__dirname, 'stockwise_data.json');

app.use(cors());
app.use(express.json());

// Initial Seed Data
const initialData = {
  users: [
    {
      id: 1,
      name: 'Jordan Davis',
      email: 'jordan@acmecampus.edu',
      passwordHash: bcrypt.hashSync('password123', 10),
      role: 'Administrator'
    }
  ],
  products: [
    { id: 'PRD-001', name: 'Arduino Uno', sku: 'ARD-UNO-R3', category: 'Electronics', stock: 24, min: 12, price: 29.9, supplier: 'TechSource India', location: 'Lab A', barcode: '890100000001', brand: 'Arduino' },
    { id: 'PRD-002', name: 'Temperature Sensor', sku: 'SEN-TMP-01', category: 'Sensors', stock: 8, min: 15, price: 29.8, supplier: 'Circuit Hub', location: 'Lab A', barcode: '890100000002', expiry: '2027-02-14', brand: 'Circuit Hub' },
    { id: 'PRD-003', name: 'USB Cable', sku: 'CAB-USB-C-2M', category: 'Accessories', stock: 0, min: 20, price: 8.5, supplier: 'OfficeKart', location: 'Store Room', barcode: '890100000003', brand: 'OfficeKart' },
    { id: 'PRD-004', name: 'Wireless Mouse', sku: 'MOU-WLS-02', category: 'Peripherals', stock: 42, min: 10, price: 29.97, supplier: 'OfficeKart', location: 'Store Room', barcode: '890100000004', brand: 'Logitech' },
    { id: 'PRD-005', name: 'Mechanical Keyboard', sku: 'KEY-MECH-87', category: 'Peripherals', stock: 6, min: 8, price: 89.9, supplier: 'TechSource India', location: 'Store Room', barcode: '890100000005', brand: 'Keychron' }
  ],
  movements: [
    { id: 'MOV-104', product: 'Wireless Mouse', type: 'Stock out', qty: -12, date: 'Today, 10:42 AM', reason: 'Department Issue' },
    { id: 'MOV-103', product: 'Arduino Uno', type: 'Stock in', qty: 20, date: 'Today, 09:18 AM', reason: 'Purchase order' },
    { id: 'MOV-102', product: 'Temperature Sensor', type: 'Adjustment', qty: -4, date: 'Yesterday, 4:32 PM', reason: 'Cycle count' }
  ],
  suppliers: [
    { id: 'SUP-001', name: 'TechSource India', email: 'contact@techsource.demo', phone: '+91 98765 11111', leadTime: 7 },
    { id: 'SUP-002', name: 'Circuit Hub', email: 'orders@circuithub.demo', phone: '+91 98765 22222', leadTime: 10 },
    { id: 'SUP-003', name: 'OfficeKart', email: 'sales@officekart.demo', phone: '+91 98765 33333', leadTime: 5 }
  ],
  orders: [],
  transfers: [],
  categories: ['Electronics', 'Sensors', 'Accessories', 'Peripherals'],
  brands: ['Arduino', 'Circuit Hub', 'OfficeKart', 'Logitech', 'Keychron'],
  settings: { threshold: 10, expiry: 30, dark: false }
};

// Database Read/Write Helpers
function loadData() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    return initialData;
  }
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Routes

// 1. Health & Root
app.get('/', (req, res) => {
  res.json({ name: 'StockWise Node.js/Express Backend', status: 'online', port: PORT });
});

// 2. Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = loadData();
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ detail: 'Incorrect email or password.' });
  }
  const token = jwt.sign({ sub: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    access_token: token,
    token_type: 'bearer',
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  const db = loadData();
  if (db.users.some(u => u.email.toLowerCase() === (email || '').toLowerCase())) {
    return res.status(400).json({ detail: 'An account with this email already exists.' });
  }
  const newUser = {
    id: db.users.length + 1,
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'Administrator'
  };
  db.users.push(newUser);
  saveData(db);
  const token = jwt.sign({ sub: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    access_token: token,
    token_type: 'bearer',
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

// 3. Products
app.get('/api/products', (req, res) => {
  const db = loadData();
  const { search } = req.query;
  let items = db.products;
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(p => `${p.name} ${p.sku} ${p.category} ${p.supplier}`.toLowerCase().includes(s));
  }
  res.json(items);
});

app.post('/api/products', (req, res) => {
  const db = loadData();
  const body = req.body;
  if (!body.name || !body.sku) {
    return res.status(400).json({ detail: 'Name and SKU are required' });
  }
  if (db.products.some(p => p.sku.toLowerCase() === body.sku.toLowerCase())) {
    return res.status(400).json({ detail: 'SKU must be unique' });
  }
  const newProduct = {
    ...body,
    id: `PRD-${String(db.products.length + 1).padStart(3, '0')}`,
    stock: Number(body.stock) || 0,
    price: Number(body.price) || 0,
    min: Number(body.min) || 1
  };
  db.products.push(newProduct);
  saveData(db);
  res.status(201).json(newProduct);
});

app.post('/api/products/:id/adjust-stock', (req, res) => {
  const { id } = req.params;
  const { delta, type = 'Adjustment', reason = 'Manual adjustment' } = req.body;
  const db = loadData();
  const product = db.products.find(p => p.id === id);
  if (!product) return res.status(404).json({ detail: 'Product not found' });
  if (product.stock + delta < 0) return res.status(400).json({ detail: 'Stock out cannot exceed available stock' });

  product.stock += delta;
  db.movements.unshift({
    id: `MOV-${Date.now()}`,
    product: product.name,
    type,
    qty: delta,
    date: 'Just now',
    reason
  });
  saveData(db);
  res.json(product);
});

// 4. Inventory Movements & Transfers
app.get('/api/inventory/movements', (req, res) => {
  const db = loadData();
  res.json(db.movements);
});

app.get('/api/inventory/transfers', (req, res) => {
  const db = loadData();
  res.json(db.transfers || []);
});

app.post('/api/inventory/transfers', (req, res) => {
  const { product, from, to, quantity } = req.body;
  const db = loadData();
  const p = db.products.find(x => x.name === product || x.id === product);
  if (!p) return res.status(404).json({ detail: 'Product not found' });
  if (p.location !== from || p.stock < quantity) return res.status(400).json({ detail: 'Insufficient stock or invalid source' });

  p.location = to;
  const transfer = { id: `TR-${Date.now()}`, product: p.name, from_location: from, to_location: to, quantity };
  db.transfers = db.transfers || [];
  db.transfers.unshift(transfer);
  db.movements.unshift({ id: `MOV-${Date.now()}`, product: p.name, type: 'Transfer', qty: 0, date: 'Just now', reason: `Transfer ${from} to ${to}` });
  saveData(db);
  res.status(201).json(transfer);
});

// 5. Suppliers
app.get('/api/suppliers', (req, res) => {
  const db = loadData();
  res.json(db.suppliers);
});

app.post('/api/suppliers', (req, res) => {
  const { name, email, phone = '', leadTime = 7 } = req.body;
  const db = loadData();
  const supplier = { id: `SUP-${String(db.suppliers.length + 1).padStart(3, '0')}`, name, email, phone, leadTime };
  db.suppliers.push(supplier);
  saveData(db);
  res.status(201).json(supplier);
});

// 6. Purchase Orders
app.get('/api/orders', (req, res) => {
  const db = loadData();
  res.json(db.orders || []);
});

app.post('/api/orders', (req, res) => {
  const { supplier, lines } = req.body;
  const db = loadData();
  db.orders = db.orders || [];
  const order = {
    id: `PO-${String(db.orders.length + 1).padStart(3, '0')}`,
    supplier,
    status: 'Draft',
    received: false,
    lines: lines || []
  };
  db.orders.push(order);
  saveData(db);
  res.status(201).json(order);
});

app.post('/api/orders/:id/receive', (req, res) => {
  const { id } = req.params;
  const db = loadData();
  const order = (db.orders || []).find(o => o.id === id);
  if (!order) return res.status(404).json({ detail: 'Order not found' });
  if (order.received) return res.status(400).json({ detail: 'Order already received' });

  order.lines.forEach(line => {
    const p = db.products.find(x => x.id === line.productId);
    if (p) {
      p.stock += line.quantity;
      db.movements.unshift({
        id: `MOV-${Date.now()}`,
        product: p.name,
        type: 'Stock in',
        qty: line.quantity,
        date: 'Just now',
        reason: `Purchase order ${order.id} receiving`
      });
    }
  });
  order.status = 'Received';
  order.received = true;
  saveData(db);
  res.json(order);
});

// 7. Taxonomy (Categories & Brands)
app.get('/api/taxonomy/categories', (req, res) => {
  const db = loadData();
  res.json(db.categories);
});

app.post('/api/taxonomy/categories', (req, res) => {
  const { name } = req.body;
  const db = loadData();
  if (db.categories.includes(name)) return res.status(400).json({ detail: 'Category already exists' });
  db.categories.push(name);
  saveData(db);
  res.status(201).json(name);
});

app.get('/api/taxonomy/brands', (req, res) => {
  const db = loadData();
  res.json(db.brands);
});

app.post('/api/taxonomy/brands', (req, res) => {
  const { name } = req.body;
  const db = loadData();
  if (db.brands.includes(name)) return res.status(400).json({ detail: 'Brand already exists' });
  db.brands.push(name);
  saveData(db);
  res.status(201).json(name);
});

// 8. Analytics & Settings
app.get('/api/analytics/dashboard', (req, res) => {
  const db = loadData();
  const threshold = db.settings.threshold || 10;
  const total_products = db.products.length;
  const stock_units = db.products.reduce((acc, p) => acc + p.stock, 0);
  const inventory_value = db.products.reduce((acc, p) => acc + p.stock * p.price, 0);
  const low_stock_count = db.products.filter(p => p.stock <= threshold).length;
  const out_of_stock_count = db.products.filter(p => p.stock === 0).length;

  res.json({
    kpis: {
      total_products,
      stock_units,
      inventory_value: Math.round(inventory_value * 100) / 100,
      low_stock_count,
      out_of_stock_count
    },
    recent_movements: db.movements.slice(0, 5)
  });
});

app.get('/api/settings', (req, res) => {
  const db = loadData();
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  const db = loadData();
  db.settings = { ...db.settings, ...req.body };
  saveData(db);
  res.json(db.settings);
});

app.listen(PORT, () => {
  console.log(`StockWise Node.js Express server running on port ${PORT}`);
});
