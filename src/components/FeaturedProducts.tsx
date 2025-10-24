import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useToast } from "../components/ToastContext"; // ✅ import toast
import { useAuth } from "./AuthContext";
import Skeleton from "./ui/Skeleton";

interface Product {
  _id: string;
  name: string;
  category?: string;
  pack?: string;
  price: number;
  mrp?: number;
  image?: string;
  desc?: string;
  quantity?: number;
}

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast(); // ✅ get toast function
  const { user } = useAuth();
  const { shop } = useParams<{ shop?: string }>();

  useEffect(() => {
    // Load from local public/products.json
    fetch(`/products.json`)
      .then((res) => res.json())
      .then((data: any[]) => {
        const mapped: Product[] = (data || []).map((d) => ({
          _id: String(d._id || d.id),
          name: d.title || d.name || "Untitled",
          category: d.category,
          pack: d.pack,
          price: typeof d.price === "number" ? d.price : parseFloat(d.price || "0"),
          mrp: typeof (d as any).mrp === 'number' ? (d as any).mrp : ((d as any).mrp ? parseFloat((d as any).mrp) : undefined),
          image: Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : d.image,
          desc: d.description || d.desc,
        }));
        setProducts(mapped);
      })
      .catch((err) => {
        console.error("Error loading local products.json:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product: Product) => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const updatedCart = existingCart.some((item: Product) => item._id === product._id)
      ? existingCart.map((item: Product) =>
          item._id === product._id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        )
      : [...existingCart, { ...product, quantity: 1 }];

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    try { window.dispatchEvent(new Event("cart-updated")); } catch {}
    showToast(`✅ ${product.name} added to cart`);
  };

  if (loading) {
    return (
      <section id="deals" className="w-full max-w-7xl mx-auto px-6 py-10 animate-fade-in-up scroll-mt-24 md:scroll-mt-28">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-card p-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 mt-3" />
              <Skeleton className="h-3 w-1/2 mt-2" />
              <Skeleton className="h-8 w-full mt-3 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="deals" className="w-full max-w-7xl mx-auto px-6 py-10 animate-fade-in-up scroll-mt-24 md:scroll-mt-28">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
        {products.map((product) => {
          const hasDiscount = product.mrp && product.mrp > (product.price || 0);
          const discount = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;
          return (
            <div
              key={product._id}
              className="group bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow-card p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20 flex flex-col"
            >
              {/* Product Image */}
              <Link to={`${shop ? `/${shop}` : ""}/product/${product._id}`} className="w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/25 overflow-hidden">
                <div className="aspect-square w-full rounded-lg bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    width={160}
                    height={160}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              </Link>

              {/* Title */}
              <div className="mt-3 text-sm font-medium text-gray-800 line-clamp-2 min-h-[38px] text-left">{product.name}</div>
              {/* Category/Pack */}
              <div className="text-xs text-gray-500">{product.category || product.pack || 'Others'}</div>
              {/* Price Row */}
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-lg font-semibold text-gray-900">₹{product.price}</div>
                {hasDiscount && (
                  <>
                    <div className="text-xs line-through text-gray-400">₹{product.mrp}</div>
                    <span className="text-[11px] bg-rose-100 text-rose-700 rounded px-1.5 py-0.5">{discount}% off</span>
                  </>
                )}
              </div>
              {/* Actions */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to={`${shop ? `/${shop}` : ""}/product/${product._id}`} className="h-9 rounded-full border border-gray-300 text-center text-sm flex items-center justify-center hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/25">
                  View
                </Link>
                <button
                  onClick={() => addToCart(product)}
                  className="h-9 rounded-full bg-[hsl(var(--primary))] text-white text-sm shadow-button hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/35"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedProducts;
