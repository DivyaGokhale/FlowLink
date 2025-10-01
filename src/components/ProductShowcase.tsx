import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/ToastContext"; // ✅ import toast

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

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const USER_ID = import.meta.env.VITE_ADMIN_USER_ID;
    if (!USER_ID) {
      console.warn("VITE_ADMIN_USER_ID is not set. API may return 401.");
    }
    fetch(`${API_BASE}/products`, {
      headers: {
        "x-user-id": USER_ID || "",
      },
    })
      .then((res) => res.json())
      .then((data: any[]) => {
        const mapped: Product[] = (data || []).map((d) => ({
          _id: d._id,
          name: d.title || d.name || "Untitled",
          pack: d.pack,
          price: typeof d.price === "number" ? d.price : parseFloat(d.price || "0"),
          image: Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : d.image,
        }));
        setProducts(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
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
    showToast(`✅ ${product.name} added to cart`);
  };

  if (loading) {
    return (
      <section className="w-full bg-white py-9">
        <div className="max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-normal mb-6">Your Go-To Items</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border rounded-2xl p-4 sm:p-5 animate-pulse">
                <div className="aspect-square w-full rounded-lg bg-gray-100 mb-4" />
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
    <section className="w-full bg-white py-9">
      <div className="max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-normal mb-6">Your Go-To Items</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-transform duration-200 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-black/10 flex flex-col justify-between items-start p-4 sm:p-5 min-h-[300px]"
            >
              <Link to={`/product/${item._id}`} className="w-full no-underline text-inherit outline-none focus-visible:ring-2 focus-visible:ring-black/10 rounded-lg">
                <div className="aspect-square w-full rounded-lg bg-gray-50 flex items-center justify-start mb-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={112}
                    height={112}
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                  />
                </div>
                <div className="text-base sm:text-lg font-medium text-left mb-1 text-gray-800">{item.name}</div>
              </Link>
              <div className="text-xs sm:text-sm text-gray-500 mb-1">{item.pack}</div>
              <div className="text-sm sm:text-base font-semibold mb-3 text-gray-900">₹{item.price}</div>
              <button
                onClick={() => addToCart(item)}
                className="w-full bg-green-600 text-white text-sm sm:text-base py-2.5 rounded-md hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 transition"
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
