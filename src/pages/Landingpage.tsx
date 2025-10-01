// pages/Landingpage.tsx
import React, { Suspense, lazy } from "react";
import Header from "../components/Header";
import DiscountBanner from "../components/DiscountBanner";
import ProductShowcase from "../components/ProductShowcase";
import CategorySection from "../components/CategorySection";
import Footer from "@/components/Footer";

// Lazy-load non-critical sections (below-the-fold)
const FeaturedProducts = lazy(() => import("../components/FeaturedProducts"));
const HowItWorks = lazy(() => import("../components/HowItWorks"));
const Testimonials = lazy(() => import("../components/Testimonials"));
const PaymentOptions = lazy(() => import("../components/PaymentOptions"));


const Landingpage: React.FC = () => {
  return (
    <>
      <Header />
      <DiscountBanner />
      <ProductShowcase />
      <CategorySection />
      <Suspense fallback={<div className="px-6 py-8 text-sm text-gray-500">Loading featured products…</div>}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={<div className="px-6 py-8 text-sm text-gray-500">Loading how it works…</div>}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={<div className="px-6 py-8 text-sm text-gray-500">Loading testimonials…</div>}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<div className="px-6 py-8 text-sm text-gray-500">Loading payment options…</div>}>
        <PaymentOptions />
      </Suspense>
      <Footer />
    </>
  );
};

export default Landingpage;
