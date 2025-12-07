import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    title: String,
    description: String,
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    status: { type: String, default: 'Active' },
    category: String,
    images: [String]
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
