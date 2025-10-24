import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/ToastContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

// Product shape coming from admin API
interface ProductDoc {
  _id: string;
  title?: string;
  price?: number;
  mrp?: number;
  quantity?: number;
  category?: string;
  images?: string[];
  description?: string;
  discountedPrice?: number;
}

const currency = (n: number | string | undefined) => {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
};

// Cache full product lists by shop to speed up navigation
const shopCache: Map<string, ProductDoc[]> = new Map();
const getSessionCache = (key: string): ProductDoc[] | null => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ProductDoc[]) : null;
  } catch { return null; }
};
const setSessionCache = (key: string, value: ProductDoc[]) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const Shop: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [params] = useSearchParams();
  const { shop } = useParams<{ shop?: string }>();
  const [fallback, setFallback] = useState<ProductDoc[]>([]);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { vipEligible } = useAuth();

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";

  useEffect(() => {
    const initialCat = params.get("category");
    if (initialCat) setSelectedCats(new Set([initialCat]));
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    const key = `shop:${shop || '_'}`;
    const cached = shopCache.get(key) || getSessionCache(key);
    if (cached && cached.length) {
      setProducts(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const controller = new AbortController();
    const load = async () => {
      try {
        const qs = shop ? `?shop=${encodeURIComponent(shop)}` : "";
        const res = await fetch(`${baseUrl}/products${qs}`, { signal: controller.signal });
        if (!res.ok) throw new Error('api');
        const data: ProductDoc[] = await res.json();
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : [];
        shopCache.set(key, arr);
        setSessionCache(key, arr);
        setProducts(arr);
      } catch (_) {
        // keep existing products/cached if API fails
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; controller.abort(); };
  }, [baseUrl, shop]);

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

  const allCategories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const c = (p.category || "Others").trim();
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const visible = useMemo(() => {
    let list = [...products];

    // Search
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(p => (p.title || "").toLowerCase().includes(q));

    // Categories
    if (selectedCats.size) list = list.filter(p => selectedCats.has((p.category || "Others").trim()));

    // Stock
    if (inStockOnly) list = list.filter(p => (p.quantity ?? 0) > 0);

    // Price
    list = list.filter(p => {
      const price = Number(p.price || 0);
      const overMin = minPrice === undefined ? true : price >= minPrice;
      const underMax = maxPrice === undefined ? true : price <= maxPrice;
      return overMin && underMax;
    });

    // Sort
    switch (sortBy) {
      case "price_asc":
        list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case "newest":
        // No createdAt in type, but backend includes timestamps; cast for safety
        list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        // featured: keep as-is
        break;
    }

    return list;
  }, [products, search, selectedCats, inStockOnly, minPrice, maxPrice, sortBy]);

  // Final list to render: prefer filtered visible; otherwise use fallback featured
  const display = visible.length ? visible : fallback;

  // Load featured products as a fallback when no results found
  useEffect(() => {
    const needFallback = !loading && visible.length === 0;
    if (!needFallback) { setFallback([]); return; }
    let cancelled = false;
    const inferCategory = (name: string): string => {
      const n = name.toLowerCase();
      if (/milk|curd|paneer|cheese|butter|dairy|bread|egg/.test(n)) return "Dairy, Bread & Eggs";
      if (/juice|cola|soda|drink|beverage|cold\s*drink/.test(n)) return "Cold Drinks & Juices";
      if (/rice|atta|flour|maida|dal|lentil|grain|poha|sooji|rava|besan/.test(n)) return "Rice, Atta & Grains";
      if (/sugar|jaggery|salt/.test(n)) return "Sugar, Jaggery & Salt";
      if (/masala|spice|turmeric|chilli|cumin|coriander|garam/.test(n)) return "Masale & Spices";
      if (/biscuit|cookie|snack|chips|namkeen/.test(n)) return "Biscuits & Snacks";
      if (/tea|coffee/.test(n)) return "Tea, Coffee & Beverages";
      if (/oil|ghee|mustard|sunflower|refined/.test(n)) return "Oil & Ghee";
      if (/soap|shampoo|toothpaste|tooth\s*brush|face\s*wash|cream|lotion/.test(n)) return "Personal Care";
      if (/detergent|cleaner|phenyl|dishwash|mop|broom|harpic/.test(n)) return "Household Cleaning";
      return "Others";
    };
    (async () => {
      try {
        const res = await fetch('/products.json');
        if (!res.ok) return;
        const arr: any[] = await res.json();
        if (cancelled) return;
        const mapped: ProductDoc[] = (arr || []).map((d) => ({
          _id: String(d._id || d.id || Math.random()),
          title: d.title || d.name || 'Untitled',
          price: typeof d.price === 'number' ? d.price : (d.price ? Number(d.price) : 0),
          mrp: typeof d.mrp === 'number' ? d.mrp : (d.mrp ? Number(d.mrp) : undefined),
          category: d.category || inferCategory(String(d.title || d.name || '')),
          images: Array.isArray(d.images) && d.images.length ? d.images : (d.image ? [d.image] : []),
          description: d.description || d.desc,
          quantity: typeof d.quantity === 'number' ? d.quantity : undefined,
        }));
        setFallback(mapped);
      } catch (_) {
        // silent fallback error
      }
    })();
    return () => { cancelled = true; };
  }, [loading, visible]);

  // Reveal-on-scroll animation for product cards (presentation only)
  useEffect(() => {
    // Delay to the next frame to ensure DOM is painted
    const raf = requestAnimationFrame(() => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal-card"));
      if (!nodes.length) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("reveal-in");
              io.unobserve(e.target);
            }
          }
        },
        { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
      );
      nodes.forEach((n) => io.observe(n));
    });
    return () => cancelAnimationFrame(raf);
  }, [visible, loading, fallback]);

  const toggleCategory = (c: string) => {
    const next = new Set(selectedCats);
    if (next.has(c)) next.delete(c); else next.add(c);
    setSelectedCats(next);
  };

  const VIP_OFF = 15; // rupees off for VIP (logged-in customers)
  const addToCart = (p: ProductDoc) => {
    const image = Array.isArray(p.images) && p.images.length ? p.images[0] : "";
    const base = Number((p as any).discountedPrice ?? p.price ?? 0);
    const vipPrice = vipEligible ? Math.max(0, base - VIP_OFF) : base;
    const item = { _id: String(p._id), name: p.title || "Untitled", price: vipPrice, image, quantity: 1 } as any;
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const updated = existing.some((it: any) => it._id === item._id)
      ? existing.map((it: any) => it._id === item._id ? { ...it, quantity: (it.quantity || 1) + 1 } : it)
      : [...existing, item];
    localStorage.setItem("cart", JSON.stringify(updated));
    try { window.dispatchEvent(new Event("cart-updated")); } catch {}
    showToast(`✅ ${item.name} added to cart`);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in-up">
        {/* Top bar: title + sort */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold">Shop</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar Filters */}
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

            {/* Category filter */}
            <div className="mb-5">
              <div className="font-medium text-sm text-gray-800 mb-2">Categories</div>
              <div className="max-h-48 overflow-auto pr-1 space-y-2">
                {allCategories.map(([c, count]) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={selectedCats.has(c)} onChange={() => toggleCategory(c)} />
                    <span className="flex-1 line-clamp-1">{c}</span>
                    <span className="text-gray-400">{count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price filter */}
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

            {/* Availability */}
            <div className="mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                In stock only
              </label>
            </div>
          </aside>

          {/* Results grid */}
          <section>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-card p-4">
                    <Skeleton className="w-full aspect-[3/4] rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mt-4" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                    <Skeleton className="h-8 w-full mt-4 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 mb-3">{display.length} results</div>
                {display.length === 0 ? (
                  <div className="text-gray-600">No products match your filters.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {display.map((p, i) => {
                      const img = Array.isArray(p.images) && p.images.length ? p.images[0] : "/favicon.ico";
                      const base = Number((p as any).discountedPrice ?? p.price ?? 0);
                      const vipOff = vipEligible ? VIP_OFF : 0;
                      const finalPrice = Math.max(0, base - vipOff);
                      const mrp = Number(p.mrp || 0);
                      const discount = mrp && mrp > base ? Math.round(((mrp - base) / mrp) * 100) : 0;
                      const delay = (i % 12) * 40; // gentle stagger
                      return (
                        <div key={p._id} className="group bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow-card hover:shadow-lg transition-transform duration-300 hover:-translate-y-1.5 p-4 flex flex-col">
                          <div className="aspect-[3/4] w-full rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                            <img src={img} alt={p.title || (p as any).name || "Product"} className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" decoding="async" />
                          </div>
                          <div className="mt-3 text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px]">{p.title || (p as any).name}</div>
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
                            <button onClick={() => navigate(`${shop ? `/${shop}` : ""}/product/${p._id}`)} className="h-9 rounded-full border border-gray-300 text-sm hover:bg-gray-50">View</button>
                            <button onClick={() => addToCart(p)} className="h-9 w-24 rounded-full bg-[hsl(var(--primary))] text-white text-sm shadow-button hover:brightness-95">Add to Cart</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Shop;
