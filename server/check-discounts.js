import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://FlowLink:FlowLink8550@flowlink.wlohsvp.mongodb.net/?retryWrites=true&w=majority&appName=FlowLink';

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

const Discount = mongoose.model('Discount', discountSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const discounts = await Discount.find({});
        console.log('Found', discounts.length, 'discounts');

        discounts.forEach(d => {
            console.log('--------------------------------------------------');
            console.log(`ID: ${d._id}`);
            console.log(`Method: ${d.method}`);
            console.log(`Type: ${d.type}`);
            console.log(`Amount: ${d.amount}`);
            console.log(`Status: ${d.status}`);
            console.log(`Code: ${d.code}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
