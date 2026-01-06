import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

//Brand interface
interface Brand {
  id: number;
  name: string;
  logo: string;
}

// Utility: fallback emoji as image
const emojiDataUrl = (emoji: string) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='#f0f9ff'/>
        <stop offset='100%' stop-color='#e0f2fe'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='100' ry='100' fill='url(#g)'/>
    <text x='50%' y='56%' dominant-baseline='middle' text-anchor='middle' font-size='96'>${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Top brands
const brands: Brand[] = [
  { id: 1, name: "Amul", logo: "https://static.sociofyme.com/thumb/msid-99353072,width-900,height-1200,resizemode-6.cms" },
  { id: 2, name: "Tata", logo: "https://img.clevup.in/285827/1675243149439_1631207454313smpann.jpeg?width=260&height=260&format=webp" },
  { id: 3, name: "Nestle", logo: "https://crystalpng.com/wp-content/uploads/2025/03/nestle_logo.png" },
  { id: 4, name: "Britannia", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Britannia_Industries_logo.svg/1200px-Britannia_Industries_logo.svg.png" },
  { id: 5, name: "Parle", logo: "https://www.parleproducts.com/images/home_logo.webp" },
  { id: 6, name: "Fortune", logo: "https://www.fortunefoods.com/wp-content/uploads/2022/12/logo-fortune-1.png" },
  { id: 7, name: "Dabur", logo: "https://www.dabur-usa.com/assets/images/dabur_logo.png" },
  { id: 8, name: "Patanjali", logo: "https://www.patanjaliayurved.net/media/images/logo.svg" },
  { id: 9, name: "Saffola", logo: "https://www.saffola.in/images/saffola-oils-logo.png" },
  { id: 10, name: "Mother Dairy", logo: "https://pbs.twimg.com/profile_images/1786284419961044992/XTJsC67i_400x400.png" },
];

const TopBrandsSection: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Show 4 products at a time
  const visibleItems = 4;
  const maxIndex = Math.max(0, brands.length - visibleItems);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left
      nextSlide();
    } else if (touchStart - touchEnd < -50) {
      // Swipe right
      prevSlide();
    }
  };

  // Update carousel position
  useEffect(() => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.offsetWidth / visibleItems;
      carouselRef.current.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }
  }, [currentIndex, visibleItems]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCurrentIndex(0); // Reset to first slide on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section id="brands" className="w-full max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Top Brands
      </h2>
      
      <div className="relative">
        {/* Carousel Container */}
        <div 
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            ref={carouselRef}
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: 'translateX(0)' }}
          >
            {brands.map((brand) => (
              <div 
                key={brand.id} 
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleItems}%` }}
              >
                <motion.div
                  whileHover={{ 
                    y: -8,
                    scale: 1.03,
                    boxShadow: "0 20px 25px -5px rgba(34, 197, 94, 0.15), 0 10px 10px -5px rgba(34, 197, 94, 0.1)",
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full"
                >
                  <div
                    onClick={() => navigate(`${shop ? `/${shop}` : ""}/brand/${encodeURIComponent(brand.name)}`)}
                    role="button"
                    aria-label={brand.name}
                    className="group bg-white backdrop-blur border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer shadow-lg transition-all duration-300 hover:border-gray-300 hover:shadow-gray-100 h-full"
                  >
                    <div className="w-30 h-30 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 ring-2 ring-green-200 transition-all duration-300 group-hover:ring-4 group-hover:ring-green-300">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const fallback = emojiDataUrl("🏷️");
                          if (target.src !== fallback) target.src = fallback;
                        }}
                        className="w-20 h-20 object-contain bg-white rounded-lg transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <p className="mt-4 text-sm font-bold text-gray-800 text-center group-hover:text-green-700 transition-colors duration-300">
                      {brand.name}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation Arrows - Hidden on mobile */}
        <button 
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-green-500 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors duration-200 shadow-lg md:flex hidden ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          &larr;
        </button>
        <button 
          onClick={nextSlide}
          disabled={currentIndex === maxIndex}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-green-500 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors duration-200 shadow-lg md:flex hidden ${currentIndex === maxIndex ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          &rarr;
        </button>
      </div>
    </section>
  );
};

export default TopBrandsSection;