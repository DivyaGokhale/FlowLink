import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';
import Shop from '../models/Shop.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

const router = express.Router();
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'HS9Yf7yCJ3Zc6MSIFDa3oOlN1Wl1';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

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

// List orders (Filtered by logged in User)
router.get('/', async (req, res) => {
    try {
        const headerUserId = req.header('x-user-id');
        const authHeader = req.header('authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

        if (!token) return res.status(401).json({ error: 'Authentication required' });

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const requestingUserId = decoded.sub; // The logged-in user

        const { page = 1, limit = 10, status, view } = req.query;
        console.log('GET /orders request:', { query: req.query, requestingUserId });

        // 1. Determine Context (Shop ID / Seller ID)
        const isAdmin = String(requestingUserId) === String(ADMIN_USER_ID);

        console.log('DEBUG ADMIN CHECK:', {
            requestingUserId,
            ADMIN_USER_ID,
            isAdmin,
            headerUserId: req.header('x-user-id')
        });

        // NEW: Check for Customer View Mode
        if (view === 'customer') {
            const user = await User.findOne({ id: requestingUserId });
            if (!user) {
                console.log('User not found for ID:', requestingUserId);
                return res.status(401).json({ error: 'User not found' });
            }

            // In customer view, we filter ONLY by their email as customer
            // We do NOT filter by userId (Seller ID) here
            const filter = { customerEmail: user.email };
            console.log('Customer View Mode. Filter:', filter);

            if (status) {
                filter['payment.status'] = status;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const orders = await Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            console.log(`Found ${orders.length} orders for customer ${user.email}`);

            const total = await Order.countDocuments(filter);

            return res.json({
                success: true,
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        }

        // Standard Seller/Shop Context Mode
        const contextSellerId = headerUserId ? String(headerUserId) : (isAdmin ? requestingUserId : null);

        if (!contextSellerId) {
            return res.status(400).json({ error: 'Shop context required (x-user-id)' });
        }

        let filter = { userId: contextSellerId };

        // 2. Security & Smart Context
        if (String(requestingUserId) === String(contextSellerId)) {
            // Case A: User is viewing their own "context" (Self-Test or Global View)
            // We want to show orders where they are the SELLER OR the BUYER
            const user = await User.findOne({ id: requestingUserId });
            if (user) {
                filter = {
                    $or: [
                        { userId: contextSellerId },        // I am the Seller
                        { customerEmail: user.email }       // I am the Customer
                    ]
                };
                console.log('Smart Query (Sales + Purchases) for:', user.email);
            }
        } else if (!isAdmin) {
            // Case B: User is viewing someone else's shop (as a Customer)
            // They should ONLY see their own orders in that shop
            const user = await User.findOne({ id: requestingUserId });
            if (!user) return res.status(401).json({ error: 'User not found' });

            filter.customerEmail = user.email;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (status) {
            // Apply status filter key if present (works with $or)
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

// Create Order
router.post('/', [
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
        // 1. Determine the Seller ID (Shop Owner)
        // PRIORITIZE validating the 'shop' query param if present, as this is the robust way.
        // Fallback to 'x-user-id' only if 'shop' is missing (Legacy/Admin direct calls).
        let sellerId = '';
        const { shop } = req.query;

        if (shop) {
            const s = await Shop.findOne({ slug: String(shop).toLowerCase() }).lean();
            if (s) sellerId = String(s.userId);
        }

        if (!sellerId) {
            // Legacy/Fallback: functionality for direct API calls or Admin where header is Seller ID
            sellerId = (req.header('x-user-id') || '').trim();
        }

        if (!sellerId) return res.status(400).json({ error: 'Shop context required (provide ?shop=slug or x-user-id header)' });

        const { items, totals, payment, shippingAddress, customerEmail, customerName } = req.body || {};

        // Normalize and validate shipping
        const ship = (shippingAddress && typeof shippingAddress === 'object') ? shippingAddress : {};

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
        const findFilter = { userId: String(sellerId) };
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
                userId: String(sellerId),
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
                String(a.line1 || '') === String(addr.line1) &&
                String(a.postalCode || '') === String(addr.postalCode) &&
                String(a.city || '') === String(addr.city)
            );
            const addresses = Array.from(customerDoc.addresses || []);
            if (!hasSameAddr) addresses.unshift({ ...addr, isDefault: !addresses.length });
            await Customer.updateOne({ _id: customerDoc._id }, { $set: { ...update, addresses } });
        }

        const order = await Order.create({
            sellerId: String(sellerId),
            userId: String(sellerId),
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

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order,  // Include the created order in the response
            orderId: order._id.toString(),
            id: order._id.toString(),
            ...order.toObject()
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single order
router.get('/:orderId', async (req, res) => {
    try {
        const authHeader = req.header('authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        let requestingUserId = null;
        if (token) {
            try { requestingUserId = jwt.verify(token, JWT_SECRET).sub; } catch { }
        }

        const { orderId } = req.params;
        if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Check permissions
        // 1. Is Admin?
        const isAdmin = String(requestingUserId) === String(ADMIN_USER_ID);

        // 2. Is Shop Owner?
        const isOwner = String(order.userId) === String(requestingUserId);

        // 3. Is Customer?
        let isCustomer = false;
        if (requestingUserId) {
            // Check Explicit Customer ID link (New Method)
            if (order.customerId && String(order.customerId) === String(requestingUserId)) {
                isCustomer = true;
            } else {
                // Fallback: Check Email link (Old Method)
                const user = await User.findOne({ id: requestingUserId });
                if (user) {
                    const uEmail = String(user.email || '').toLowerCase();
                    const cEmail = String(order.customerEmail || '').toLowerCase();
                    if (uEmail && uEmail === cEmail) {
                        isCustomer = true;
                    }
                }
            }
        }

        if (!isAdmin && !isOwner && !isCustomer) {
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

// Update order (Admin/Owner only usually, but maybe customer can cancel?)
router.patch('/:orderId', async (req, res) => {
    try {
        const authHeader = req.header('authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!token) return res.status(401).json({ error: 'Authentication required' });

        let requestingUserId;
        try { requestingUserId = jwt.verify(token, JWT_SECRET).sub; } catch { return res.status(401).json({ error: 'Invalid token' }); }

        const { orderId } = req.params;
        const updateData = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const isAdmin = String(requestingUserId) === String(ADMIN_USER_ID);
        const isOwner = String(order.userId) === String(requestingUserId);

        let isCustomer = false;
        if (requestingUserId) {
            if (order.customerId && String(order.customerId) === String(requestingUserId)) {
                isCustomer = true;
            } else {
                const user = await User.findOne({ id: requestingUserId });
                if (user) {
                    const uEmail = String(user.email || '').toLowerCase();
                    const cEmail = String(order.customerEmail || '').toLowerCase();
                    if (uEmail && uEmail === cEmail) {
                        isCustomer = true;
                    }
                }
            }
        }

        if (!isAdmin && !isOwner && !isCustomer) {
            return res.status(403).json({ error: 'Access denied' });
        }

        Object.assign(order, updateData);
        await order.save();

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

export default router;
