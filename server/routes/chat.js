import express from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import CustomerChat from '../models/CustomerChat.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';

const router = express.Router();

// Initialize the model with OpenRouter configuration
const model = new ChatOpenAI({
    modelName: 'openai/gpt-3.5-turbo', // OpenRouter model ID
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'FlowLink',
        },
    },
    temperature: 0.7,
});

// System prompt to restrict context to FlowLink project
const SYSTEM_TEMPLATE = `You are a helpful and friendly AI customer support assistant for FlowLink, an online shopping platform. 🛍️
Your goal is to assist customers with their shopping experience 24/7.

You must be able to communicate fluently in English, Hindi (हिंदी), and Marathi (मराठी).
Detect the user's language and respond in the same language.

IMPORTANT: You are a CUSTOMER SUPPORT agent, NOT an admin assistant.
Your scope is limited to the "Customer View" of the application.

✅ WHAT YOU CAN HELP WITH (Customer Context):
- **Finding Products**: Guide users to the search bar at the top or the 'Shop' page. Tell them they can search for "rice", "sugar", "oil", etc.
- **Shopping**: How to add items to cart, viewing the cart, and checking out.
- **Payments**: Explain that they can pay online (Razorpay) or use Cash on Delivery (COD). If a payment fails, suggest retrying or checking their connection.
- **Orders**: Tracking order status (Pending, Shipped, Delivered) in the 'Orders' page. The user's recent orders are provided below.
- **Account**: Managing addresses, profile settings, and changing passwords.

🚫 WHAT YOU CANNOT HELP WITH (Admin Context - DO NOT DISCUSS):
- Do not answer questions about adding/editing products.
- Do not discuss inventory management, sales reports, or analytics.
- Do not help with admin dashboard features.

Tone:
- Human-centric, natural, polite, and empathetic.
- Focus on service (helping them shop, resolve issues).
- Use emojis to be friendly! 😊

Instructions:
- If the user asks for help finding a product, guide them to use the search bar or browse categories.
- If they have payment issues, suggest checking their internet or trying a different method.
- If they want to check an order status, check the "User Personal Context" below and provide details if available.
- At the end of your response, suggest 2-3 short follow-up questions relevant to the context.

Current User Context:
User ID: {userId}

User Personal Context (Orders, Addresses, etc.):
{customerContext}

Please answer the user's question based on this context.`;

const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_TEMPLATE],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
]);

const outputParser = new StringOutputParser();
const chain = prompt.pipe(model).pipe(outputParser);

console.log('Chat router loaded (Customer)');

// Get chat history for a user
router.get('/history', async (req, res) => {
    console.log('GET /history hit'); // Debug log
    try {
        const userId = req.get('x-user-id') || 'unknown';
        let chat = await CustomerChat.findOne({ userId });

        if (!chat) {
            return res.json({ messages: [] });
        }

        // Return messages mapped to frontend format
        const formattedMessages = chat.messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        res.json({ messages: formattedMessages });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.get('x-user-id') || 'unknown';

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Fetch user context if logged in
        let customerContext = "User is guest or not logged in.";
        if (userId && userId !== 'guest' && userId !== 'unknown') {
            try {
                const user = await User.findOne({ id: userId }).lean();
                if (user && user.email) {
                    const email = user.email;

                    // Fetch recent orders
                    const orders = await Order.find({ customerEmail: email })
                        .sort({ createdAt: -1 })
                        .limit(3)
                        .lean();

                    const orderStr = orders.length > 0
                        ? orders.map(o => `- Order #${o._id.toString().slice(-6)}: ${o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')} | Status: ${o.payment.status} | Total: ₹${o.totals.total}`).join('\n')
                        : "No recent orders.";

                    // Fetch addresses (from Customer records)
                    const customers = await Customer.find({ email: email }).lean();
                    const addresses = customers.flatMap(c => c.addresses || []).slice(0, 3);
                    const addrStr = addresses.length > 0
                        ? addresses.map(a => `- ${a.line1}, ${a.city} ${a.postalCode}`).join('\n')
                        : "No saved addresses.";

                    customerContext = `
Name: ${user.name}
Email: ${user.email}
Recent Orders:
${orderStr}

Saved Addresses:
${addrStr}
`;
                }
            } catch (err) {
                console.error("Error fetching customer context:", err);
            }
        }

        // Fetch or create chat history
        let chat = await CustomerChat.findOne({ userId });
        if (!chat) {
            chat = new CustomerChat({ userId, messages: [] });
        }

        // Convert stored messages to LangChain format (last 10 for context)
        const history = chat.messages.slice(-10).map(m =>
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
        );

        const response = await chain.invoke({
            input: message,
            userId: userId,
            customerContext: customerContext,
            history: history
        });

        // Save new messages to DB
        chat.messages.push({ role: 'user', content: message });
        chat.messages.push({ role: 'assistant', content: response });
        await chat.save();

        res.json({ reply: response });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

export default router;
