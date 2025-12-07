import mongoose from 'mongoose';

const customerChatSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    messages: [{
        role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Use a distinct collection name 'CustomerChat'
const CustomerChat = mongoose.models.CustomerChat || mongoose.model('CustomerChat', customerChatSchema);

export default CustomerChat;
