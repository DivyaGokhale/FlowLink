import express from 'express';
import mongoose from 'mongoose';
import Offer from '../models/Offer.js';
import Shop from '../models/Shop.js';

const router = express.Router();

router.get('/', async (req, res) => {
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
        const filter = { userId: sellerId, status: 'Active', $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] }
        const docs = await Offer.find(filter).sort({ createdAt: -1 }).lean()
        const active = docs.filter(o => !o.endsAt || new Date(o.endsAt).getTime() >= now.getTime())
        res.json(active)
    } catch (err) {
        console.error('List offers error:', err)
        res.status(500).json({ error: 'Server error' })
    }
});

export default router;
