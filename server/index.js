// Simple local dev API server (Option B)
// Run: npm run server

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const app = express();
app.use(express.json());
// CORS: during dev, allow any local origin (echo back requester). Prevents
// common "Failed to fetch" when frontend runs on a different port/host.
app.use(cors({
  origin: (origin, cb) => cb(null, origin || true),
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-user-id']
}));

// Data files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const productsFile = path.join(dataDir, 'products.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8');
if (!fs.existsSync(productsFile)) fs.writeFileSync(productsFile, JSON.stringify([
  {
    _id: 'p1',
    title: 'Basmati Rice',
    pack: '1kg',
    price: 120,
    images: ['https://images.unsplash.com/photo-1604908554007-25f836d6b83b?w=640&q=80&auto=format&fit=crop']
  },
  {
    _id: 'p2',
    title: 'Groundnut Oil',
    pack: '1L',
    price: 180,
    images: ['https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=640&q=80&auto=format&fit=crop']
  },
  {
    _id: 'p3',
    title: 'Assorted Biscuits',
    pack: '500g',
    price: 95,
    images: ['https://images.unsplash.com/photo-1541592553160-82008b127ccb?w=640&q=80&auto=format&fit=crop']
  }
], null, 2), 'utf8');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function sign(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

// Routes base
const base = '/api';

// Health
app.get(base + '/health', (req, res) => res.json({ ok: true }));

// Auth: Register
app.post(base + '/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = readJson(usersFile);
  const existing = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name: name || '', email, passwordHash: hash, createdAt: new Date().toISOString() };
  users.push(user);
  writeJson(usersFile, users);
  // Return token+user for convenience
  const token = sign(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Auth: Login
app.post(base + '/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const users = readJson(usersFile);
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = sign(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Products
app.get(base + '/products', (req, res) => {
  const items = readJson(productsFile);
  res.json(items);
});

app.listen(PORT, () => {
  console.log(`Dev API listening on http://localhost:${PORT}`);
});
