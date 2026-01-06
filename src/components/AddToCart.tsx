import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
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
    // Calculate total items in cart before updating
    const currentTotal = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
    
    // If change is positive (adding), check if it exceeds the limit
    if (change > 0) {
      if (currentTotal + change > 20) {
        const availableSlots = 20 - currentTotal;
        if (availableSlots > 0) {
          // Limit the increase to the available slots
          change = availableSlots;
        } else {
          // No slots available, don't make the change
          return;
        }
      }
    }

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
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - Cart items and Address selection */}
          <div className="lg:w-2/3 flex flex-col gap-6">
            {/* Shopping Cart Section - Enhanced Design */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Your Shopping Cart
                </h1>
                <p className="text-gray-600 text-sm mt-1">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</p>
              </div>
              
              <div className="p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
                    <p className="mt-1 text-gray-500">Looks like you haven't added anything to your cart yet</p>
                    <button
                      onClick={() => navigate(shop ? `/${shop}` : "/")}
                      className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cartItems.map((it) => (
                      <div key={it._id} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-200 transition-colors duration-200">
                        <div className="flex-shrink-0">
                          <img 
                            src={it.image} 
                            alt={it.name} 
                            className="w-24 h-24 object-contain border border-gray-200 rounded-lg bg-white p-2"
                          />
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <div>
                              <h3 className="text-base font-medium text-gray-900">{it.name}</h3>
                              {it.pack && <p className="text-sm text-gray-500 mt-1">{it.pack}</p>}
                            </div>
                            
                            <div className="mt-2 sm:mt-0">
                              <p className="text-lg font-semibold text-gray-900">₹{(it.price * it.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center">
                              <label htmlFor={`quantity-${it._id}`} className="mr-2 text-sm text-gray-600">Qty:</label>
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button 
                                  onClick={() => updateQuantity(it._id, -1)} 
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors duration-150"
                                  aria-label="Decrease quantity"
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 text-gray-800">{it.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(it._id, +1)} 
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors duration-150"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => removeItem(it._id)} 
                              className="inline-flex items-center text-sm text-red-600 hover:text-red-800 transition-colors duration-150"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Prompt to sign in if not authenticated */}
                {!isAuthenticated && cartItems.length > 0 && (
                  <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Sign in to continue</h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>To checkout and see delivery charges and order summary, please sign in to your account.</p>
                        </div>
                        <div className="mt-4">
                          <button
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            onClick={() => navigate(shop ? `/${shop}/account` : "/login")}
                          >
                            Sign in
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Address Selection Section (only when logged in) */}
            {isAuthenticated && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery Address
                  </h2>
                </div>
                <div className="p-6">
                  <AddressSelector />
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Order Summary (fixed position) */}
          {isAuthenticated && (
            <div className="lg:w-1/3 lg:sticky lg:top-6 lg:self-start">
              <CartSummary />
            </div>
          )}
        </div>
      </main>

      <RelatedProducts products={[]} />
    </div>
  );
}

export default AddToCart;