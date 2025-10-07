import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Icons
const LocationIcon = () => (
  <svg width={20} height={20} fill="none">
    <circle cx="10" cy="7" r="5.5" stroke="#555" />
    <path
      d="M10 13.8c2.5 0 4.5-1.8 4.5-4.3 0-2.5-2-4.4-4.5-4.4s-4.5 1.9-4.5 4.4c0 2.5 2 4.3 4.5 4.3z"
      fill="#fff"
      stroke="#555"
    />
  </svg>
);

const ProfileIcon = () => (
  <svg width={23} height={23} fill="none">
    <circle cx="11.5" cy="8" r="4.5" stroke="black" />
    <rect x="4" y="15" width="15" height="6" rx="3" stroke="black" />
  </svg>
);

// Simple bell alert icon
const AlertIcon = () => (
  <svg width={23} height={23} fill="none">
    <path d="M12 6v8" stroke="black" strokeWidth={2} />
    <circle cx="12" cy="18" r="2" fill="black" />
  </svg>
);

const CartIcon = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 3h2l2.4 10.2a2 2 0 0 0 2 1.6h6.8a2 2 0 0 0 1.95-1.55L20 7H6"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="20" r="1.8" fill="currentColor" />
    <circle cx="17" cy="20" r="1.8" fill="currentColor" />
  </svg>
);

const OrdersIcon = () => (
  <svg width={23} height={23} fill="none">
    <rect x="5" y="4" width="13" height="15" rx="2" stroke="black" />
    <path d="M8 8h7M8 12h7M8 16h7" stroke="black" strokeWidth={2} />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const total = cart.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      setCartCount(total);
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm">
      <div className="max-w-7xl px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            aria-label="Go to home"
            className="flex items-center text-2xl sm:text-3xl font-medium mr-1 sm:mr-2 cursor-pointer"
          >
            <img src="/assets/flowlink-logo-black.png" alt="FlowLink Logo" className="w-[70px] h-[40px] object-contain" />
            <span className="font-mate text-black text-bold text-[20px] font-medium">FlowLink</span>
          </button>

          {/* Location */}
          <span className="hidden md:inline-flex items-center text-sm text-gray-600 mr-2">
            <LocationIcon />
            <span className="mx-2">Delivery to Ratnagiri, Maharashtra</span>
            <span className="text-sm">▼</span>
          </span>

          {/* Search */}
          <div className="order-last w-full md:order-none md:flex-1">
            <div className="relative md:max-w-2xl">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search for products like rice, sugar, oil, masale..."
                aria-label="Search products"
                className="w-full text-sm sm:text-base pl-9 pr-4 py-2 border border-gray-200 rounded-full bg-secondary/80 backdrop-blur shadow-soft outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 transition"
              />
            </div>
          </div>

          {/* Icons */}
          <nav className="ml-auto flex items-center gap-4 sm:gap-6">
            {isAuthenticated ? (
              <button
                onClick={logout}
                aria-label="Logout"
                className="flex flex-col items-center text-xs sm:text-sm cursor-pointer hover:text-[hsl(var(--primary))] transition-colors"
              >
                <ProfileIcon />
                <span className="mt-0.5 hidden sm:block">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                aria-label="Login"
                className="flex flex-col items-center text-xs sm:text-sm cursor-pointer hover:text-[hsl(var(--primary))] transition-colors"
              >
                <ProfileIcon />
                <span className="mt-0.5 hidden sm:block">Login</span>
              </button>
            )}

            <button
              onClick={() => navigate("/addToCart")}
              aria-label={`Open cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
              className="relative flex flex-col items-center text-xs sm:text-sm cursor-pointer hover:text-[hsl(var(--primary))] transition-colors"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 right-1.5 bg-[hsl(var(--primary))] text-white rounded-full text-[10px] w-4 h-4 inline-flex items-center justify-center shadow-button">
                  {cartCount}
                </span>
              )}
              <span className="mt-0.5 hidden sm:block">Cart</span>
            </button>

            <button
              onClick={() => navigate("/orders")}
              aria-label="View order history"
              className="flex flex-col items-center text-xs sm:text-sm cursor-pointer hover:text-[hsl(var(--primary))] transition-colors"
            >
              <OrdersIcon />
              <span className="mt-0.5 hidden sm:block">Orders</span>
            </button>

            <button
              aria-label="View alerts"
              className="flex flex-col items-center text-xs sm:text-sm cursor-pointer hover:text-[hsl(var(--primary))] transition-colors"
            >
              <AlertIcon />
              <span className="mt-0.5 hidden sm:block">Alerts</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
