import React from "react";

const DiscountBanner = () => (
  <section className="w-full bg-gradient-hero py-10">
    <div className="max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center gap-6 md:gap-8">
      {/* Left section: Text & CTA */}
      <div className="flex-1 min-w-0 text-left">
        <h2 className="text-3xl sm:text-4xl font-semibold mb-3 text-gray-900">
          Get 10% OFF on your first order
        </h2>
        <div className="text-base sm:text-xl text-gray-600 mb-6">
          Fresh groceries delivered fast
        </div>
        <button className="inline-flex items-center justify-center bg-[hsl(var(--primary))] hover:brightness-95 text-white text-sm sm:text-base font-medium rounded-full px-6 sm:px-8 py-3 shadow-button transition">
          Shop Now
        </button>
      </div>

      {/* Right section: Promo image */}
      <div className="w-full md:w-auto md:basis-[420px] md:shrink-0 flex justify-start">
        <img
          src="/assets/teatime.png"
          alt="Tea Time Bakes Promo"
          className="w-full max-w-xs sm:max-w-sm rounded-2xl shadow-card"
        />
      </div>
    </div>
  </section>
);

export default DiscountBanner;
