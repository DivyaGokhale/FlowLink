import React from 'react';
import { motion } from 'framer-motion';

interface Review {
    _id: string;
    user: { name: string };
    rating: number;
    comment: string;
    createdAt: string;
}

interface ReviewListProps {
    reviews: Review[];
    loading?: boolean;
}

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex text-yellow-400">
        {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
                ★
            </span>
        ))}
    </div>
);

const ReviewList: React.FC<ReviewListProps> = ({ reviews, loading }) => {
    if (loading) return <div className="text-center py-4">Loading reviews...</div>;

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                <p>No reviews yet. Be the first to review this product!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <motion.div
                    key={review._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-gray-100 pb-4 last:border-0"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                {review.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{review.user.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <StarRating rating={review.rating} />
                    <p className="mt-2 text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                </motion.div>
            ))}
        </div>
    );
};

export default ReviewList;
