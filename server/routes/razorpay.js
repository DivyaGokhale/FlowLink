import { Router } from 'express';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env
config({ path: resolve(__dirname, '../../.env') });

console.log('Razorpay route module loaded. Environment:', {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? '[SET]' : '[MISSING]',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? '[SET]' : '[MISSING]'
});

const router = Router();

// Initialize Razorpay
console.log('Initializing Razorpay with config:', {
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET ? '****' : undefined
});

// Initialize Razorpay only if credentials are available
let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('Razorpay initialized successfully');
} catch (err) {
  console.error('Failed to initialize Razorpay:', err);
}

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    console.log('Received create-order request:', req.body);
    console.log('Razorpay config check:', {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
    });
    
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'Missing request body'
      });
    }
    
    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    if (!amount || isNaN(amount)) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing amount'
      });
    }
    
    console.log('Creating order with options:', {
      amount,
      currency,
      receipt,
      notes
    });

    const options = {
      amount: Math.round(amount), // amount in smallest currency unit (paise)
      currency,
      receipt,
      notes,
      payment_capture: 1
    };

    if (!razorpay) {
      console.error('Razorpay not initialized');
      return res.status(500).json({
        success: false,
        error: 'Payment gateway not configured'
      });
    }
    
    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);
    
    res.json({
      success: true,
      order_id: order.id,
      data: order
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    
    // Check if it's a Razorpay API error
    if (error.error) {
      console.error('Razorpay API error details:', error.error);
      return res.status(400).json({
        success: false,
        error: error.error.description || error.message,
        code: error.error.code
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
});

// Verify Razorpay Payment
router.post('/verify-payment', (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;
    
    // Verify the payment signature
    const text = order_id + '|' + payment_id;
    const generated_signature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    if (generated_signature === signature) {
      res.json({
        success: true,
        verified: true,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid payment signature'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      verified: false,
      error: error.message || 'Payment verification failed'
    });
  }
});

export default router;