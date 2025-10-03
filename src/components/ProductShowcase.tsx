import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/ToastContext"; // ✅ import toast
import { useAuth } from "./AuthContext";

interface Product {
  _id: string;
  name: string;
  pack?: string;
  price: number;
  image?: string;
  quantity?: number;
}

const ProductShowcase: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast(); // ✅ get toast function
  const { token, user } = useAuth();

  useEffect(() => {
    // Load from local public/products.json
    fetch(`/products.json`)
      .then((res) => res.json())
      .then((data: any[]) => {
        const mapped: Product[] = (data || []).map((d) => ({
          _id: String(d._id || d.id),
          name: d.title || d.name || "Untitled",
          pack: d.pack,
          price: typeof d.price === "number" ? d.price : parseFloat(d.price || "0"),
          image: Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : d.image,
        }));
        setProducts(mapped);
      })
      .catch((err) => {
        console.error("Error loading local products.json:", err);
      })
      .finally(() => setLoading(false));
  }, [token, user?.id]);

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
    showToast(`✅ ${product.name} added to cart`);
  };

  if (loading) {
    return (
      <section className="w-full bg-white py-12">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-normal mb-2">Your Go-To Items</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border rounded-2xl p-5 sm:p-6 animate-pulse">
                <div className="aspect-square w-full rounded-lg bg-gray-100 mb-5" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-9 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white py-12">
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-normal mb-2">Your Go-To Items</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {products.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-gray-100 rounded-2xl shadow-card hover:shadow-md transition-transform duration-200 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20 flex flex-col justify-between items-start p-5 sm:p-6 min-h-[280px]"
            >
              <Link to={`/product/${item._id}`} className="w-full no-underline text-inherit outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/20 rounded-lg">
                <div className="aspect-square w-full rounded-lg bg-gray-50 flex items-center justify-start mb-5 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={112}
                    height={112}
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain transition-transform duration-200 hover:scale-[1.03]"
                  />
                </div>
                <div
                  className="text-base sm:text-lg font-medium text-left mb-2 text-gray-800"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {item.name}
                </div>
              </Link>
              <div className="w-full" style={{ minHeight: 50 }}>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">{item.pack}</div>
                <div className="text-sm sm:text-base font-semibold text-gray-900">₹{item.price}</div>
              </div>
              <button
                onClick={() => addToCart(item)}
                className="w-full bg-[hsl(var(--primary))] text-white text-sm sm:text-base py-2.5 rounded-full hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/30 shadow-button transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
