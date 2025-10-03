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
    showToast(`✅ ${product.name} added to cart`);
  };

  if (loading) {
    return <h2 className="text-center">Loading featured products...</h2>;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white border border-gray-100 rounded-2xl shadow-card p-4 flex flex-col items-center hover:shadow-md transition hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20"
          >
            {/* Product Image */}
            <Link to={`/product/${product._id}`} className="w-32 h-32 flex items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/20 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                width={112}
                height={112}
                loading="lazy"
                decoding="async"
                className="max-h-28 object-contain transition-transform duration-200 hover:scale-[1.03]"
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
              className="mt-3 w-full bg-[hsl(var(--primary))] text-white text-sm py-2.5 rounded-full hover:brightness-95 shadow-button transition"
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
