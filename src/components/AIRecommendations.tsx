import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Skeleton from './ui/Skeleton';
import { formatPrice } from '../lib/utils';

interface Product {
    _id: string;
    name: string;
    price: number;
    image?: string;
    reason?: string; // AI reason for recommendation
}

interface AIRecommendationsProps {
    currentProduct: { _id: string; name: string; category?: string; description?: string };
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ currentProduct }) => {
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { shop } = useParams<{ shop?: string }>();

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";
                const res = await fetch(`${baseUrl}/recommendations/combo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product: {
                            id: currentProduct._id,
                            name: currentProduct.name,
                            category: currentProduct.category,
                            description: currentProduct.description
                        }
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    setRecommendations(data.recommendations || []);
                }
            } catch (error) {
                console.error("Failed to fetch AI recommendations", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentProduct._id) {
            fetchRecommendations();
        }
    }, [currentProduct._id]);

    if (loading) {
        return (
            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">✨</span>
                    <h3 className="text-lg font-semibold text-indigo-900">AI Curated Combos</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full rounded-xl bg-white/50" />
                    <Skeleton className="h-24 w-full rounded-xl bg-white/50" />
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">✨</span>
                <h3 className="text-lg font-semibold text-indigo-900">Perfectly Pairs With</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendations.map((item, idx) => (
                    <Link
                        key={item._id || idx}
                        to={`${shop ? `/${shop}` : ""}/product/${item._id}`}
                        className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="h-16 w-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                            <img
                                src={item.image || '/placeholder.jpg'}
                                alt={item.name}
                                className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                            />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {item.name}
                            </h4>
                            <p className="text-xs text-green-600 font-semibold mt-0.5">{formatPrice(item.price)}</p>
                            {item.reason && (
                                <p className="text-[10px] text-gray-500 mt-1 leading-tight italic">
                                    "{item.reason}"
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AIRecommendations;
