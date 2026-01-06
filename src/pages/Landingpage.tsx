// pages/Landingpage.tsx
import React, { Suspense, lazy, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductShowcase from "../components/ProductShowcase";
import Skeleton from "../components/ui/Skeleton";
import TopBrandsSection from "@/components/TopBrandsSection";
import { motion } from "framer-motion";

// Lazy-load non-critical sections (below-the-fold)
const FeaturedProducts = lazy(() => import("../components/FeaturedProducts"));
const HowItWorks = lazy(() => import("../components/HowItWorks"));
const Testimonials = lazy(() => import("../components/Testimonials"));
const PaymentOptions = lazy(() => import("../components/PaymentOptions"));

const Landingpage: React.FC = () => {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreCategoriesRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<NodeJS.Timeout>();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (moreCategoriesRef.current && !moreCategoriesRef.current.contains(event.target as Node)) {
        setIsMoreCategoriesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Offers data
  const offers = [
    { id: 1, image:"/offers/offer.jpg", alt: "Saturday Special-20% off on Wheat and Rice"  },
    { id: 2, image:"/offers/fresh.jpg", alt: "Fresh Daily Essentials from your local store"},
    { id: 3, image: "/offers/pickup.jpg", alt: "Order Online,Pickup Nearby" }
  ]
  // Auto-slide functionality for offers
  useEffect(() => {
    sliderRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === offers.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => {
      if (sliderRef.current) clearInterval(sliderRef.current);
    };
  }, [offers.length]);

  // Smooth-scroll to featured products when hash is #deals.
  useEffect(() => {
    if (hash !== "#deals") return;
    const tryScroll = () => {
      const el = document.getElementById("deals");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };
    if (tryScroll()) return;
    let attempts = 0;
    const id = window.setInterval(() => {
      if (tryScroll() || attempts++ > 25) {
        window.clearInterval(id);
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [hash]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Enhanced Hero Section */}
        <motion.section 
          className="relative w-full bg-gradient-to-b from-white to-emerald-50 overflow-hidden pt-4 pb-8 md:pt-6 md:pb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center">
              <motion.div 
                className="w-full max-w-6xl h-[28rem] md:h-[32rem] overflow-hidden rounded-2xl relative shadow-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 z-10 rounded-2xl pointer-events-none" />
                <video 
                  src="/banner_video.mp4" 
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-xl"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>
        {/* Enhanced Offers Section */}
        <motion.section 
          className="w-full bg-white py-12 md:py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="inline-block text-sm font-semibold text-emerald-600 mb-2">LIMITED TIME OFFERS</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Special Deals Just For You</h2>
              <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full" />
            </motion.div>

            <div className="relative group">
              {/* Navigation Arrows */}
              <motion.button
                onClick={() => {
                  setCurrentSlide(prev => Math.max(0, prev - 1));
                  if (sliderRef.current) clearInterval(sliderRef.current);
                  sliderRef.current = setInterval(() => {
                    setCurrentSlide(prev => (prev === offers.length - 1 ? 0 : prev + 1));
                  }, 5000);
                }}
                disabled={currentSlide === 0}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-all duration-300 transform hover:scale-110 disabled:opacity-0 disabled:pointer-events-none group-hover:opacity-100 opacity-0"
                aria-label="Previous slide"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </motion.button>
              
              <div className="overflow-hidden rounded-2xl">
                <div 
                  className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {offers.map((offer, index) => (
                    <motion.div 
                      key={offer.id} 
                      className="w-full flex-shrink-0 px-1.5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: currentSlide === index ? 1 : 0.7,
                        y: 0,
                        scale: currentSlide === index ? 1 : 0.98
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <img 
                          src={offer.image} 
                          alt={offer.alt} 
                          className="w-full h-[28rem] object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <motion.h3 
                            className="text-2xl font-bold mb-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            {offer.alt}
                          </motion.h3>
                          <motion.p 
                            className="text-emerald-200 font-medium"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            Special Offer {index + 1}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <motion.button
                onClick={() => {
                  setCurrentSlide(prev => (prev === offers.length - 1 ? prev : prev + 1));
                  if (sliderRef.current) clearInterval(sliderRef.current);
                  sliderRef.current = setInterval(() => {
                    setCurrentSlide(prev => (prev === offers.length - 1 ? 0 : prev + 1));
                  }, 5000);
                }}
                disabled={currentSlide === offers.length - 1}
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-all duration-300 transform hover:scale-110 disabled:opacity-0 disabled:pointer-events-none group-hover:opacity-100 opacity-0"
                aria-label="Next slide"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </motion.button>

              {/* Navigation Dots */}
              <motion.div 
                className="flex justify-center mt-10 space-x-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {offers.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setCurrentSlide(index);
                      if (sliderRef.current) clearInterval(sliderRef.current);
                      sliderRef.current = setInterval(() => {
                        setCurrentSlide(prev => (prev === offers.length - 1 ? 0 : prev + 1));
                      }, 5000);
                    }}
                    className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                      currentSlide === index 
                        ? 'bg-emerald-500 scale-125' 
                        : 'bg-gray-200 hover:bg-emerald-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {currentSlide === index && (
                      <motion.span 
                        className="absolute inset-0 bg-emerald-500 rounded-full"
                        layoutId="activeDot"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>
        <Suspense
          fallback={
            <section className="w-full max-w-7xl mx-auto px-6 py-6 text-center animate-fade-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mt-1 mb-3">Featured Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-card p-3">
                    <Skeleton className="w-full h-32 rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mt-3" />
                    <Skeleton className="h-3 w-1/2 mt-1" />
                    <Skeleton className="h-9 w-full mt-3 rounded-full" />
                  </div>
                ))}
              </div>
            </section>
          }
        >
          <FeaturedProducts />
        </Suspense>
        
        <Suspense
          fallback={
            <section className="w-full max-w-7xl mx-auto px-6 py-6 text-center animate-fade-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mt-1 mb-3">What Clients Say</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg p-5">
                    <Skeleton className="w-20 h-20 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-3/4 mt-3 mx-auto" />
                    <Skeleton className="h-3 w-2/3 mt-1 mx-auto" />
                  </div>
                ))}
              </div>
            </section>
          }
        >
          <Testimonials />
        </Suspense>
        <Suspense
          fallback={
            <section className="w-full py-8 bg-white text-center animate-fade-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Payment Options</h2>
              <div className="flex flex-wrap justify-center items-center gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24 rounded-md" />
                ))}
              </div>
            </section>
          }
        >
          <PaymentOptions />
        </Suspense>
      </main>
    </div>
  );
};

export default Landingpage;