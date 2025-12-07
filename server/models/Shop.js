import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    slug: { type: String, required: true },
    name: String,
    description: String,
    logo: String,
    cover: String,
    status: { type: String, default: 'Active' },
    createdAt: { type: Date, default: () => new Date() },
}, { timestamps: true });
// Ensure a user cannot create duplicate slugs; allow same slug across different users
shopSchema.index({ userId: 1, slug: 1 }, { unique: true });

const Shop = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
export default Shop;
