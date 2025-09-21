// pages/Landingpage.tsx
import React from "react";
import Header from "../components/Header";
import CategorySection from "../components/CategorySection";
import FeaturedProducts from "../components/FeaturedProducts";
import DiscountBanner from "../components/DiscountBanner";
import ProductShowcase from "../components/ProductShowcase";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import PaymentOptions from "../components/PaymentOptions";
import Footer from "@/components/Footer";


const Landingpage: React.FC = () => {
  return (
    <>
      <Header />
      <DiscountBanner />
      <ProductShowcase />
      <CategorySection />
      <FeaturedProducts />
      <HowItWorks />
      <Testimonials />
      <PaymentOptions />
      <Footer />
    </>
  );
};

export default Landingpage;
