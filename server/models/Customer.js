import mongoose from 'mongoose';
import { addressSchema } from './Order.js';

// Customer model (aligned with admin service minimal fields; includes addresses array)
const customerSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    firstName: String,
    lastName: String,
    language: String,
    email: { type: String, index: true },
    phoneCountry: String,
    phoneNumber: { type: String, index: true },
    marketingEmails: Boolean,
    marketingSMS: Boolean,
    collectTax: String,
    notes: String,
    tags: String,
    status: { type: String, default: 'Active' },
    addresses: { type: [addressSchema], default: [] }
}, { timestamps: true });

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export default Customer;
