import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Discount from '../models/Discount.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

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

// Get all products
router.get('/', async (req, res) => {
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
            Object.assign(filter, { $or: [{ title: rx }, { description: rx }] });
        }

        const docs = await Product.find(filter).sort({ createdAt: -1 }).lean();

        // Apply automatic discounts (best one) to products
        let discounts = []
        try {
            discounts = await Discount.find({ userId: sellerId }).lean()
        } catch { }
        const activeAutos = (discounts || []).filter(d => isDiscountActive(d) && String(d.method) === 'auto')

        // Check VIP eligibility
        let isVip = false;
        const authHeader = req.header('authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (token) {
            try {
                const payload = jwt.verify(token, JWT_SECRET);
                const sub = typeof payload === 'object' && payload ? (payload).sub : null;
                if (sub) {
                    const u = await User.findOne({ id: String(sub) }).lean();
                    if (u && u.email) {
                        const email = String(u.email).toLowerCase();
                        const escapeRegExp = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const byEmail = { $regex: `^${escapeRegExp(email)}$`, $options: 'i' };
                        const customer = await Customer.findOne({ userId: sellerId, email: byEmail }).lean();

                        // VIP logic: has 'vip' tag OR is provisioned user
                        if (customer && typeof customer.tags === 'string' && /\bvip\b/i.test(customer.tags)) {
                            isVip = true;
                        } else {
                            const usr = await User.findOne({ sellerId, email: byEmail }).lean();
                            if (usr && String(usr.source || '') === 'provision') {
                                isVip = true;
                            }
                        }
                    }
                }
            } catch (_) { }
        }

        const out = docs.map(p => {
            // Apply pricing rule: if price > 100 AND user is VIP, make 15 rupees off
            if (isVip && Number(p.price) > 100) {
                p.price = Number(p.price) - 15
            }

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

// Products by category
router.get('/category/:category', async (req, res) => {
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

        let discounts = []
        try { discounts = await Discount.find({ userId: sellerId }).lean() } catch { }
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

// Products by brand
router.get('/brand/:brand', async (req, res) => {
    try {
        const headerUserId = (req.header('x-user-id') || '').trim();
        const { brand } = req.params;
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

        const term = String(brand || '').trim();
        const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const filter = {
            userId: sellerId,
            $or: [{ title: rx }, { description: rx }, { category: rx }]
        };
        const docs = await Product.find(filter).sort({ createdAt: -1 }).lean();

        let discounts = []
        try { discounts = await Discount.find({ userId: sellerId }).lean() } catch { }
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
        console.error('List products by brand error:', err)
        res.status(500).json({ error: 'Server error' });
    }
});

// Product details (specific ID) - Must come after specific paths like /category or /brand to avoid collision if they were ambiguous, but here they are prefixed.
// However, /products/:id matches /products/category. So logic in index.js had them separate. 
// In products router:
// / (list)
// /category/:category
// /brand/:brand
// /:id 
// So /category matches /:id if not careful.
// Express matches top-down. So define specifics first.
router.get('/:id', async (req, res) => {
    try {
        const headerUserId = (req.header('x-user-id') || '').trim();
        let sellerId = '';
        const { id } = req.params;

        // Safety check: if ID is "category" or "brand", pass (next()?) or assume caught by upper routes?
        // In Express, if I define /category/:cat BEFORE /:id, and request /category/foo, it hits first match.
        // So order matters.

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

        let discounts = []
        try { discounts = await Discount.find({ userId: sellerId }).lean() } catch { }
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
        // If param is not ObjectId, Mongoose throws.
        // If it fell through from /category (unlikely due to order), it would be string
        res.status(400).json({ error: 'Bad id or not found' });
    }
});

export default router;
