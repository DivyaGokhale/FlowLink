import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AddressSelector from "../components/AddressSelector";
import CartSummary from "../components/CartSummary";
import RelatedProducts from "../components/RelatedProducts";

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

  const [cart, setCart] = useState<Product[]>([]);

  // ✅ Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // ✅ Keep cart synced with localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ✅ Add new product if passed from ProductDetails
  useEffect(() => {
    if (product) {
      setCart((prevCart) => {
        const existing = prevCart.find((item) => item.id === product.id);
        if (existing) {
          return prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + product.quantity }
              : item
          );
        } else {
          return [...prevCart, product];
        }
      });
    }
  }, [product]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left side - Delivery Address */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Choose a delivery address</h2>
            <AddressSelector />
          </div>

          {/* Right side - Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary cartItems={cart} setCartItems={setCart} />
          </div>
        </div>
      </main>

      <RelatedProducts products={[]} />
      <Footer />
    </div>
  );
}

export default AddToCart;
