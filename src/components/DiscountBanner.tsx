import React from "react";
import { useNavigate } from "react-router-dom";

const DiscountBanner = () => {
  const navigate = useNavigate();
  return (
  <section className="relative w-full overflow-hidden py-12 bg-gradient-hero">
    {/* Decorative blobs */}
    <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[hsl(var(--primary))/0.08] blur-2xl" />
    <div className="pointer-events-none absolute bottom-0 -right-10 w-56 h-56 rounded-full bg-[hsl(var(--primary))/0.08] blur-2xl" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-6 md:gap-10">
      {/* Left section: Text & CTA */}
      <div className="flex-1 min-w-0 text-left animate-fade-in-up">
        <h2 className="text-3xl sm:text-4xl font-semibold mb-3 text-gray-900">
          Get <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">10% OFF</span> on your first order
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6">
          Fresh groceries delivered fast. Hand-picked quality at the best prices.
        </p>
        <button onClick={() => navigate('/shop')} className="inline-flex items-center justify-center bg-[hsl(var(--primary))] hover:brightness-95 text-white text-sm sm:text-base font-medium rounded-full px-6 sm:px-8 py-3 shadow-button transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/30 active:scale-[0.99]">
          Shop Now
          <svg className="ml-2" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Right section: Promo image */}
      <div className="w-full md:w-auto md:basis-[420px] md:shrink-0 flex justify-start">
        <img
          src="/assets/teatime.png"
          alt="Tea Time Bakes Promo"
          className="w-full max-w-xl sm:max-w-3xl h-64 sm:h-48 rounded-2xl shadow-card animate-float"
        />
      </div>
    </div>
  </section>
  );
}

export default DiscountBanner;
