import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AddressSelector from "../components/AddressSelector";
import CartSummary from "../components/CartSummary";
import RelatedProducts from "../components/RelatedProducts";
import BackButton from "../components/BackButton";

interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  image: string;
  quantity: number;
}

function AddToCart() {
  const location = useLocation();
  const product = location.state?.product as Product | undefined;

  // ✅ Add product to localStorage cart if passed from ProductDetails
  useEffect(() => {
    if (product) {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");

      const existing = storedCart.find((item: Product) => item.id === product.id);

      let updatedCart;
      if (existing) {
        updatedCart = storedCart.map((item: Product) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      } else {
        updatedCart = [...storedCart, product];
      }

      localStorage.setItem("cart", JSON.stringify(updatedCart));
    }
  }, [product]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-6">
        <BackButton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left side - Delivery Address */}
          <div className="lg:col-span-2">
            <AddressSelector />
          </div>

          {/* Right side - Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      </main>

      <RelatedProducts products={[]} />
      <Footer />
    </div>
  );
}

export default AddToCart;
