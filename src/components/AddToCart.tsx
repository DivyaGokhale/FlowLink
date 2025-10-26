import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AddressSelector from "../components/AddressSelector";
import CartSummary from "../components/CartSummary";
import RelatedProducts from "../components/RelatedProducts";
import BackButton from "../components/BackButton";
import { useAuth } from "../components/AuthContext";

interface Product {
  _id: string;
  name: string;
  pack: string;
  price: number;
  image: string;
  quantity: number;
}

function AddToCart() {
  const location = useLocation();
  const { shop } = useParams<{ shop?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const product = location.state?.product as Product | undefined;
  const [cartItems, setCartItems] = useState<Product[]>(() => {
    try {
      const s = localStorage.getItem("cart");
      return s ? JSON.parse(s) : [];
    } catch {
      return [] as Product[];
    }
  });

  // ✅ Add product to localStorage cart if passed from ProductDetails
  useEffect(() => {
    if (product) {
      const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");

      const existing = storedCart.find((item: Product) => item._id === product._id);

      let updatedCart;
      if (existing) {
        updatedCart = storedCart.map((item: Product) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      } else {
        updatedCart = [...storedCart, product];
      }

      localStorage.setItem("cart", JSON.stringify(updatedCart));
      try { window.dispatchEvent(new Event("cart-updated")); } catch {}
    }
  }, [product]);

  // Load cart to display and keep in sync across app
  useEffect(() => {
    const sync = () => {
      try {
        const s = localStorage.getItem("cart");
        setCartItems(s ? JSON.parse(s) : []);
      } catch { /* noop */ }
    };
    // initial
    sync();
    // events
    window.addEventListener("cart-updated", sync as any);
    window.addEventListener("storage", sync as any);
    const onVisibility = () => { if (!document.hidden) sync(); };
    window.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("cart-updated", sync as any);
      window.removeEventListener("storage", sync as any);
      window.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const updateQuantity = (_id: string, change: number) => {
    const updated = cartItems
      .map((it) => (it._id === _id ? { ...it, quantity: Math.max(0, (it.quantity || 0) + change) } : it))
      .filter((it) => (it.quantity || 0) > 0);
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    try { window.dispatchEvent(new Event("cart-updated")); } catch {}
  };

  const removeItem = (_id: string) => {
    const updated = cartItems.filter((it) => it._id !== _id);
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    try { window.dispatchEvent(new Event("cart-updated")); } catch {}
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-6">
        <BackButton fallbackPath={shop ? `/${shop}` : "/"} />
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Left side - Cart items */}
          <div>
            {/* Address strip (only when logged in) */}
            {isAuthenticated && (
              <div className="mb-4">
                <AddressSelector />
              </div>
            )}
            <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-lg shadow-card p-4">
              <h1 className="text-xl font-semibold mb-3">Shopping Cart</h1>
              <div className="hidden md:flex justify-between text-xs text-gray-500 border-b pb-2">
                <span>Product</span>
                <div className="w-56 flex justify-between"><span>Price</span><span>Qty</span><span>Subtotal</span></div>
              </div>
              <div className="divide-y">
                {cartItems.length === 0 ? (
                  <p className="py-6 text-gray-600 text-sm">Your cart is empty.</p>
                ) : (
                  cartItems.map((it) => (
                    <div key={it._id} className="py-4 flex gap-4">
                      <img src={it.image} alt={it.name} className="w-24 h-24 object-contain border rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{it.name}</p>
                        {it.pack && <p className="text-xs text-gray-500 mt-0.5">{it.pack}</p>}
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <div className="inline-flex items-center border rounded">
                            <button onClick={() => updateQuantity(it._id, -1)} className="px-2 py-1 hover:bg-gray-50">-</button>
                            <span className="px-3 select-none">{it.quantity}</span>
                            <button onClick={() => updateQuantity(it._id, +1)} className="px-2 py-1 hover:bg-gray-50">+</button>
                          </div>
                          <button onClick={() => removeItem(it._id)} className="text-xs text-red-600 hover:underline">Remove</button>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center justify-between w-56">
                        <span className="text-sm">₹{it.price}</span>
                        <span className="text-sm">{it.quantity}</span>
                        <span className="text-sm font-medium">₹{it.price * it.quantity}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Prompt to sign in if not authenticated */}
              {!isAuthenticated && cartItems.length > 0 && (
                <div className="mt-4 p-3 border rounded-md bg-amber-50 text-sm text-amber-900">
                  To checkout and see delivery charges and order summary, please
                  <button
                    className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-green-600 hover:bg-green-500 text-white font-medium shadow-button"
                    onClick={() => navigate(shop ? `/${shop}/login` : "/login")}
                  >
                    Sign in to your account
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Summary */}
          {isAuthenticated ? (
            <aside>
              <CartSummary />
            </aside>
          ) : null}
        </section>
      </main>

      <RelatedProducts products={[]} />
      <Footer />
    </div>
  );
}

export default AddToCart;
