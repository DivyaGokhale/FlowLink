import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "./AuthContext";
import Skeleton from "./ui/Skeleton";
import SearchBar from "./SearchBar";

// Category data with image paths
const categories = [
  { id: 1, name: "Dairy, Bread & Eggs", image: "/categories/diary_bread_eggs.jpg" },
  { id: 2, name: "Cold Drinks & Juices", image: "/categories/cold-drinks-juices.jfif" },
  { id: 3, name: "Rice, Atta & Grains", image: "/categories/rice_atta_grains.jfif" },
  { id: 4, name: "Sugar, Jaggery & Salt", image: "/categories/sugar_jaggery_salt.jfif" },
  { id: 5, name: "Masale & Spices", image: "/categories/masale_spices.jfif" },
  { id: 6, name: "Biscuits & Snacks", image: "/categories/biscuits_snacks.jfif" },
  { id: 7, name: "Tea, Coffee & Beverages", image: "/categories/tea_coffee_beverages.jfif" },
  { id: 8, name: "Oil & Ghee", image: "/categories/oil_ghee.jfif" },
  { id: 9, name: "Personal Care", image: "/categories/personal_care.jfif" },
  { id: 10, name: "Household Cleaning", image: "/categories/household_cleaning.jfif" },
];

// Category Item Component with image support
const CategoryItem = ({ 
  image, 
  name, 
  onClick,
  className = "" 
}: { 
  image: string; 
  name: string; 
  onClick: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full text-left px-3 py-2.5 hover:bg-green-50 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200 group min-w-0 ${className}`}
  >
    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden bg-gray-100">
      <img 
        src={image} 
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/placeholder-category.png';
        }}
      />
    </div>
    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{name}</span>
  </button>
);

// Icons
const LocationIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
      fill="currentColor"
    />
  </svg>
);

const ProfileIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 3h2l2.4 10.2a2 2 0 0 0 2 1.6h6.8a2 2 0 0 0 1.95-1.55L20 7H6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="17" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const OrdersIcon = () => (
  <svg width={23} height={23} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <rect x="5" y="4" width="13" height="15" rx="2" strokeWidth="2" />
    <path d="M8 8h7M8 12h7M8 16h7" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (Array.isArray(cart)) {
        // Calculate total quantity across all items
        return cart.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      }
      return 0;
    } catch { return 0; }
  });
  const { isAuthenticated, logout, user } = useAuth();
  const { shop } = useParams<{ shop?: string }>();
  const [searchParams] = useSearchParams();
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const categoriesRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState<string>(() => {
    try { return searchParams.get('q') || ''; } catch { return ''; }
  });

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        if (Array.isArray(cart)) {
          // Calculate total quantity across all items
          const total = cart.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error('Error updating cart count:', error);
        setCartCount(0);
      }
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
      if (categoriesRef.current && !categoriesRef.current.contains(t)) {
        setCategoriesOpen(false);
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

  const submitSearch = (searchQuery: string) => {
    const q = (searchQuery || '').trim();
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
  <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
    {/* Green top strip */}
    <div className="w-full h-1 bg-green-600"></div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        {/* Logo */}
        <button
          onClick={() => navigate(shop ? `/${shop}` : "/")}
          aria-label="Go to home"
          className="flex items-center cursor-pointer"
        >
          <img
            src={shopInfo?.logo || "/assets/flowlink-logo-black.png"}
            alt={(shopInfo?.name || 'FlowLink') + ' Logo'}
            className="h-10 w-auto object-contain"
            onError={(e) => { const t = e.currentTarget as HTMLImageElement; if (t.src !== "/assets/flowlink-logo-black.png") t.src = "/assets/flowlink-logo-black.png"; }}
          />
          {shopLoading && (
            <div className="ml-2 w-28"><Skeleton className="h-6 w-24 rounded" /></div>
          )}
        </button>

        {/* Location Selector */}
        <button
          className="hidden md:flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-green-500 transition-colors"
          aria-label="Change delivery location"
        >
          <div className="text-green-600">
            <LocationIcon />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-500 leading-tight">Deliver to</span>
            <span className="text-sm font-bold text-black leading-tight">Ratnagiri</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 text-gray-600">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Explore by Categories Button */}
        <div className="relative" ref={categoriesRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              setCategoriesOpen(!categoriesOpen);
            }}
            className="hidden md:flex items-center gap-2 px-3 py-2 bg-green-50 border border-gray-200 rounded-lg hover:border-green-500 transition-colors"
            aria-label="Explore by categories"
            aria-expanded={categoriesOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4H21V6H3V4ZM3 9H21V11H3V9ZM3 14H21V16H3V14Z" fill="currentColor"/>
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-xs text-gray-500 leading-tight">Explore by</span>
              <span className="text-sm font-semibold text-black leading-tight">Categories</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={`ml-1 text-gray-600 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}>
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Categories Dropdown */}
          {categoriesOpen && (
            <div className="absolute left-0 mt-2 w-[500px] bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-4 bg-green-600">
                <h3 className="text-white font-semibold text-base">All Categories</h3>
                <p className="text-green-100 text-xs">Browse our wide range of products</p>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {categories.map((category) => (
                    <CategoryItem 
                      key={category.id}
                      image={category.image}
                      name={category.name}
                      onClick={() => {
                        setCategoriesOpen(false);
                        navigate(shop ? `/${shop}/category/${encodeURIComponent(category.name)}` : `/category/${encodeURIComponent(category.name)}`);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <SearchBar 
            initialQuery={query}
            onSearch={submitSearch}
          />
        </div>

        {/* Icons */}
        <nav className="flex items-center gap-4 sm:gap-6">
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
              className="flex flex-col items-center text-xs cursor-pointer hover:text-green-600 transition-colors"
            >
              <ProfileIcon />
              <span className="mt-1 text-sm text-black">{isAuthenticated ? (user?.name ? user.name.split(" ")[0] : "Account") : "Login"}</span>
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

          <button
            onClick={() => navigate(shop ? `/${shop}/addToCart` : "/addToCart")}
            aria-label={`Open cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
            className="relative flex flex-col items-center text-xs cursor-pointer hover:text-green-600 transition-colors"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -top-1 right-0 bg-green-600 text-white rounded-full text-[10px] w-4 h-4 inline-flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <span className="mt-1 text-sm text-black">Cart</span>
          </button>

          <button
            onClick={() => navigate(shop ? `/${shop}/orders` : "/orders")}
            aria-label="View orders"
            className="flex flex-col items-center text-xs cursor-pointer hover:text-green-600 transition-colors"
          >
            <OrdersIcon />
            <span className="mt-1 text-sm text-black">Orders</span>
          </button>
        </nav>
      </div>
    </div>
  </header>
);
}
export default Header;