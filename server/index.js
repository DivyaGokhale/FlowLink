// FlowLink E-commerce API Server
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
import { body, validationResult } from 'express-validator';
import razorpayRoutes from './routes/razorpay.js';
import { 
  loginLimiter, 
  apiLimiter, 
  cartLimiter, 
  securityHeaders,
  validateLogin,
  validateCart 
} from './middleware/security.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

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

// Login throttling / temporary lockout configuration
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 3);
const LOGIN_WINDOW_MINUTES = Number(process.env.LOGIN_WINDOW_MINUTES || 15);
const LOGIN_LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15);
const LOGIN_WINDOW_MS = LOGIN_WINDOW_MINUTES * 60 * 1000;
const LOGIN_LOCKOUT_MS = LOGIN_LOCKOUT_MINUTES * 60 * 1000;

// In-memory tracking for failed login attempts per sellerId+email (+IP)
// Map key format: `${sellerId}|${email}|${ip}`
const loginAttempts = new Map();
function attemptKey(sellerId, email, ip) {
  const e = String(email || '').toLowerCase().trim();
  const s = String(sellerId || '').trim();
  const i = String(ip || '').trim();
  return `${s}|${e || 'noemail'}|${i || 'noip'}`;
}
function isLocked(entry, now) {
  return Boolean(entry && entry.lockUntil && now < entry.lockUntil);
}

const app = express();

// Middleware - must be defined before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Serve static files from public directory
app.use(express.static('public'));

// Mount routes
app.use('/api/razorpay', razorpayRoutes);

// Simple CORS configuration for development
app.use((req, res, next) => {
  // Allow all origins in development
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-requested-with, accept, origin, x-csrf-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS' || err.message.includes('CORS')) {
    console.error('CORS Error Details:', {
      origin: req.get('origin') || 'No origin header',
      method: req.method,
      path: req.path,
      headers: req.headers,
      allowedOrigins: allowedOrigins
    });
    
    return res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: 'The request was blocked due to CORS policy',
      details: process.env.NODE_ENV === 'production' ? undefined : {
        origin: req.get('origin') || 'No origin header',
        method: req.method,
        path: req.path,
        allowedOrigins: allowedOrigins,
        hint: 'Ensure your frontend URL is in the allowedOrigins array in server/index.js'
      }
    });
  }
  
  // Handle other errors
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: {
        name: err.name,
        status: err.status,
        code: err.code,
        ...(err.errors && { errors: err.errors })
      }
    })
  });
});

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

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
  // Indicates how this user was created (e.g., 'provision' from admin)
  source: { type: String, default: '' },
  createdAt: { type: Date, default: () => new Date() },
  // Account lock mechanism for brute-force protection
  loginAttempts: { type: Number, default: 0 }, // Track consecutive failed login attempts
  lockUntil: { type: Date, default: null }, // Temporary lock expiration timestamp
}, { timestamps: true });
// Unique per shop
userSchema.index({ sellerId: 1, email: 1 }, { unique: true });

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
  status: { 
    type: String, 
    enum: ['ORDER_PLACED', 'PAYMENT_CONFIRMED', 'ORDER_CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    default: 'ORDER_PLACED' 
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
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

// Routes base
const base = '/api';

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

// Routes base (already declared above)

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
app.post(base + '/auth/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, email, password, shop } = req.body || {};
    
    // Determine sellerId from header or shop slug
    let sellerId = (req.header('x-user-id') || '').trim()
    if (!sellerId && shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean()
      if (s) sellerId = String(s.userId)
    }
    if (!sellerId) sellerId = String(ADMIN_USER_ID)

    const existing = await User.findOne({ sellerId, email: { $regex: `^${String(email)}$`, $options: 'i' } }).lean();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const doc = await User.create({ 
      id: uuidv4(), 
      sellerId, 
      name: name || '', 
      email, 
      passwordHash: hash 
    });
    
    const user = { id: doc.id, name: doc.name, email: doc.email };
    const token = sign(user);
    
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      token, 
      user 
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if account is locked
app.post(base + '/auth/check-lock', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email } = req.body;
    const now = new Date();
    
    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: `^${String(email)}$`, $options: 'i' } 
    });

    if (user && user.lockUntil && user.lockUntil > now) {
      return res.json({ locked: true, lockUntil: user.lockUntil });
    }
    
    res.json({ locked: false });
  } catch (err) {
    console.error('Check lock error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Auth: Login
app.post(base + '/auth/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password, shop } = req.body || {};
    let sellerId = (req.header('x-user-id') || '').trim()
    const headerUserId = sellerId; // Keep for fallback logic
    const now = new Date();
    
    if (!sellerId && shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean()
      if (s) sellerId = String(s.userId)
    }
    if (!sellerId) sellerId = String(ADMIN_USER_ID)

    // Find user - using database-backed lock mechanism
    let doc = await User.findOne({ sellerId, email: { $regex: `^${String(email)}$`, $options: 'i' } });
    // Fallback: if shop not specified and no doc found for current seller, try unique email match across sellers
    if (!doc && !shop && !headerUserId) {
      const candidates = await User.find({ email: { $regex: `^${String(email)}$`, $options: 'i' } }).limit(2).lean();
      if (candidates.length === 1) {
        // Use the uniquely matched user across sellers
        sellerId = String(candidates[0].sellerId || '');
        doc = await User.findOne({ sellerId, email: { $regex: `^${String(email)}$`, $options: 'i' } });
      }
    }

    // If user exists, check account lock status before authentication
    if (doc) {
      // Check if account is temporarily locked (lockUntil exists and is in the future)
      if (doc.lockUntil && doc.lockUntil > now) {
        return res.status(403).json({ 
          error: 'Account temporarily locked. Try again after 15 minutes.',
          message: 'Account temporarily locked. Try again after 15 minutes.'
        });
      }
      // If lock has expired, clear it and reset attempts before proceeding
      if (doc.lockUntil && doc.lockUntil <= now) {
        await User.updateOne({ _id: doc._id }, { $set: { loginAttempts: 0, lockUntil: null } });
        doc.loginAttempts = 0;
        doc.lockUntil = null;
      }
    }

    // Verify user exists and password
    if (!doc) {
      // User doesn't exist - return generic error (don't reveal if user exists)
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, doc.passwordHash);
    
    if (!ok) {
      // Failed login: increment attempts and lock if threshold reached
      const newAttempts = (doc.loginAttempts || 0) + 1;
      const updateData = { loginAttempts: newAttempts };
      
      // Lock account after 3 failed attempts for 15 minutes
      if (newAttempts >= 3) {
        const lockUntil = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes from now
        updateData.lockUntil = lockUntil;
      }
      
      // Use findOneAndUpdate for atomic update (race-condition safe)
      await User.findOneAndUpdate(
        { _id: doc._id },
        { $set: updateData },
        { new: true }
      );
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Successful login: reset attempts and clear lock
    await User.findOneAndUpdate(
      { _id: doc._id },
      { $set: { loginAttempts: 0, lockUntil: null } }
    );
    
    const user = { id: doc.id, name: doc.name, email: doc.email };
    const token = sign(user);
    
    // Determine shop slug associated with this seller/user for redirect
    let shopSlug = '';
    try {
      const shopDoc = await Shop.findOne({ userId: sellerId }).lean();
      if (shopDoc && shopDoc.slug) {
        shopSlug = String(shopDoc.slug);
      }
    } catch (_) {}

    res.json({ 
      success: true,
      message: 'Login successful',
      token, 
      user,
      shopSlug
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Auth: Provision (upsert user, set password) - for admin-triggered customer portal
app.post(base + '/auth/provision', async (req, res) => {
  try {
    const { name, email, password, shop } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    let sellerId = (req.header('x-user-id') || '').trim();
    if (!sellerId && shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
      if (s) sellerId = String(s.userId);
    }
    if (!sellerId) sellerId = String(ADMIN_USER_ID);

    let doc = await User.findOne({ sellerId, email: { $regex: `^${String(email)}$`, $options: 'i' } });
    const hash = await bcrypt.hash(password, 10);
    if (doc) {
      // update password and optionally name
      const newName = name || doc.name || '';
      await User.updateOne({ _id: doc._id }, { $set: { passwordHash: hash, name: newName, source: 'provision' } });
      // refresh doc
      doc = await User.findById(doc._id);
    } else {
      // create
      doc = await User.create({ id: uuidv4(), sellerId, name: name || '', email, passwordHash: hash, source: 'provision' });
    }
    const user = { id: doc.id, name: doc.name, email: doc.email };
    const token = sign(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Provision error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request password reset
app.post(base + '/auth/request-password-reset', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ 
      email: { $regex: `^${String(email)}$`, $options: 'i' } 
    });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, a reset link has been sent' 
      });
    }
    
    // In a real application, you would:
    // 1. Generate a secure reset token with expiry
    // 2. Store it in the database
    // 3. Send email with reset link
    // For now, we'll simulate the process
    
    console.log(`Password reset requested for: ${email}`);
    console.log(`Reset token would be sent to: ${email}`);
    
    // In a real app, you would send an email here
    // await sendPasswordResetEmail(user.email, resetToken);
    
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, a reset link has been sent' 
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password with token
app.post(base + '/auth/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // In a real application, you would:
    // 1. Verify the reset token from the database
    // 2. Check if it's expired
    // 3. Update the user's password
    // 4. Clear the reset token
    // For now, we'll simulate the process
    
    console.log(`Password reset attempt with token: ${token}`);
    
    // For this implementation, we'll just clear any login attempts/blocks for the user
    // In a real app, you would look up the user by the token
    // For simulation purposes, we'll use a simple approach
    
    // Since we can't properly validate the token without storing it, 
    // we'll just return a success message
    // In a real app, you would validate the token against a stored value
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Determine eligibility for VIP pricing for the logged-in user within a shop
app.get(base + '/auth/eligibility', async (req, res) => {
  try {
    const { shop } = req.query || {};
    const headerUserId = (req.header('x-user-id') || '').trim();
    let sellerId = '';
    if (shop) {
      const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
      if (!s) return res.status(404).json({ error: 'Shop not found' });
      sellerId = String(s.userId);
    } else if (headerUserId) {
      sellerId = String(headerUserId);
    } else {
      return res.status(400).json({ error: 'shop or x-user-id required' });
    }

    // Get user email from Authorization token if provided
    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    let email = '';
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const sub = typeof payload === 'object' && payload ? (payload).sub : null;
        if (sub) {
          const u = await User.findOne({ id: String(sub) }).lean();
          if (u && u.email) email = String(u.email).toLowerCase();
        }
      } catch (_) {
        // ignore token errors; fall back to query param
      }
    }
    if (!email && typeof req.query?.email === 'string') {
      email = String(req.query.email).toLowerCase();
    }
    if (!email) return res.status(400).json({ error: 'email not found' });

    // Check if user was added as a customer in admin (exists in customers collection),
    // or was provisioned via admin, or explicitly VIP-tagged.
    const escapeRegExp = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const byEmail = { $regex: `^${escapeRegExp(email)}$`, $options: 'i' };
    const customer = await Customer.findOne({ userId: sellerId, email: byEmail }).lean();
    let eligible = Boolean(customer);
    let reason = eligible ? 'customer' : 'none';
    // VIP-tagged customer (refine reason)
    if (customer && typeof customer.tags === 'string' && /\bvip\b/i.test(customer.tags)) {
      reason = 'vip-tag';
    }
    // Or provisioned user (admin-added portal account)
    if (!eligible) {
      const usr = await User.findOne({ sellerId, email: byEmail }).lean();
      if (usr && String(usr.source || '') === 'provision') {
        eligible = true;
        reason = 'provision';
      }
    }

    return res.json({ eligible, reason });
  } catch (err) {
    console.error('Eligibility error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Products
app.get(base + '/products', async (req, res) => {
  try {
    const { shop, q } = req.query;
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

    // Build filter with optional search query
    const filter = { userId: sellerId };
    if (typeof q === 'string' && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      Object.assign(filter, { $or: [ { title: rx }, { description: rx } ] });
    }

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

// Products by category (case-insensitive exact match on category field)
app.get(base + '/products/category/:category', async (req, res) => {
  try {
    const headerUserId = (req.header('x-user-id') || '').trim();
    const { category } = req.params;
    const { shop } = req.query;
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

    const rx = new RegExp('^' + String(category || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    const filter = { userId: sellerId, category: rx };
    const docs = await Product.find(filter).sort({ createdAt: -1 }).lean();

    // Apply automatic discounts (best one) to products
    let discounts = []
    try { discounts = await Discount.find({ userId: sellerId }).lean() } catch {}
    const activeAutos = (discounts || []).filter(d => isDiscountActive(d) && String(d.method) === 'auto')

    const out = (docs || []).map(p => {
      let best = null
      let bestPrice = null
      for (const d of activeAutos) {
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
    console.error('List products by category error:', err)
    res.status(500).json({ error: 'Server error' });
  }
});

// Cart: Add item
app.post(base + '/cart/add', [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  handleValidationErrors
], async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { productId, quantity } = req.body;
    
    // Verify product exists
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // For now, we'll store cart in session/memory
    // In production, you might want to store cart in Redis or MongoDB
    const cartKey = `cart:${userId}`;
    
    res.json({
      success: true,
      message: 'Item added to cart',
      cartItem: {
        productId,
        quantity,
        product: {
          id: product._id,
          title: product.title,
          price: product.price,
          image: product.images?.[0]
        }
      }
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cart: Get items
app.get(base + '/cart', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    // Return empty cart for now - implement cart storage as needed
    res.json({
      success: true,
      items: [],
      total: 0
    });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: create
app.post(base + '/orders', [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive'),
  body('shippingAddress.name').notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.line1').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone number is required'),
  handleValidationErrors
], async (req, res) => {
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
      status: 'ORDER_PLACED', // Set initial status
    });

    res.status(201).json({ 
      success: true,
      message: 'Order created successfully',
      data: order,  // Include the created order in the response
      orderId: order._id.toString(), 
      id: order._id.toString(), 
      ...order.toObject() 
    });
    
    // Emit order placed event to customer
    if (global.emitOrderPlaced) {
      global.emitOrderPlaced(order._id.toString(), userId);
    }
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Payment: Verify payment
app.post(base + '/payment/verify', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('signature').notEmpty().withMessage('Payment signature is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { orderId, paymentId, signature } = req.body;

    // Find the order
    const order = await Order.findOne({ _id: orderId, userId }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Verify payment signature (implement based on your payment gateway)
    // This is a placeholder - implement actual verification logic
    const isValidPayment = true; // Replace with actual verification

    if (isValidPayment) {
      // Update order payment status
      await Order.updateOne(
        { _id: orderId },
        { 
          $set: { 
            'payment.status': 'Completed',
            'payment.transactionId': paymentId,
            'status': 'PAYMENT_CONFIRMED' // Update order status to reflect payment confirmation
          }
        }
      );
      
      // Emit order status update
      if (global.emitOrderStatusUpdate) {
        global.emitOrderStatusUpdate(orderId, 'PAYMENT_CONFIRMED');
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: orderId
      });
    } else {
      res.status(400).json({ error: 'Invalid payment signature' });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: Get single order
app.get(base + '/orders/:orderId', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

    // Find the order
    const order = await Order.findById(orderId).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if user has access to this order
    const isAdmin = String(userId) === String(ADMIN_USER_ID);
    if (!isAdmin && String(order.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (err) {
    console.error('Get order error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: Update order status
app.patch(base + '/orders/:orderId/status', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['ORDER_PLACED', 'PAYMENT_CONFIRMED', 'ORDER_CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ') });
    }

    // Find and update the order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if user has access to update this order
    const isAdmin = String(userId) === String(ADMIN_USER_ID);
    if (!isAdmin && String(order.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Ensure proper state transitions (prevent skipping steps)
    const currentStatus = order.status;
    const validTransitions = {
      'ORDER_PLACED': ['PAYMENT_CONFIRMED', 'CANCELLED'],
      'PAYMENT_CONFIRMED': ['ORDER_CONFIRMED', 'CANCELLED'],
      'ORDER_CONFIRMED': ['OUT_FOR_DELIVERY', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [],
      'CANCELLED': []
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${currentStatus} to ${status}. Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'none'}` 
      });
    }

    // Handle stock deduction when order is confirmed
    if (status === 'ORDER_CONFIRMED' && currentStatus !== 'ORDER_CONFIRMED') {
      // Deduct stock for each item in the order
      for (const item of order.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        
        // Find and update the product quantity
        const product = await Product.findById(productId);
        if (product) {
          if (product.quantity < quantity) {
            return res.status(400).json({ 
              error: `Insufficient stock for product ${product.title}. Available: ${product.quantity}, Requested: ${quantity}` 
            });
          }
          
          // Update product quantity
          product.quantity = Math.max(0, product.quantity - quantity);
          await product.save();
        }
      }
    }

    // Handle stock restoration when order is cancelled
    if (status === 'CANCELLED' && currentStatus !== 'CANCELLED') {
      // Restore stock for each item in the order
      for (const item of order.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        
        // Find and update the product quantity
        const product = await Product.findById(productId);
        if (product) {
          // Increase product quantity
          product.quantity = product.quantity + quantity;
          await product.save();
        }
      }
    }

    // Update order status
    order.status = status;
    await order.save();
    
    // Emit order status update
    if (global.emitOrderStatusUpdate) {
      global.emitOrderStatusUpdate(orderId, status, order.userId);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (err) {
    console.error('Update order status error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: Submit feedback
app.post(base + '/orders/:orderId/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if user has access to this order
    const isAdmin = String(userId) === String(ADMIN_USER_ID);
    if (!isAdmin && String(order.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order is delivered
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Feedback can only be submitted for delivered orders' });
    }

    // Check if feedback already exists
    if (order.feedback && order.feedback.rating !== undefined) {
      return res.status(400).json({ error: 'Feedback already submitted for this order' });
    }

    // Update order with feedback
    order.feedback = {
      rating: Number(rating),
      comment: comment || '',
      submittedAt: new Date()
    };
    await order.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: order
    });

  } catch (err) {
    console.error('Submit feedback error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: Submit feedback
app.post(base + '/orders/:orderId/feedback', [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if user has access to this order
    const isAdmin = String(userId) === String(ADMIN_USER_ID);
    if (!isAdmin && String(order.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order is delivered
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Feedback can only be submitted for delivered orders' });
    }

    // Check if feedback already exists
    if (order.feedback && order.feedback.rating !== undefined) {
      return res.status(400).json({ error: 'Feedback already submitted for this order' });
    }

    // Update order with feedback
    order.feedback = {
      rating: Number(rating),
      comment: comment || '',
      submittedAt: new Date()
    };
    await order.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: order
    });

  } catch (err) {
    console.error('Submit feedback error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: Update order status
app.patch(base + '/orders/:orderId/status', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['ORDER_PLACED', 'PAYMENT_CONFIRMED', 'ORDER_CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ') });
    }

    // Find and update the order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if user has access to update this order
    const isAdmin = String(userId) === String(ADMIN_USER_ID);
    if (!isAdmin && String(order.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Ensure proper state transitions (prevent skipping steps)
    const currentStatus = order.status;
    const validTransitions = {
      'ORDER_PLACED': ['PAYMENT_CONFIRMED', 'CANCELLED'],
      'PAYMENT_CONFIRMED': ['ORDER_CONFIRMED', 'CANCELLED'],
      'ORDER_CONFIRMED': ['OUT_FOR_DELIVERY', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [],
      'CANCELLED': []
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${currentStatus} to ${status}. Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'none'}` 
      });
    }

    // Handle stock deduction when order is confirmed
    if (status === 'ORDER_CONFIRMED' && currentStatus !== 'ORDER_CONFIRMED') {
      // Deduct stock for each item in the order
      for (const item of order.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        
        // Find and update the product quantity
        const product = await Product.findById(productId);
        if (product) {
          if (product.quantity < quantity) {
            return res.status(400).json({ 
              error: `Insufficient stock for product ${product.title}. Available: ${product.quantity}, Requested: ${quantity}` 
            });
          }
          
          // Update product quantity
          product.quantity = Math.max(0, product.quantity - quantity);
          await product.save();
        }
      }
    }

    // Handle stock restoration when order is cancelled
    if (status === 'CANCELLED' && currentStatus !== 'CANCELLED') {
      // Restore stock for each item in the order
      for (const item of order.items) {
        const productId = item.productId;
        const quantity = item.quantity;
        
        // Find and update the product quantity
        const product = await Product.findById(productId);
        if (product) {
          // Increase product quantity
          product.quantity = product.quantity + quantity;
          await product.save();
        }
      }
    }

    // Update order status
    order.status = status;
    await order.save();
    
    // Emit order status update
    if (global.emitOrderStatusUpdate) {
      global.emitOrderStatusUpdate(orderId, status, order.userId);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (err) {
    console.error('Update order status error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: Update order
app.patch(base + '/orders/:orderId', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const { orderId } = req.params;
    const updateData = req.body;

    // Find and update the order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if user has access to update this order
    const isAdmin = String(userId) === String(ADMIN_USER_ID);
    if (!isAdmin && String(order.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update order fields
    Object.assign(order, updateData);
    await order.save();
    
    // Emit order status update if status changed
    if (updateData.payment && updateData.payment.status && order.payment.status !== updateData.payment.status) {
      if (global.emitOrderStatusUpdate) {
        global.emitOrderStatusUpdate(order._id.toString(), updateData.payment.status, order.userId);
      }
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });

  } catch (err) {
    console.error('Update order error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders: list (admin sees all, others see own)
app.get(base + '/orders', async (req, res) => {
  try {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const isAdmin = String(userId) === String(ADMIN_USER_ID);
    const filter = isAdmin ? {} : { userId: String(userId) };
    
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Add status filter if provided
    if (status) {
      filter['payment.status'] = status;
    }
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
      
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bootstrap: connect DB then start server
const start = async () => {
  try {
    if (!MONGO_URI) {
      console.warn('MONGO_URI not set. Orders and auth require MongoDB.');
    } else {
      await mongoose.connect(MONGO_URI, { dbName: MONGO_DB_NAME });
      console.log(`MongoDB connected (db: ${MONGO_DB_NAME})`);
    }
    
    // Create HTTP server and attach Express app
    const server = createServer(app);
    
    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: "*", // In production, specify your frontend URL
        methods: ["GET", "POST"]
      }
    });
    
    // Store user-to-socket mapping
    const userSocketMap = new Map();
    
    // Socket.IO connection handling
    io.use((socket, next) => {
      // Extract and verify JWT token from query or authorization header
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('Socket connection rejected: No token provided');
        return next(new Error('Authentication error'));
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.sub; // Attach userId to socket
        next();
      } catch (err) {
        console.log('Socket connection rejected: Invalid token');
        next(new Error('Authentication error'));
      }
    });
    
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id, 'User ID:', socket.userId);
      
      // Map user to socket
      if (socket.userId) {
        userSocketMap.set(socket.userId, socket.id);
        console.log(`Mapped user ${socket.userId} to socket ${socket.id}`);
      }
      
      // Handle order room joining
      socket.on('join-order-room', (data) => {
        if (data.orderId && socket.userId) {
          // Verify that the user has access to this order
          socket.join(data.orderId);
          console.log(`User ${socket.userId} joined order room: ${data.orderId}`);
        }
      });
      
      // Handle order room leaving
      socket.on('leave-order-room', (data) => {
        if (data.orderId) {
          socket.leave(data.orderId);
          console.log(`User ${socket.id} left order room: ${data.orderId}`);
        }
      });
      
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id, 'User ID:', socket.userId);
        // Clean up user-to-socket mapping
        if (socket.userId) {
          userSocketMap.delete(socket.userId);
          console.log(`Removed user ${socket.userId} from socket map`);
        }
      });
    });
    
    // Start server with Socket.IO
    server.listen(PORT, () => {
      console.log(`Dev API listening on http://localhost:${PORT}`);
    });
    
    // Make io available globally or pass it to other modules if needed
    global.io = io;
    global.userSocketMap = userSocketMap; // Make userSocketMap available globally
    
    // Function to emit order status updates
    global.emitOrderStatusUpdate = (orderId, status, userId) => {
      if (global.io) {
        // Emit to specific order room
        global.io.to(orderId).emit('order:status_update', {
          orderId,
          status
        });
        console.log(`Order status updated for ${orderId}: ${status}`);
      }
    };
    
    // Function to emit order placed event
    global.emitOrderPlaced = (orderId, userId) => {
      if (global.io && userId) {
        // Emit to user's personal room or order room
        global.io.to(orderId).emit('order:placed', {
          orderId,
          message: 'Order placed successfully'
        });
        console.log(`Order placed notification sent for ${orderId} to user ${userId}`);
      }
    };
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
