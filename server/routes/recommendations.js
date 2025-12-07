import { Router } from 'express';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const router = Router();

// Initialize ChatOpenAI with OpenRouter
const chat = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
    modelName: "openai/gpt-3.5-turbo", // Cost-effective model
    temperature: 0.7,
});

router.post('/combo', async (req, res) => {
    try {
        const { product } = req.body;

        if (!product || !product.name) {
            return res.status(400).json({ error: 'Product data required' });
        }

        const systemPrompt = `You are an expert e-commerce merchandising AI. 
    Your goal is to suggest 2-3 complimentary products that form a perfect "combo" with the given product.
    Return ONLY a JSON array of objects. Each object must have:
    - name: string (creative name for the suggested product)
    - price: number (estimated price in INR)
    - reason: string (short, catchy reason why it pairs well, max 10 words)
    - category: string (category of the suggested product)
    
    Do not include any markdown formatting or explanations outside the JSON.`;

        const userPrompt = `Suggest combos for:
    Product: ${product.name}
    Category: ${product.category || 'General'}
    Description: ${product.description || ''}`;

        const response = await chat.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
        ]);

        let content = response.content;
        // Clean up markdown if present
        if (content.startsWith('```json')) {
            content = content.replace(/```json\n?/, '').replace(/```$/, '');
        }

        const recommendations = JSON.parse(content);

        // Add placeholder images based on category (simple heuristic)
        const enhancedRecs = recommendations.map(rec => ({
            ...rec,
            _id: Math.random().toString(36).substr(2, 9), // Temporary ID for navigation
            image: '/placeholder.jpg' // In a real app, we'd search our DB for matching products
        }));

        res.json({ recommendations: enhancedRecs });

    } catch (error) {
        console.error('AI Recommendation error:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

export default router;
