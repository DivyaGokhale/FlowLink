import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../components/ToastContext";
import BackButton from "../components/BackButton";
import Skeleton from "../components/ui/Skeleton";
import { useAuth } from "../components/AuthContext";

interface Product {
  _id: string;
  name: string;
  pack?: string;
  price: number;
  image?: string;
  desc?: string;
  quantity?: number;
}

const ProductDetails: React.FC = () => {
  const { id, shop } = useParams<{ id: string, shop?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { vipEligible } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";

      const mapDoc = (d: any): Product => ({
        _id: String(d._id || d.id),
        name: d.title || d.name || "Untitled",
        pack: d.pack,
        // prefer discounted price from backend if available
        price: typeof d.discountedPrice === 'number'
          ? d.discountedPrice
          : (typeof d.price === 'number' ? d.price : parseFloat(d.price || '0')),
        image: Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : d.image,
        desc: d.description || d.desc,
        quantity: typeof d.quantity === 'number' ? d.quantity : undefined,
      })

      let selected: Product | null = null
      let list: Product[] = []

      // Try API first (details + list for recommendations)
      try {
        const [detailRes, listRes] = await Promise.all([
          fetch(`${baseUrl}/products/${id}${shop ? `?shop=${encodeURIComponent(shop)}` : ""}`),
          fetch(`${baseUrl}/products${shop ? `?shop=${encodeURIComponent(shop)}` : ""}`)
        ])
        if (detailRes.ok) {
          const d = await detailRes.json();
          selected = mapDoc(d)
        }
        if (listRes.ok) {
          const arr = await listRes.json();
          list = Array.isArray(arr) ? arr.map(mapDoc) : []
        }
      } catch (_) {
        // ignore; fall back to local
      }

      // Fallback to local JSON
      if (!selected || list.length === 0) {
        try {
          const resLocal = await fetch('/products.json')
          if (resLocal.ok) {
            const dataLocal = await resLocal.json()
            const mappedLocal: Product[] = (dataLocal || []).map(mapDoc)
            if (!selected) selected = mappedLocal.find(p => p._id === String(id)) || null
            if (list.length === 0) list = mappedLocal
          }
        } catch (_) {
          // swallow
        }
      }

      setAllProducts(list)
      setProduct(selected)
      setLoading(false)
    };
    load();
  }, [id, shop]);

  const VIP_OFF = 15; // rupees off for VIP
  const addToCart = () => {
    if (!product) return;

    const storedCart: Product[] = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = storedCart.find((item) => item._id === product._id);
    const vipPrice = Math.max(0, (product.price || 0) - (vipEligible ? VIP_OFF : 0));

    let updatedCart;
    if (existing) {
      updatedCart = storedCart.map((item) =>
        item._id === product._id
          ? { ...item, price: vipPrice, quantity: (item.quantity || 1) + 1 }
          : item
      );
    } else {
      updatedCart = [...storedCart, { ...product, price: vipPrice, quantity: 1 }];
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    showToast(`✅ ${product.name} added to cart`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <BackButton fallbackPath={shop ? `/${shop}/shop` : "/shop"} />
        <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex justify-center">
              <Skeleton className="w-80 h-80 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-8 w-2/3 mb-3" />
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-6 w-1/4 mb-4" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-4 mt-6">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return <p className="text-center py-6 text-red-500">Product not found.</p>;
  }

  return (
    <>
      <Header />
      <BackButton fallbackPath={shop ? `/${shop}/shop` : "/shop"} />
      <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in-up">
        {/* Product Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left: Image */}
          <div className="flex justify-center">
            <img
              src={product.image}
              alt={product.name}
              width={320}
              height={320}
              loading="lazy"
              decoding="async"
              className="w-80 h-80 object-contain border rounded-xl p-4"
            />
          </div>

          {/* Right: Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-500 mb-2">{product.pack}</p>
            <p className="text-2xl font-semibold text-green-600 mb-4">
              ₹{Math.max(0, (product.price || 0) - (vipEligible ? VIP_OFF : 0))}
            </p>
            {product.desc && (
              <p className="text-gray-700 mb-6">{product.desc}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={addToCart}
                className="bg-[hsl(var(--primary))] text-white px-6 py-2 rounded-lg shadow-button hover:brightness-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/40 active:scale-[0.99]"
              >
                Add to Cart
              </button>
              <button
                onClick={() => navigate(`${shop ? `/${shop}` : ""}/addToCart`)}
                className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:brightness-105 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/30 active:scale-[0.99]"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>

        {/* You may also like */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {allProducts
              .filter((p) => p._id !== product._id)
              .slice(0, 4)
              .map((item) => (
                <div
                  key={item._id}
                  className="cursor-pointer bg-white/90 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow-card transition-transform duration-300 hover:shadow-lg hover:-translate-y-1.5"
                  onClick={() => navigate(`${shop ? `/${shop}` : ""}/product/${item._id}`)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    width={112}
                    height={112}
                    loading="lazy"
                    decoding="async"
                    className="w-28 h-28 mx-auto object-contain transition-transform duration-300 hover:scale-[1.05]"
                  />
                  <p className="mt-2 text-sm font-medium text-center">
                    {item.name}
                  </p>
                  <p className="text-center text-green-600 font-semibold">
                    ₹{item.price}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ProductDetails;
