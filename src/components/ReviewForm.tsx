import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import Spinner from './ui/Spinner';

interface ReviewFormProps {
    productId: string;
    onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onReviewSubmitted }) => {
    const { isAuthenticated, token } = useAuth();
    const { showToast } = useToast();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            showToast('Please login to write a review');
            return;
        }

        setSubmitting(true);
        try {
            const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";
            const res = await fetch(`${baseUrl}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId, rating, comment })
            });

            if (res.ok) {
                showToast('Review submitted successfully!');
                setComment('');
                setRating(5);
                onReviewSubmitted();
            } else {
                const err = await res.json();
                showToast(err.error || 'Failed to submit review');
            }
        } catch (error) {
            showToast('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="bg-gray-50 p-4 rounded-xl text-center">
                <p className="text-gray-600 text-sm">Please login to write a review.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl focus:outline-none transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent outline-none transition"
                    placeholder="What did you like or dislike?"
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[hsl(var(--primary))] text-white py-2 rounded-lg font-medium hover:brightness-95 transition disabled:opacity-70 flex justify-center"
            >
                {submitting ? <Spinner size="sm" variant="secondary" /> : 'Submit Review'}
            </button>
        </form>
    );
};

export default ReviewForm;
