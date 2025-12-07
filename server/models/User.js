import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, index: true }, // uuid v4 for app-facing id
    sellerId: { type: String, index: true }, // maps to Shop.userId
    name: { type: String, default: '' },
    email: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true },
    // Indicates how this user was created (e.g., 'provision' from admin)
    source: { type: String, default: '' },
    createdAt: { type: Date, default: () => new Date() },
}, { timestamps: true });
// Unique per shop
userSchema.index({ sellerId: 1, email: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
