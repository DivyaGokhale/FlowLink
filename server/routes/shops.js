import express from 'express';
import Shop from '../models/Shop.js';

const router = express.Router();

// Get Shop
router.get('/:slug', async (req, res) => {
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

// Upsert Shop
router.post('/', async (req, res) => {
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

export default router;
