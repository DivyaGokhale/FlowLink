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

const CartIcon = () => (
  <svg width={23} height={23} fill="none">
    <path d="M6 6h14l-2 8H8" stroke="black" strokeWidth={2} />
    <circle cx="9" cy="20" r="2" fill="black" />
    <circle cx="17" cy="20" r="2" fill="black" />
  </svg>
);

const AlertIcon = () => (
  <svg width={23} height={23} fill="none">
    <path d="M12 6v8" stroke="black" strokeWidth={2} />
    <circle cx="12" cy="18" r="2" fill="black" />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated, logout } = useAuth();

  // ✅ Update cart count whenever storage changes
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const totalItems = cart.reduce(
        (sum: number, item: any) => sum + (item.quantity || 1),
        0
      );
      setCartCount(totalItems);
    };

    updateCartCount();

    // Listen to storage changes (other tabs / components)
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-7xl px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            aria-label="Go to home"
            className="flex items-center gap-2 text-2xl sm:text-3xl font-medium mr-1 sm:mr-2 cursor-pointer"
          >
          <img src="/assets/flowlink-logo-black.png" alt="FlowLink Logo" className="mx-auto w-[72px] h-[48px] object-contain" />
          <span className="font-mate">FlowLink</span>
          </button>

          {/* Location selector (hidden on small screens) */}
          <span className="hidden md:inline-flex items-center text-sm text-gray-600 mr-2">
            <LocationIcon />
            <span className="mx-2">Delivery to Ratnagiri, Maharashtra</span>
            <span className="text-sm">▼</span>
          </span>

          {/* Search bar - takes full row on mobile */}
          <div className="order-last w-full md:order-none md:flex-1">
            <input
              type="text"
              placeholder="Search for products like rice, sugar, oil, masale..."
              aria-label="Search products"
              className="w-full md:max-w-2xl text-sm sm:text-base px-3 sm:px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>

          {/* Icons */}
          <nav className="ml-auto flex items-center gap-4 sm:gap-6">
            {/* Profile */}
            {isAuthenticated ? (
              <button
                onClick={logout}
                aria-label="Logout"
                className="flex flex-col items-center text-xs sm:text-sm cursor-pointer"
              >
                <ProfileIcon />
                <span className="mt-0.5 hidden sm:block">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                aria-label="Login"
                className="flex flex-col items-center text-xs sm:text-sm cursor-pointer"
              >
                <ProfileIcon />
                <span className="mt-0.5 hidden sm:block">Login</span>
              </button>
            )}

            {/* Cart */}
            <button
              onClick={() => navigate("/addToCart")}
              aria-label={`Open cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
              className="relative flex flex-col items-center text-xs sm:text-sm cursor-pointer"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 right-1.5 bg-black text-white rounded-full text-[10px] w-4 h-4 inline-flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="mt-0.5 hidden sm:block">Cart</span>
            </button>

            {/* Alerts */}
            <button aria-label="View alerts" className="flex flex-col items-center text-xs sm:text-sm cursor-pointer">
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
