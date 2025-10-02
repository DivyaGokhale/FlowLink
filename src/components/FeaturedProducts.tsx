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
  desc?: string;
  quantity?: number;
}

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast(); // ✅ get toast function
  const { user } = useAuth();

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const ADMIN_ID = import.meta.env.VITE_ADMIN_USER_ID;
    const effectiveUserId = ADMIN_ID || user?.id || "";
    if (!effectiveUserId) {
      console.warn("Missing user id: set VITE_ADMIN_USER_ID or ensure user is logged in.");
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/products`, {
      headers: {
        "x-user-id": effectiveUserId,
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
          desc: d.description,
        }));
        setProducts(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching featured products:", err);
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
    return <h2 className="text-center">Loading featured products...</h2>;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Featured Products
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white border rounded-xl shadow-sm p-4 flex flex-col items-center hover:shadow-md transition"
          >
            {/* Product Image */}
            <Link to={`/product/${product._id}`} className="w-32 h-32 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                width={112}
                height={112}
                loading="lazy"
                decoding="async"
                className="max-h-28 object-contain"
              />
            </Link>

            {/* Product Info */}
            <h3 className="mt-4 text-sm font-medium text-gray-800 text-center">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500">{product.pack}</p>
            <p className="mt-2 text-base font-semibold text-gray-900">
              ₹{product.price}
            </p>

            {/* Add to Cart */}
            <button
              onClick={() => addToCart(product)}
              className="mt-3 w-full bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 transition"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
