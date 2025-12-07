import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    title: { type: String, required: true },
    description: String,
    bannerUrl: String,
    status: { type: String, default: 'Active' },
    startsAt: Date,
    endsAt: Date,
    productIds: { type: [String], default: undefined }
}, { timestamps: true });

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);
export default Offer;
