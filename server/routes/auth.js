import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Customer from '../models/Customer.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'HS9Yf7yCJ3Zc6MSIFDa3oOlN1Wl1';

const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 3);
const LOGIN_WINDOW_MINUTES = Number(process.env.LOGIN_WINDOW_MINUTES || 15);
const LOGIN_LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES || 15);
const LOGIN_WINDOW_MS = LOGIN_WINDOW_MINUTES * 60 * 1000;
const LOGIN_LOCKOUT_MS = LOGIN_LOCKOUT_MINUTES * 60 * 1000;

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

function sign(user) {
    return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

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

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { name, email, password, shop } = req.body || {};

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

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { email, password, shop } = req.body || {};
        let sellerId = (req.header('x-user-id') || '').trim()
        const now = Date.now();
        const ip = req.ip || req.connection?.remoteAddress || '';

        if (!sellerId && shop) {
            const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean()
            if (s) sellerId = String(s.userId)
        }
        if (!sellerId) sellerId = String(ADMIN_USER_ID)

        const key = attemptKey(sellerId, email, ip);
        let entry = loginAttempts.get(key);
        if (entry) {
            if (entry.firstAt && (now - entry.firstAt) > LOGIN_WINDOW_MS) {
                entry = { count: 0, firstAt: now, lockUntil: 0 };
                loginAttempts.set(key, entry);
            }
        }
        if (isLocked(entry, now)) {
            const retryAfterSec = Math.ceil((entry.lockUntil - now) / 1000);
            res.set('Retry-After', String(retryAfterSec));
            return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });
        }

        let doc = await User.findOne({ sellerId, email: { $regex: `^${String(email)}$`, $options: 'i' } });
        const headerUserId = (req.header('x-user-id') || '').trim();
        if (!doc && !shop && !headerUserId) {
            const candidates = await User.find({ email: { $regex: `^${String(email)}$`, $options: 'i' } }).limit(2).lean();
            if (candidates.length === 1) {
                sellerId = String(candidates[0].sellerId || '');
                doc = await User.findOne({ sellerId, email: { $regex: `^${String(email)}$`, $options: 'i' } });
            }
        }
        if (!doc) {
            const curr = loginAttempts.get(key) || { count: 0, firstAt: now, lockUntil: 0 };
            if (!curr.firstAt || (now - curr.firstAt) > LOGIN_WINDOW_MS) {
                curr.firstAt = now; curr.count = 0; curr.lockUntil = 0;
            }
            curr.count += 1;
            if (curr.count >= LOGIN_MAX_ATTEMPTS) {
                curr.lockUntil = now + LOGIN_LOCKOUT_MS;
            }
            loginAttempts.set(key, curr);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const ok = await bcrypt.compare(password, doc.passwordHash);
        if (!ok) {
            const curr = loginAttempts.get(key) || { count: 0, firstAt: now, lockUntil: 0 };
            if (!curr.firstAt || (now - curr.firstAt) > LOGIN_WINDOW_MS) {
                curr.firstAt = now; curr.count = 0; curr.lockUntil = 0;
            }
            curr.count += 1;
            if (curr.count >= LOGIN_MAX_ATTEMPTS) {
                curr.lockUntil = now + LOGIN_LOCKOUT_MS;
            }
            loginAttempts.set(key, curr);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (loginAttempts.has(key)) loginAttempts.delete(key);
        const user = { id: doc.id, name: doc.name, email: doc.email };
        const token = sign(user);

        let shopSlug = '';
        try {
            const shopDoc = await Shop.findOne({ userId: sellerId }).lean();
            if (shopDoc && shopDoc.slug) {
                shopSlug = String(shopDoc.slug);
            }
        } catch (_) { }

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

// Provision
router.post('/provision', async (req, res) => {
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
            const newName = name || doc.name || '';
            await User.updateOne({ _id: doc._id }, { $set: { passwordHash: hash, name: newName, source: 'provision' } });
            doc = await User.findById(doc._id);
        } else {
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

// Eligibility
router.get('/eligibility', async (req, res) => {
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
            } catch (_) { }
        }
        if (!email && typeof req.query?.email === 'string') {
            email = String(req.query.email).toLowerCase();
        }
        if (!email) return res.status(400).json({ error: 'email not found' });

        const escapeRegExp = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const byEmail = { $regex: `^${escapeRegExp(email)}$`, $options: 'i' };
        const customer = await Customer.findOne({ userId: sellerId, email: byEmail }).lean();
        let eligible = Boolean(customer);
        let reason = eligible ? 'customer' : 'none';
        if (customer && typeof customer.tags === 'string' && /\bvip\b/i.test(customer.tags)) {
            reason = 'vip-tag';
        }
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

// Social Login (Google/Microsoft)
router.post('/social-login', async (req, res) => {
    try {
        const { email, name, providerId, shop } = req.body || {};
        if (!email) return res.status(400).json({ error: 'Email is required' });

        let sellerId = (req.header('x-user-id') || '').trim();
        if (!sellerId && shop) {
            const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
            if (s) sellerId = String(s.userId);
        }
        if (!sellerId) sellerId = String(ADMIN_USER_ID);

        // Find existing user by email
        let doc = await User.findOne({
            sellerId,
            email: { $regex: `^${String(email)}$`, $options: 'i' }
        });

        if (!doc) {
            // Create new user if doesn't exist
            try {
                doc = await User.create({
                    id: uuidv4(),
                    sellerId,
                    name: name || '',
                    email,
                    passwordHash: 'social-login',
                    source: 'social'
                    // providerId ignored by strict schema
                });
            } catch (createErr) {
                console.error("User creation failed:", createErr);
                throw createErr;
            }
        }

        // Generate backend token using the correct custom ID (avoid mongoose 'id' virtual for _id)
        const userId = doc.get ? doc.get('id') : doc.id;
        const user = { id: userId, name: doc.name, email: doc.email };
        const token = sign(user);

        // Try to get shop slug
        let shopSlug = '';
        try {
            const shopDoc = await Shop.findOne({ userId: sellerId }).lean();
            if (shopDoc && shopDoc.slug) {
                shopSlug = String(shopDoc.slug);
            }
        } catch (_) { }

        res.json({
            success: true,
            message: 'Social login successful',
            token,
            user,
            shopSlug
        });

    } catch (err) {
        console.error('Social login error:', err);
        res.status(500).json({ error: err.message || 'Server error', stack: err.stack });
    }
});

export default router;
