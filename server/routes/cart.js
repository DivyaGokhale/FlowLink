import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';

const router = express.Router();

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

// Add item
router.post('/add', [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    handleValidationErrors
], async (req, res) => {
    try {
        const userId = req.header('x-user-id');
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const { productId, quantity } = req.body;

        const product = await Product.findById(productId).lean();
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // For now, we'll store cart in session/memory or just reflect it back
        // The existing implementation was stateless/mock

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

// Get items
router.get('/', async (req, res) => {
    try {
        const userId = req.header('x-user-id');
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

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

export default router;
