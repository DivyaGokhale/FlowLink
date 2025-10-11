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
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Resolve root .env even when starting from server/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
if (!process.env.MONGO_URI) {
  const rootEnvPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }
}

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'HS9Yf7yCJ3Zc6MSIFDa3oOlN1Wl1';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://FlowLink:FlowLink8550@flowlink.wlohsvp.mongodb.net/?retryWrites=true&w=majority&appName=FlowLink';
// Use the same default DB name as the admin server for local dev parity
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'flowlink';

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

// Mongoose models
const userSchema = new mongoose.Schema({
  id: { type: String, index: true }, // uuid v4 for app-facing id
  sellerId: { type: String, index: true }, // maps to Shop.userId
  name: { type: String, default: '' },
  email: { type: String, required: true, index: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
}, { timestamps: true });
// Unique per shop
userSchema.index({ sellerId: 1, email: 1 }, { unique: true });

// Offers (visible to customer view)
app.get(base + '/offers', async (req, res) => {
  try {
    const { shop } = req.query
    const headerUserId = (req.header('x-user-id') || '').trim()
    let sellerId = ''
    if (shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean()
      if (!s) return res.json([])
      sellerId = String(s.userId)
    } else if (headerUserId) {
      sellerId = String(headerUserId)
    } else {
      return res.status(400).json({ error: 'shop or x-user-id required' })
    }
    const now = new Date()
    const filter = { userId: sellerId, status: 'Active', $or: [ { startsAt: { $exists: false } }, { startsAt: { $lte: now } } ] }
    const docs = await mongoose.model('Offer').find(filter).sort({ createdAt: -1 }).lean()
    const active = docs.filter(o => !o.endsAt || new Date(o.endsAt).getTime() >= now.getTime())
    res.json(active)
  } catch (err) {
    console.error('List offers error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
}, { _id: false });

// Address subdocument used for shipping/billing
const addressSchema = new mongoose.Schema({
  name: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  phone: String,
  email: String,
  label: { type: String, default: 'shipping' },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // who owns/sees this order (admin id for dashboard)
  customerId: { type: String },
  customerName: { type: String },
  customerEmail: { type: String },
  items: { type: [orderItemSchema], default: [] },
  shippingAddress: { type: addressSchema, default: undefined },
  totals: {
    subtotal: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    delivery: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  payment: {
    method: { type: String, default: 'unknown' },
    status: { type: String, default: 'Pending' },
    transactionId: { type: String, default: '' },
  },
}, { timestamps: true });

let User;
let Order;
let Customer;
let Product;
let Shop;
let Discount;
let Offer;
try {
  User = mongoose.model('User');
} catch { User = mongoose.model('User', userSchema); }
try {
  Order = mongoose.model('Order');
} catch { Order = mongoose.model('Order', orderSchema); }

// Customer model (aligned with admin service minimal fields; includes addresses array)
const customerSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  firstName: String,
  lastName: String,
  language: String,
  email: { type: String, index: true },
  phoneCountry: String,
  phoneNumber: { type: String, index: true },
  marketingEmails: Boolean,
  marketingSMS: Boolean,
  collectTax: String,
  notes: String,
  tags: String,
  status: { type: String, default: 'Active' },
  addresses: { type: [addressSchema], default: [] }
}, { timestamps: true });

try {
  Customer = mongoose.model('Customer');
} catch { Customer = mongoose.model('Customer', customerSchema); }

// Product model (to read products created by admin in the Mongo database)
const productSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  title: String,
  description: String,
  price: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  category: String,
  images: [String]
}, { timestamps: true });

// Ensure Product model is registered (fixes undefined model when listing products)
try {
  Product = mongoose.model('Product');
} catch { Product = mongoose.model('Product', productSchema); }

// Discount model (read discounts created in admin service)
const discountSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  method: { type: String, enum: ['code','auto'], default: 'code' },
  code: String,
  type: { type: String, enum: ['percentage','fixed'], default: 'percentage' },
  amount: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  startsAt: Date,
  endsAt: Date,
  productIds: { type: [String], default: undefined }
}, { timestamps: true })

try { Discount = mongoose.model('Discount') } catch { Discount = mongoose.model('Discount', discountSchema) }

// Offer model (read offers created in admin service)
const offerSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  title: { type: String, required: true },
  description: String,
  bannerUrl: String,
  status: { type: String, default: 'Active' },
  startsAt: Date,
  endsAt: Date,
  productIds: { type: [String], default: undefined }
}, { timestamps: true })

try { Offer = mongoose.model('Offer') } catch { Offer = mongoose.model('Offer', offerSchema) }

function isDiscountActive(d) {
  if (!d) return false
  if (String(d.status || '') !== 'Active') return false
  const now = Date.now()
  if (d.startsAt && new Date(d.startsAt).getTime() > now) return false
  if (d.endsAt && new Date(d.endsAt).getTime() < now) return false
  return true
}

function computeDiscountedPrice(price, disc) {
  const n = Number(price || 0)
  const amt = Number(disc?.amount || 0)
  if (!disc || !isFinite(n) || !isFinite(amt)) return null
  if (disc.type === 'percentage') {
    const p = Math.max(0, n - (n * (amt / 100)))
    return Math.round(p * 100) / 100
  }
  const p = Math.max(0, n - amt)
  return Math.round(p * 100) / 100
}

// Shop model
const shopSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  slug: { type: String, required: true },
  name: String,
  description: String,
  logo: String,
  cover: String,
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: () => new Date() },
}, { timestamps: true });
// Ensure a user cannot create duplicate slugs; allow same slug across different users
shopSchema.index({ userId: 1, slug: 1 }, { unique: true });

try {
  Shop = mongoose.model('Shop');
} catch { Shop = mongoose.model('Shop', shopSchema); }

// Routes base
const base = '/api';

// Health
app.get(base + '/health', (req, res) => res.json({ ok: true }));

// Shops
app.get(base + '/shops/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const headerUserId = (req.header('x-user-id') || '').trim();
    const query = headerUserId ? { userId: headerUserId, slug } : { slug };
    const shop = await Shop.findOne(query).lean();
    if (!shop) return res.status(404).json({ error: 'Not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upsert shop mapping (admin creates/updates shop slug -> userId)
app.post(base + '/shops', async (req, res) => {
  try {
    const body = req.body || {};
    const slug = String(body.slug || '').trim().toLowerCase();
    const userId = String(body.userId || '').trim();
    if (!slug || !userId) return res.status(400).json({ error: 'slug and userId required' });
    const update = {
      userId,
      slug,
      name: String(body.name || ''),
      description: String(body.description || ''),
      logo: String(body.logo || ''),
      cover: String(body.cover || ''),
      status: String(body.status || 'Active')
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const doc = await Shop.findOneAndUpdate({ userId, slug }, { $set: update }, opts);
    res.status(201).json(doc.toObject());
  } catch (err) {
    console.error('Upsert shop error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Auth: Register
app.post(base + '/auth/register', async (req, res) => {
  try {
    const { name, email, password, shop } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    // Determine sellerId from header or shop slug
    let sellerId = (req.header('x-user-id') || '').trim()
    if (!sellerId && shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean()
      if (s) sellerId = String(s.userId)
    }
    if (!sellerId) return res.status(400).json({ error: 'shop or x-user-id required' })

    const existing = await User.findOne({ sellerId, email: { $regex: `^${String(email)}$`, $options: 'i' } }).lean();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const doc = await User.create({ id: uuidv4(), sellerId, name: name || '', email, passwordHash: hash });
    const user = { id: doc.id, name: doc.name, email: doc.email };
    const token = sign(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Auth: Login
app.post(base + '/auth/login', async (req, res) => {
  try {
    const { email, password, shop } = req.body || {};
    let sellerId = (req.header('x-user-id') || '').trim()
    if (!sellerId && shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean()
      if (s) sellerId = String(s.userId)
    }
    if (!sellerId) return res.status(400).json({ error: 'shop or x-user-id required' })
    const doc = await User.findOne({ sellerId, email: { $regex: `^${String(email)}$`, $options: 'i' } });
    if (!doc) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, doc.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const user = { id: doc.id, name: doc.name, email: doc.email };
    const token = sign(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Products
app.get(base + '/products', async (req, res) => {
  try {
    const { shop } = req.query;
    const headerUserId = (req.header('x-user-id') || '').trim();
    let sellerId = '';
    if (shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
      if (!s) return res.json([]);
      sellerId = String(s.userId);
    } else if (headerUserId) {
      sellerId = String(headerUserId);
    } else {
      return res.status(400).json({ error: 'shop or x-user-id required' });
    }
    const filter = { userId: sellerId };
    const docs = await Product.find(filter).sort({ createdAt: -1 }).lean();

    // Apply automatic discounts (best one) to products
    let discounts = []
    try {
      discounts = await Discount.find({ userId: sellerId }).lean()
    } catch {}
    const activeAutos = (discounts || []).filter(d => isDiscountActive(d) && String(d.method) === 'auto')

    const out = docs.map(p => {
      let best = null
      let bestPrice = null
      for (const d of activeAutos) {
        // if productIds specified, apply only to those
        if (Array.isArray(d.productIds) && d.productIds.length) {
          const pid = String(p._id || '')
          if (!d.productIds.some(x => String(x) === pid)) continue
        }
        const newPrice = computeDiscountedPrice(p.price, d)
        if (newPrice == null) continue
        if (bestPrice == null || newPrice < bestPrice) { best = d; bestPrice = newPrice }
      }
      if (best && bestPrice != null) {
        return { ...p, discountedPrice: bestPrice, discount: { id: best._id?.toString?.(), type: best.type, amount: best.amount, method: best.method } }
      }
      return p
    })

    res.json(out);
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Product details
app.get(base + '/products/:id', async (req, res) => {
  try {
    const headerUserId = (req.header('x-user-id') || '').trim();
    let sellerId = '';
    const { id } = req.params;
    const { shop } = req.query;
    if (shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
      if (!s) return res.status(404).json({ error: 'Shop not found' });
      sellerId = String(s.userId);
    } else if (headerUserId) {
      sellerId = String(headerUserId);
    } else {
      return res.status(400).json({ error: 'shop or x-user-id required' });
    }
    const filter = { _id: new mongoose.Types.ObjectId(id), userId: sellerId };
    const doc = await Product.findOne(filter).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // Attach automatic discount preview
    let discounts = []
    try { discounts = await Discount.find({ userId: sellerId }).lean() } catch {}
    const activeAutos = (discounts || []).filter(d => isDiscountActive(d) && String(d.method) === 'auto')
    let best = null, bestPrice = null
    for (const d of activeAutos) {
      if (Array.isArray(d.productIds) && d.productIds.length) {
        const pid = String(doc._id || '')
        if (!d.productIds.some(x => String(x) === pid)) continue
      }
      const newPrice = computeDiscountedPrice(doc.price, d)
      if (newPrice == null) continue
      if (bestPrice == null || newPrice < bestPrice) { best = d; bestPrice = newPrice }
    }
    const payload = best && bestPrice != null
      ? { ...doc, discountedPrice: bestPrice, discount: { id: best._id?.toString?.(), type: best.type, amount: best.amount, method: best.method } }
      : doc
    res.json(payload);
  } catch (err) {
    res.status(400).json({ error: 'Bad id' });
  }
});

// Orders: create
app.post(base + '/orders', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(400).json({ error: 'x-user-id header required' });

    const { items, totals, payment, shippingAddress, customerEmail, customerName } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items required' });
    }

    // Normalize and validate shipping
    const ship = (shippingAddress && typeof shippingAddress === 'object') ? shippingAddress : {};
    const requiredShip = ['name','line1','city','state','postalCode','phone'];
    for (const k of requiredShip) {
      if (!String(ship[k] || '').trim()) {
        return res.status(400).json({ error: `shippingAddress.${k} is required` });
      }
    }

    const parseName = (full) => {
      if (!full) return { firstName: '', lastName: '' };
      const parts = String(full).trim().split(/\s+/);
      const firstName = parts.shift() || '';
      const lastName = parts.join(' ') || '';
      return { firstName, lastName };
    };

    // Upsert customer by (userId + email/phone)
    let customerDoc = null;
    const email = (customerEmail || ship.email || '').toLowerCase() || undefined;
    const phone = ship.phone || undefined;
    const findFilter = { userId: String(userId) };
    if (email || phone) {
      findFilter['$or'] = [];
      if (email) findFilter['$or'].push({ email });
      if (phone) findFilter['$or'].push({ phoneNumber: phone });
    }
    if (findFilter['$or'] && findFilter['$or'].length) {
      customerDoc = await Customer.findOne(findFilter);
    }
    const { firstName, lastName } = parseName(customerName || ship.name);
    const addr = {
      name: ship.name,
      line1: ship.line1,
      line2: ship.line2 || '',
      city: ship.city,
      state: ship.state,
      postalCode: ship.postalCode,
      country: ship.country || 'India',
      phone: ship.phone,
      email: email,
      label: 'shipping',
      isDefault: true
    };
    if (!customerDoc) {
      customerDoc = await Customer.create({
        userId: String(userId),
        firstName,
        lastName,
        email,
        phoneCountry: ship.phoneCountry || 'IN',
        phoneNumber: phone,
        status: 'Active',
        addresses: [addr]
      });
    } else {
      // Update basic fields and ensure address exists
      const update = {
        firstName: customerDoc.firstName || firstName,
        lastName: customerDoc.lastName || lastName,
        email: customerDoc.email || email,
        phoneCountry: customerDoc.phoneCountry || ship.phoneCountry || 'IN',
        phoneNumber: customerDoc.phoneNumber || phone,
        status: 'Active'
      };
      // Append address if different
      const hasSameAddr = (customerDoc.addresses || []).some(a =>
        String(a.line1||'') === String(addr.line1) &&
        String(a.postalCode||'') === String(addr.postalCode) &&
        String(a.city||'') === String(addr.city)
      );
      const addresses = Array.from(customerDoc.addresses || []);
      if (!hasSameAddr) addresses.unshift({ ...addr, isDefault: !addresses.length });
      await Customer.updateOne({ _id: customerDoc._id }, { $set: { ...update, addresses } });
    }

    const order = await Order.create({
      userId: String(userId),
      customerId: customerDoc?._id?.toString?.(),
      customerName: customerName || ship.name,
      customerEmail: email,
      shippingAddress: addr,
      items: items.map((it) => ({
        productId: String(it.productId || ''),
        name: String(it.name || 'Item'),
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        image: it.image || '',
      })),
      totals: {
        subtotal: Number(totals?.subtotal || 0),
        gst: Number(totals?.gst || 0),
        delivery: Number(totals?.delivery || 0),
        total: Number(totals?.total || 0),
      },
      payment: {
        method: String(payment?.method || 'unknown'),
        status: String(payment?.status || 'Pending'),
        transactionId: String(payment?.transactionId || ''),
      },
    });

    res.status(201).json({ orderId: order._id.toString(), id: order._id.toString(), ...order.toObject() });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: list (admin sees all, others see own)
app.get(base + '/orders', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(400).json({ error: 'x-user-id header required' });

    const isAdmin = String(userId) === String(ADMIN_USER_ID);
    const filter = isAdmin ? {} : { userId: String(userId) };
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
})
;

// Bootstrap: connect DB then start server
const start = async () => {
  try {
    if (!MONGO_URI) {
      console.warn('MONGO_URI not set. Orders and auth require MongoDB.');
    } else {
      await mongoose.connect(MONGO_URI, { dbName: MONGO_DB_NAME });
      console.log(`MongoDB connected (db: ${MONGO_DB_NAME})`);
    }
    app.listen(PORT, () => {
      console.log(`Dev API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
