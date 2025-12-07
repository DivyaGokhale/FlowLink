import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductGalleryProps {
    images: string[];
    title: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, title }) => {
    const [selectedImage, setSelectedImage] = useState(0);
    const displayImages = images.length > 0 ? images : ['/placeholder.jpg'];

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative h-[400px] w-full max-w-xl mx-auto overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={selectedImage}
                        src={displayImages[selectedImage]}
                        alt={`${title} - View ${selectedImage + 1}`}
                        className="h-full w-full object-contain p-8"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                </AnimatePresence>

                {/* Zoom hint or badge could go here */}
            </div>

            {/* Thumbnail Strip */}
            {displayImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {displayImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${selectedImage === idx
                                ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/20'
                                : 'border-transparent hover:border-gray-300'
                                }`}
                        >
                            <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductGallery;
