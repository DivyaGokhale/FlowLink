import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    method: { type: String, enum: ['code', 'auto'], default: 'code' },
    code: String,
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    amount: { type: Number, default: 0 },
    status: { type: String, default: 'Active' },
    startsAt: Date,
    endsAt: Date,
    productIds: { type: [String], default: undefined }
}, { timestamps: true });

const Discount = mongoose.models.Discount || mongoose.model('Discount', discountSchema);
export default Discount;
