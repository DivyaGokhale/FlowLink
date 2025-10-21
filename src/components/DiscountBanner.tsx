import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const DiscountBanner = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shop) { setShopInfo(null); return; }
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";
    let ignore = false;
    setLoading(true);
    fetch(`${baseUrl}/shops/${encodeURIComponent(shop)}`)
      .then(async (res) => { if (!ignore && res.ok) { const data = await res.json(); setShopInfo(data); } })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [shop]);
  return (
  <section className="relative w-full overflow-hidden py-12 bg-gradient-hero">
    {/* Decorative blobs */}
    <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[hsl(var(--primary))/0.08] blur-2xl" />
    <div className="pointer-events-none absolute bottom-0 -right-10 w-56 h-56 rounded-full bg-[hsl(var(--primary))/0.08] blur-2xl" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-6 md:gap-10">
      {/* Left section: Text & CTA */}
      <div className="flex-1 min-w-0 text-left animate-fade-in-up">
        <h2 className="text-3xl sm:text-4xl font-semibold mb-3 text-gray-900">
          {shop ? (
            <>
              Welcome to {loading ? '...' : (shopInfo?.name || shop)} —
              <span className="ml-2 bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">10% OFF</span> your first order
            </>
          ) : (
            <>Get <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">10% OFF</span> on your first order</>
          )}
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6">
          {shop ? `Shop from ${loading ? 'your favorite store' : (shopInfo?.name || shop)} with fast delivery and great prices.` : 'Fresh groceries delivered fast. Hand-picked quality at the best prices.'}
        </p>
        <button onClick={() => navigate(shop ? `/${shop}/shop` : '/shop')} className="inline-flex items-center justify-center bg-[hsl(var(--primary))] hover:brightness-95 text-white text-sm sm:text-base font-medium rounded-full px-6 sm:px-8 py-3 shadow-button transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/30 active:scale-[0.99]">
          Shop Now
          <svg className="ml-2" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Right section: Promo image */}
      <div className="w-full md:w-auto md:basis-[520px] lg:basis-[600px] md:shrink-0 flex items-center justify-center rounded-2xl overflow-hidden shadow-card h-48 sm:h-56 md:h-64">
        <img
          src={shopInfo?.cover || "/assets/teatime.png"}
          alt={(shopInfo?.name ? `${shopInfo.name} Cover` : "Promo Banner")}
          className="block w-full h-full animate-float object-cover object-left"
          onError={(e) => { const t = e.currentTarget as HTMLImageElement; if (t.src !== "/assets/teatime.png") t.src = "/assets/teatime.png"; }}
        />
      </div>
    </div>
  </section>
  );
}

export default DiscountBanner;
