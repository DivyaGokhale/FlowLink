// pages/Landingpage.tsx
import React, { Suspense, lazy, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DiscountBanner from "../components/DiscountBanner";
import ProductShowcase from "../components/ProductShowcase";
import CategorySection from "../components/CategorySection";
import Skeleton from "../components/ui/Skeleton";
import TopBrandsSection from "@/components/TopBrandsSection";

// Lazy-load non-critical sections (below-the-fold)
const FeaturedProducts = lazy(() => import("../components/FeaturedProducts"));
const HowItWorks = lazy(() => import("../components/HowItWorks"));
const Testimonials = lazy(() => import("../components/Testimonials"));
const PaymentOptions = lazy(() => import("../components/PaymentOptions"));


const Landingpage: React.FC = () => {
  const { hash } = useLocation();

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
        {/* Hero: Amazon-like banner */}
        <section className="bg-[#232f3e]">
          <div className="w-full max-w-7xl mx-auto px-6">
            <div className="relative text-white py-6 md:py-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Everything you need, delivered fast</h1>
                  {/* <p className="text-white/80 mt-1 text-sm md:text-base">Groceries, essentials and more from  stores.</p> */}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="#categories"
                    className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm font-medium shadow-button transition"
                  >
                    Shop categories
                  </a>
                  <a
                    href="#deals"
                    className="inline-flex items-center justify-center h-10 px-4 rounded-full border-2 border-green-600 text-green-100 hover:text-white hover:bg-green-600/20 text-sm font-medium transition"
                  >
                    See today's deals
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <DiscountBanner />
        <CategorySection />
        <Suspense
          fallback={
            <section className="w-full max-w-7xl mx-auto px-6 py-10 animate-fade-in-up">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-card p-4">
                    <Skeleton className="w-full h-32 rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mt-4" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                    <Skeleton className="h-9 w-full mt-4 rounded-full" />
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
            <section className="w-full max-w-7xl mx-auto px-6 py-12 animate-fade-in-up">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white shadow-lg rounded-2xl p-6">
                    <Skeleton className="w-32 h-32 rounded-xl mx-auto" />
                    <Skeleton className="h-4 w-1/2 mt-4 mx-auto" />
                    <Skeleton className="h-3 w-3/4 mt-2 mx-auto" />
                  </div>
                ))}
              </div>
            </section>
          }
        >
          <HowItWorks />
        </Suspense>
        <Suspense
          fallback={
            <section className="w-full max-w-7xl mx-auto px-6 py-10 text-center animate-fade-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mt-2 mb-4">What Clients Say</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                    <Skeleton className="w-20 h-20 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-3/4 mt-4 mx-auto" />
                    <Skeleton className="h-3 w-2/3 mt-2 mx-auto" />
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
            <section className="w-full py-12 bg-white text-center animate-fade-in-up">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Payment Options</h2>
              <div className="flex flex-wrap justify-center items-center gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24 rounded-md" />
                ))}
              </div>
            </section>
          }
        >
          <TopBrandsSection />
        </Suspense>
      </main>
    </div>
  );
};

export default Landingpage;
