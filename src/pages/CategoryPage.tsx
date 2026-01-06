import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinner from "../components/ui/Spinner";
import { motion } from "framer-motion";
import { useAuth } from "../components/AuthContext";
import QuantitySelector from "../components/QuantitySelector"; // Import the new QuantitySelector component

interface ProductDoc {
  _id: string;
  title?: string;
  name?: string;
  price?: number;
  mrp?: number;
  quantity?: number;
  category?: string;
  images?: string[];
  image?: string;
  description?: string;
}

const currency = (n?: number | string) => {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
};

// Simple cache to speed up repeated visits within the session
const categoryCache: Map<string, ProductDoc[]> = new Map();
const getSessionCache = (key: string): ProductDoc[] | null => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ProductDoc[]) : null;
  } catch { return null; }
};
const setSessionCache = (key: string, value: ProductDoc[]) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const CategoryPage: React.FC = () => {
  const { category, shop } = useParams<{ category: string; shop?: string }>();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("featured");
  const navigate = useNavigate();
  const { vipEligible } = useAuth();

  // State to track which product's quantity selector is shown
  const [showQuantitySelector, setShowQuantitySelector] = useState<Record<string, boolean>>({});

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";

  useEffect(() => {
    let cancelled = false;
    const key = `cat:${shop || "_"}:${category || "_"}`;
    const cached = categoryCache.get(key) || getSessionCache(key);
    if (cached && cached.length) {
      setProducts(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const controller = new AbortController();
    const load = async () => {
      setError(null);
      try {
        const apiUrl = `${baseUrl}/products/category/${encodeURIComponent(category || "")}${shop ? `?shop=${encodeURIComponent(shop)}` : ""}`;
        const res = await fetch(apiUrl, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          const arr: ProductDoc[] = Array.isArray(data) ? data : [];
          if (arr.length) {
            categoryCache.set(key, arr);
            setSessionCache(key, arr);
            setProducts(arr);
            setLoading(false);
            return;
          }
        }
      } catch (_) {
        // fall back below
      }

      try {
        const localRes = await fetch("/products.json", { signal: controller.signal });
        if (!localRes.ok) throw new Error("local fail");
        const raw = await localRes.json();
        const mapped: ProductDoc[] = (raw || []).map((d: any) => ({
          _id: String(d._id || d.id),
          title: d.title || d.name || "Untitled",
          name: d.name,
          price: typeof d.price === "number" ? d.price : (d.price ? Number(d.price) : 0),
          mrp: typeof d.mrp === "number" ? d.mrp : (d.mrp ? Number(d.mrp) : undefined),
          category: d.category,
          images: Array.isArray(d.images) && d.images.length ? d.images : (d.image ? [d.image] : []),
          image: d.image,
          description: d.description || d.desc,
        }));
        const filtered = (category
          ? mapped.filter((p) => (p.category || "").toLowerCase() === decodeURIComponent(category!).toLowerCase())
          : mapped);
        if (cancelled) return;
        categoryCache.set(key, filtered);
        setSessionCache(key, filtered);
        setProducts(filtered);
      } catch (e) {
        if (!cancelled) setError("Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; controller.abort(); };
  }, [category, shop, baseUrl]);

  const VIP_OFF = 15;
  const priceBounds = useMemo(() => {
    const prices = products.map(p => Number(p.price || 0)).filter(n => !Number.isNaN(n));
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return { min, max };
  }, [products]);

  useEffect(() => {
    if (priceBounds.max > 0 && (minPrice === undefined && maxPrice === undefined)) {
      setMinPrice(priceBounds.min);
      setMaxPrice(priceBounds.max);
    }
  }, [priceBounds]);

  const display = useMemo(() => {
    let list = [...products];

    const q = search.trim().toLowerCase();
    if (q) list = list.filter(p => ((p.title || p.name || "").toLowerCase().includes(q)));

    if (inStockOnly) list = list.filter(p => (p.quantity ?? 0) > 0);

    list = list.filter(p => {
      const price = Number(p.price || 0);
      const overMin = minPrice === undefined ? true : price >= minPrice;
      const underMax = maxPrice === undefined ? true : price <= maxPrice;
      return overMin && underMax;
    });

    switch (sortBy) {
      case "price_asc":
        list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case "newest":
        list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        break;
    }

    return list;
  }, [products, search, inStockOnly, minPrice, maxPrice, sortBy]);

  const addToCart = (p: ProductDoc) => {
    // Calculate total items in cart before adding new item
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const currentTotalItems = existing.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
    
    // Check if adding this product would exceed the 20 item limit
    if (currentTotalItems + 1 > 20) {
      showToast("Your cart is full (max 20 items). Please remove some items before adding more.");
      return; // Don't add the item to cart
    }
    
    const image = Array.isArray(p.images) && p.images.length ? p.images[0] : "";
    const base = Number((p as any).discountedPrice ?? p.price ?? 0);
    const vipPrice = vipEligible ? Math.max(0, base - VIP_OFF) : base;
    const item = { _id: String(p._id), name: p.title || "Untitled", price: vipPrice, image, quantity: 1 } as any;
    
    const updated = existing.some((it: any) => it._id === item._id)
      ? existing.map((it: any) => it._id === item._id 
          ? { ...it, quantity: Math.min(20 - (currentTotalItems - (it.quantity || 1)), (it.quantity || 1) + 1) } // Cap quantity to not exceed 20
          : it)
      : [...existing, item];
    localStorage.setItem("cart", JSON.stringify(updated));
    try { window.dispatchEvent(new Event("cart-updated")); } catch {}
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold">{category ? decodeURIComponent(category) : "Category"}</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <div className="text-center text-red-600 py-10">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            <aside className="md:sticky md:top-[84px] h-max bg-white/90 backdrop-blur border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-[hsl(var(--primary))]/40 outline-none"
                />
              </div>

              <div className="mb-5">
                <div className="font-medium text-sm text-gray-800 mb-2">Price</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-24 h-9 rounded-md border border-gray-300 px-2 text-sm"
                    placeholder={`${priceBounds.min}`}
                    value={minPrice ?? ""}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    className="w-24 h-9 rounded-md border border-gray-300 px-2 text-sm"
                    placeholder={`${priceBounds.max}`}
                    value={maxPrice ?? ""}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                  In stock only
                </label>
              </div>

              {/* Categories List */}
              <div className="mb-2">
                <div className="font-medium text-sm text-gray-800 mb-2">Categories</div>
                <div className="space-y-1">
                  <button
                    onClick={() => navigate(shop ? `/${shop}/shop` : "/shop")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      !category ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    All Products
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Dairy%2C%20Bread%20%26%20Eggs` : "/category/Dairy%2C%20Bread%20%26%20Eggs")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Dairy, Bread & Eggs" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Dairy, Bread & Eggs
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Cold%20Drinks%20%26%20Juices` : "/category/Cold%20Drinks%20%26%20Juices")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Cold Drinks & Juices" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Cold Drinks & Juices
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Rice%2C%20Atta%20%26%20Grains` : "/category/Rice%2C%20Atta%20%26%20Grains")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Rice, Atta & Grains" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Rice, Atta & Grains
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Sugar%2C%20Jaggery%20%26%20Salt` : "/category/Sugar%2C%20Jaggery%20%26%20Salt")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Sugar, Jaggery & Salt" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Sugar, Jaggery & Salt
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Masale%20%26%20Spices` : "/category/Masale%20%26%20Spices")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Masale & Spices" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Masale & Spices
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Biscuits%20%26%20Snacks` : "/category/Biscuits%20%26%20Snacks")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Biscuits & Snacks" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Biscuits & Snacks
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Tea%2C%20Coffee%20%26%20Beverages` : "/category/Tea%2C%20Coffee%20%26%20Beverages")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Tea, Coffee & Beverages" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Tea, Coffee & Beverages
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Oil%20%26%20Ghee` : "/category/Oil%20%26%20Ghee")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Oil & Ghee" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Oil & Ghee
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Personal%20Care` : "/category/Personal%20Care")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Personal Care" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Personal Care
                  </button>
                  <button
                    onClick={() => navigate(shop ? `/${shop}/category/Household%20Cleaning` : "/category/Household%20Cleaning")}
                    className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      category === "Household Cleaning" ? "font-medium text-[hsl(var(--primary))]" : "text-gray-700"
                    }`}
                  >
                    Household Cleaning
                  </button>
                </div>
              </div>
            </aside>

            <section>
              <div className="text-sm text-gray-600 mb-3">{display.length} results</div>
              {display.length === 0 ? (
                <div className="text-gray-600">No products match your filters.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {display.map((p, i) => {
              const img = Array.isArray(p.images) && p.images.length ? p.images[0] : (p.image || "/favicon.ico");
              const base = Number((p as any).discountedPrice ?? p.price ?? 0);
              const vipOff = vipEligible ? VIP_OFF : 0;
              const finalPrice = Math.max(0, base - vipOff);
              const mrp = Number(p.mrp || 0);
              const discount = mrp && mrp > base ? Math.round(((mrp - base) / mrp) * 100) : 0;

                    return (
                      <motion.div
                        id={`product-${p._id}`}
                        key={p._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: (i % 12) * 0.03 }}
                        className="group bg-white backdrop-blur rounded-xl shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 p-3 flex flex-col border border-green-200 hover:border-green-300"
                      >
                        <div 
                          onClick={() => navigate(`${shop ? `/${shop}` : ""}/product/${p._id}`)}
                          className="aspect-[3/4] w-full rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center cursor-pointer"
                        >
                          <img src={img} alt={p.title || p.name || "Product"} className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" decoding="async" />
                        </div>
                        <div className="mt-3 text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px]">{p.title || p.name}</div>
                        <div className="mt-1 text-xs text-gray-500">{p.category || "Others"}</div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <div className="text-lg font-semibold text-gray-900">{currency(finalPrice)}</div>
                          {mrp && mrp > base && (
                            <>
                              <div className="text-xs line-through text-gray-400">{currency(mrp)}</div>
                              <span className="text-[11px] bg-rose-100 text-rose-700 rounded px-1.5 py-0.5">{discount}% off</span>
                            </>
                          )}
                          {vipEligible && vipOff > 0 && (
                            <span className="ml-1 text-[11px] bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">VIP -₹{VIP_OFF}</span>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button onClick={() => navigate(`${shop ? `/${shop}` : ""}/product/${p._id}`)} className="h-9 rounded-full border border-[hsl(var(--primary))] text-sm transition-all duration-200 hover:bg-[hsl(var(--primary))] hover:text-white whitespace-nowrap">View</button>
                          <button 
                            onClick={() => {
                              const existing = JSON.parse(localStorage.getItem("cart") || "[]");
                              const item = { _id: String(p._id), name: (p.title || p.name || "Untitled"), price: finalPrice, image: img, quantity: 1 };
                              const updated = existing.some((it: any) => it._id === item._id)
                                ? existing.map((it: any) => it._id === item._id ? { ...it, quantity: (it.quantity || 1) + 1 } : it)
                                : [...existing, item];
                              localStorage.setItem("cart", JSON.stringify(updated));
                              try { window.dispatchEvent(new Event("cart-updated")); } catch {}
                            }} 
                            className="h-9 rounded-full bg-[hsl(var(--primary))] text-white text-sm shadow-button transition-all duration-200 hover:bg-[hsl(var(--primary-hover))] hover:scale-105 active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis px-2"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default CategoryPage;
