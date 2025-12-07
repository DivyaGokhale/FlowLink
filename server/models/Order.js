import mongoose from 'mongoose';

// Address subdocument used for shipping/billing
export const addressSchema = new mongoose.Schema({
    id: String, // Explicit ID for customer address management
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
    email: String,
    label: { type: String, default: 'shipping' },
    isDefault: { type: Boolean, default: false }
});

const orderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    sellerId: { type: String, index: true }, // Explicit seller ID
    userId: { type: String, required: true }, // who owns/sees this order (admin id for dashboard)
    customerId: { type: String },
    customerName: { type: String },
    customerEmail: { type: String },
    items: { type: [orderItemSchema], default: [] },
    shippingAddress: { type: addressSchema, default: undefined },
    totals: {
        subtotal: { type: Number, default: 0 },
        gst: { type: Number, default: 0 },
        delivery: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
    },
    payment: {
        method: { type: String, default: 'unknown' },
        status: { type: String, default: 'Pending' },
        transactionId: { type: String, default: '' },
    },
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
