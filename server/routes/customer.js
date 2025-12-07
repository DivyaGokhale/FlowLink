import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Shop from '../models/Shop.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'HS9Yf7yCJ3Zc6MSIFDa3oOlN1Wl1';

// Middleware to authenticate
const authenticate = async (req, res, next) => {
    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findOne({ id: decoded.sub });
        if (!req.user) return res.status(401).json({ error: 'User not found' });
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// GET /profile - Get logged in user profile (name, email, addresses)
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const headerUserId = req.header('x-user-id');
        const isAdmin = String(user.id) === String(ADMIN_USER_ID);

        let sellerId = headerUserId ? String(headerUserId) : null;
        if (!sellerId && !isAdmin) {
            // Logic to infer seller/shop context if missing
        }

        const response = {
            id: user.id,
            name: user.name,
            email: user.email,
            addresses: []
        };

        if (sellerId) {
            const customer = await Customer.findOne({
                userId: sellerId,
                email: user.email
            }).lean();

            if (customer) {
                response.addresses = customer.addresses || [];
                response.phone = customer.phoneNumber;
            }
        }

        res.json(response);

    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /addresses - Get addresses
router.get('/addresses', authenticate, async (req, res) => {
    try {
        const { shop } = req.query;
        let sellerId = (req.header('x-user-id') || '').trim();

        if (!sellerId && shop) {
            const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
            if (s) sellerId = String(s.userId);
        }

        if (!sellerId) return res.status(400).json({ error: 'Shop context required' });

        const customer = await Customer.findOne({
            userId: sellerId,
            email: req.user.email
        }).lean();

        res.json(customer?.addresses || []);
    } catch (err) {
        console.error('Get addresses error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /addresses - Add new address
router.post('/addresses', authenticate, async (req, res) => {
    try {
        const { shop } = req.query;
        let sellerId = (req.header('x-user-id') || '').trim();
        console.log(`[POST Address] Shop: ${shop}, SellerId Header: ${sellerId}`);

        if (!sellerId && shop) {
            const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
            if (s) sellerId = String(s.userId);
            console.log(`[POST Address] Resolved SellerID from Shop: ${sellerId}`);
        }
        if (!sellerId) return res.status(400).json({ error: 'Shop context required' });

        const newAddress = req.body;
        // Ensure ID
        if (!newAddress.id) {
            newAddress.id = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Find or Create Customer
        let customer = await Customer.findOne({ userId: sellerId, email: req.user.email });
        if (!customer) {
            customer = new Customer({
                userId: sellerId,
                email: req.user.email,
                firstName: req.user.name || 'Guest',
                status: 'Active',
                addresses: []
            });
        }

        // Handle Default logic
        if (newAddress.isDefault) {
            customer.addresses.forEach(a => a.isDefault = false);
        } else if (customer.addresses.length === 0) {
            newAddress.isDefault = true;
        }

        customer.addresses.push(newAddress);
        await customer.save();

        res.status(201).json(newAddress);
    } catch (err) {
        console.error('Add address error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /addresses/:id - Update address
router.put('/addresses/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { shop } = req.query;
        let sellerId = (req.header('x-user-id') || '').trim();

        console.log(`[PUT Address] ID: ${id}, Shop: ${shop}, SellerId Header: ${sellerId}`);

        if (!sellerId && shop) {
            const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
            if (s) sellerId = String(s.userId);
            console.log(`[PUT Address] Resolved SellerID from Shop: ${sellerId}`);
        }
        if (!sellerId) {
            console.error('[PUT Address] Missing Shop Context');
            return res.status(400).json({ error: 'Shop context required' });
        }

        const customer = await Customer.findOne({ userId: sellerId, email: req.user.email });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const addrIndex = customer.addresses.findIndex(a => a.id === id || a._id?.toString() === id);
        if (addrIndex === -1) return res.status(404).json({ error: 'Address not found' });

        // Handle Default swap
        if (updates.isDefault) {
            customer.addresses.forEach(a => a.isDefault = false);
        }

        // Merge updates
        const oldAddr = customer.addresses[addrIndex].toObject ? customer.addresses[addrIndex].toObject() : customer.addresses[addrIndex];
        customer.addresses[addrIndex] = { ...oldAddr, ...updates, id: oldAddr.id }; // Preserve ID

        await customer.save();
        res.json(customer.addresses[addrIndex]);

    } catch (err) {
        console.error('Update address error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /addresses/:id - Delete address
router.delete('/addresses/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { shop } = req.query;
        let sellerId = (req.header('x-user-id') || '').trim();
        if (!sellerId && shop) {
            const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
            if (s) sellerId = String(s.userId);
        }
        if (!sellerId) return res.status(400).json({ error: 'Shop context required' });

        const customer = await Customer.findOne({ userId: sellerId, email: req.user.email });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const initialLen = customer.addresses.length;
        customer.addresses = customer.addresses.filter(a => a.id !== id && a._id?.toString() !== id);

        if (customer.addresses.length === initialLen) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // If we deleted the default, make first one default
        if (customer.addresses.length > 0 && !customer.addresses.some(a => a.isDefault)) {
            customer.addresses[0].isDefault = true;
        }

        await customer.save();
        res.json({ success: true });

    } catch (err) {
        console.error('Delete address error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
