import express from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';

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

// Verify payment
router.post('/verify', [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('signature').notEmpty().withMessage('Payment signature is required'),
    handleValidationErrors
], async (req, res) => {
    try {
        const userId = req.header('x-user-id');
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const { orderId, paymentId, signature } = req.body;

        const order = await Order.findOne({ _id: orderId, userId }).lean();
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Verify payment signature (implement based on your payment gateway)
        const isValidPayment = true; // Replace with actual verification logic for Razorpay usually here

        if (isValidPayment) {
            await Order.updateOne(
                { _id: orderId },
                {
                    $set: {
                        'payment.status': 'Completed',
                        'payment.transactionId': paymentId
                    }
                }
            );

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

export default router;
