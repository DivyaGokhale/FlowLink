import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "./AuthContext";
import Skeleton from "./ui/Skeleton";

// Icons
const LocationIcon = () => (
  <svg width={20} height={20} fill="none">
    <circle cx="10" cy="7" r="5.5" stroke="currentColor" />
    <path
      d="M10 13.8c2.5 0 4.5-1.8 4.5-4.3 0-2.5-2-4.4-4.5-4.4s-4.5 1.9-4.5 4.4c0 2.5 2 4.3 4.5 4.3z"
      fill="currentColor"
      stroke="currentColor"
    />
  </svg>
);

const ProfileIcon = () => (
  <svg width={23} height={23} fill="none">
    <circle cx="11.5" cy="8" r="4.5" stroke="currentColor" />
    <rect x="4" y="15" width="15" height="6" rx="3" stroke="currentColor" />
  </svg>
);

// Simple bell alert icon
const AlertIcon = () => (
  <svg width={23} height={23} fill="none">
    <path d="M12 6v8" stroke="currentColor" strokeWidth={2} />
    <circle cx="12" cy="18" r="2" fill="currentColor" />
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
    <rect x="5" y="4" width="13" height="15" rx="2" stroke="currentColor" />
    <path d="M8 8h7M8 12h7M8 16h7" stroke="currentColor" strokeWidth={2} />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return Array.isArray(cart)
        ? cart.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0)
        : 0;
    } catch { return 0; }
  });
  const { isAuthenticated, logout, user } = useAuth();
  const { shop } = useParams<{ shop?: string }>();
  const [searchParams] = useSearchParams();
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState<string>(() => {
    try { return searchParams.get('q') || ''; } catch { return ''; }
  });

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const total = cart.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      setCartCount(total);
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cart-updated", updateCartCount as any);
    const onVisibility = () => { if (!document.hidden) updateCartCount(); };
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", updateCartCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cart-updated", updateCartCount as any);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", updateCartCount);
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(t)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Persist current shop slug for auth flows and redirects
  useEffect(() => {
    if (shop) {
      try { localStorage.setItem('shopSlug', String(shop)); } catch {}
    }
  }, [shop]);

  // Keep header search in sync with URL param
  useEffect(() => {
    try {
      const q = searchParams.get('q') || '';
      setQuery(q);
    } catch {}
  }, [searchParams]);

  const submitSearch = () => {
    const q = (query || '').trim();
    let base = '/shop';
    if (shop) {
      base = `/${shop}/checkout`;
    } else {
      try {
        const persisted = localStorage.getItem('shopSlug');
        if (persisted) base = `/${persisted}/checkout`;
      } catch {}
    }
    const url = q ? `${base}?q=${encodeURIComponent(q)}` : base;
    navigate(url);
  };

  // Load shop branding if slug present
  useEffect(() => {
    if (!shop) { setShopInfo(null); return; }
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";
    let ignore = false;
    setShopLoading(true);
    fetch(`${baseUrl}/shops/${encodeURIComponent(shop)}`)
      .then(async (res) => { if (!ignore && res.ok) { const data = await res.json(); setShopInfo(data); } })
      .catch(() => {})
      .finally(() => { if (!ignore) setShopLoading(false); });
    return () => { ignore = true; };
  }, [shop]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#131921] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate(shop ? `/${shop}` : "/")}
            aria-label="Go to home"
            className="flex items-center text-2xl sm:text-3xl font-medium mr-1 sm:mr-2 cursor-pointer"
          >
            <img
              src={shopInfo?.logo || "/assets/flowlink-logo-white.png"}
              alt={(shopInfo?.name || 'FlowLink') + ' Logo'}
              className="w-[70px] h-[40px] object-contain"
              onError={(e) => { const t = e.currentTarget as HTMLImageElement; if (t.src !== "/assets/flowlink-logo-black.png") t.src = "/assets/flowlink-logo-black.png"; }}
            />
            {shopLoading ? (
              <div className="ml-2 w-28"><Skeleton className="h-6 w-24 rounded" /></div>
            ) : (
              <span className="ml-2 font-mate text-white text-bold text-[20px] font-medium">{shopInfo?.name || 'FlowLink'}</span>
            )}
          </button>

          {/* Location */}
          <span className="hidden md:inline-flex items-center text-sm text-gray-200 mr-2">
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
                className="w-full text-sm sm:text-base pl-9 pr-12 py-2 rounded-md bg-white text-black outline-none focus:ring-2 focus:ring-[#febd69]/50 transition"
              />
              <button
                onClick={submitSearch}
                aria-label="Search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md bg-[#febd69] text-[#131921] text-xs font-medium hover:brightness-105 active:scale-[0.99]"
              >
                Search
              </button>
            </div>
          </div>

          {/* Icons */}
          <nav className="ml-auto flex items-center gap-4 sm:gap-6">
            

            <button
              onClick={() => navigate(shop ? `/${shop}/addToCart` : "/addToCart")}
              aria-label={`Open cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
              className="relative flex flex-col items-center text-xs sm:text-sm cursor-pointer hover:text-green-400 transition-colors"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 right-1.5 bg-green-600 text-white rounded-full text-[10px] w-4 h-4 inline-flex items-center justify-center shadow-button">
                  {cartCount}
                </span>
              )}
              <span className="mt-0.5 hidden sm:block">Cart</span>
            </button>

            <button
              onClick={() => navigate(shop ? `/${shop}/orders` : "/orders")}
              aria-label="View order history"
              className="flex flex-col items-center text-xs sm:text-sm cursor-pointer hover:text-green-400 transition-colors"
            >
              <OrdersIcon />
              <span className="mt-0.5 hidden sm:block">Orders</span>
            </button>

            <div
              className="relative"
              ref={profileRef}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setProfileOpen((v) => !v);
                }}
                aria-label="View profile"
                aria-expanded={profileOpen}
                className="flex flex-col items-center text-xs sm:text-sm cursor-pointer hover:text-green-400 transition-colors"
              >
                <ProfileIcon />
                <span className="mt-0.5 hidden sm:block">{isAuthenticated ? (user?.name ? user.name.split(" ")[0] : "Account") : "Profile"}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded-md shadow-lg ring-1 ring-black/5 z-50">
                  {!isAuthenticated ? (
                    <div className="p-4">
                      <div className="text-sm text-gray-700 mb-3">Hello, sign in</div>
                      <button
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 px-3 rounded-md shadow-button"
                        onClick={() => navigate(shop ? `/${shop}/account` : "/login")}
                      >
                        Sign in
                      </button>
                      <div className="mt-3 border-t pt-3 text-sm">
                        <button
                          className="w-full text-left hover:text-[#131921] text-[#007185]"
                          onClick={() => navigate(shop ? `/${shop}/orders` : "/orders")}
                        >
                          Your Orders
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2">
                      <div className="px-2 py-2 text-sm text-gray-600">Hello, {user?.name || user?.email}</div>
                      <button
                        className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded-md text-sm"
                        onClick={() => navigate(shop ? `/${shop}/profile` : "/profile")}
                      >
                        Your Account
                      </button>
                      <button
                        className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded-md text-sm"
                        onClick={() => navigate(shop ? `/${shop}/orders` : "/orders")}
                      >
                        Your Orders
                      </button>
                      <div className="border-t my-1" />
                      <button
                        className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded-md text-sm text-red-600"
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          navigate(shop ? `/${shop}` : "/");
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
