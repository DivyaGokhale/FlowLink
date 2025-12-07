// FlowLink E-commerce API Server
// Run: npm run server

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import Routes
import chatRouter from './routes/chat.js';
import razorpayRouter from './routes/razorpay.js';
import reviewsRouter from './routes/reviews.js';
import recommendationsRouter from './routes/recommendations.js';
import authRouter from './routes/auth.js';
import shopsRouter from './routes/shops.js';
import productsRouter from './routes/products.js';
import offersRouter from './routes/offers.js';
import ordersRouter from './routes/orders.js';
import cartRouter from './routes/cart.js';
import paymentRouter from './routes/payment.js';
import customerRouter from './routes/customer.js';

// Resolve root .env even when starting from server/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();
if (!process.env.MONGO_URI) {
  const rootEnvPath = resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }
}

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://FlowLink:FlowLink8550@flowlink.wlohsvp.mongodb.net/?retryWrites=true&w=majority&appName=FlowLink';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'flowlink';

// Connect to MongoDB
mongoose.connect(MONGO_URI, { dbName: MONGO_DB_NAME })
  .then(() => console.log(`MongoDB connected (db: ${MONGO_DB_NAME})`))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

// Middleware - must be defined before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Allow requests from admin panel (localhost:3000) and self (localhost:5001)
app.use(cors({
  origin: true, // Reflects the request origin, effectively allowing all
  credentials: true
}));

// Serve static files from public directory
// Serve static files from public directory
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); // serve uploads folder

// Data files setup (Legacy/Fallback)
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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Configure Routes
const base = '/api';

app.get(base + '/health', (req, res) => res.json({ ok: true }));

app.use(base + '/customer', customerRouter);
app.use(base + '/auth', authRouter);
app.use(base + '/shops', shopsRouter);
app.use(base + '/products', productsRouter); // Handles list, brands, categories, details
app.use(base + '/offers', offersRouter);
app.use(base + '/orders', ordersRouter);
app.use(base + '/cart', cartRouter);
app.use(base + '/payment', paymentRouter);
app.use(base + '/chat', chatRouter);
app.use(base + '/razorpay', razorpayRouter);
app.use(base + '/reviews', reviewsRouter);
app.use(base + '/recommendations', recommendationsRouter);


// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS' || err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: 'The request was blocked due to CORS policy'
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : err.message
  });
});

// Start Server
const start = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Dev API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
