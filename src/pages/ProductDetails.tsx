import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../components/ToastContext";
import BackButton from "../components/BackButton";
import Skeleton from "../components/ui/Skeleton";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../components/AuthContext";
import { useCart } from "../components/CartContext";
import { apiService, Product } from "../lib/api";
import { formatPrice, getErrorMessage, getShopSlugFromUrl, getApiBaseUrl } from "../lib/utils";

const ProductDetails: React.FC = () => {
  const { id, shop } = useParams<{ id: string; shop?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { vipEligible, isAuthenticated } = useAuth();
  const { addToCart, isLoading: cartLoading } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setProduct(null); // reset previous product when id changes

      const mapDoc = (d: any): Product => ({
        _id: String(d._id || d.id),
        title: d.title || d.name || "Untitled",
        description: d.description || d.desc,
        price:
          typeof d.discountedPrice === "number"
            ? d.discountedPrice
            : typeof d.price === "number"
            ? d.price
            : parseFloat(d.price || "0"),
        images: Array.isArray(d.images) ? d.images : d.image ? [d.image] : [],
        quantity: typeof d.quantity === "number" ? d.quantity : undefined,
        category: d.category,
      });

      let selected: Product | null = null;
      let list: Product[] = [];

      try {
        const [detailRes, listRes] = await Promise.all([
          fetch(
            `${getApiBaseUrl()}/products/${id}${
              shop ? `?shop=${encodeURIComponent(shop)}` : ""
            }`
          ),
          fetch(
            `${getApiBaseUrl()}/products${
              shop ? `?shop=${encodeURIComponent(shop)}` : ""
            }`
          ),
        ]);

        if (detailRes.ok) {
          const d = await detailRes.json();
          selected = mapDoc(d);
        }

        if (listRes.ok) {
          const arr = await listRes.json();
          list = Array.isArray(arr) ? arr.map(mapDoc) : [];
        }
      } catch {
        // fallback below
      }

      // fallback to local json
      if ((!selected || !selected._id) || list.length === 0) {
        try {
          const resLocal = await fetch("/products.json");
          if (resLocal.ok) {
            const dataLocal = await resLocal.json();
            const mappedLocal: Product[] = (dataLocal || []).map(mapDoc);

            if (!selected) {
              selected =
                mappedLocal.find(
                  (p) =>
                    String(p._id).trim() === String(id).trim() ||
                    String((p as any).id).trim() === String(id).trim()
                ) || null;
            }

            if (list.length === 0) list = mappedLocal;
          }
        } catch {
          // ignore
        }
      }

      if (!cancelled) {
        setAllProducts(list);
        setProduct(selected);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, shop]);

  const VIP_OFF = 15;
  
  const handleAddToCart = async () => {
    if (!product) return;

    const vipPrice = Math.max(
      0,
      (product.price || 0) - (vipEligible ? VIP_OFF : 0)
    );

    const productToAdd = {
      ...product,
      id: product._id,
      price: vipPrice,
      name: product.title,
      image: product.images?.[0],
    };

    await addToCart(productToAdd, quantity);
  };

  if (loading) {
    return (
      <>
        <Header />
        <BackButton fallbackPath={shop ? `/${shop}` : "/shop"} />
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
    return (
      <p className="text-center py-6 text-red-500">Product not found.</p>
    );
  }

  return (
    <>
      <Header />
      <BackButton fallbackPath={shop ? `/${shop}` : "/shop"} />
      <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex justify-center">
            <img
              src={product.images?.[0] || "/placeholder.jpg"}
              alt={product.title}
              width={320}
              height={320}
              loading="lazy"
              decoding="async"
              className="w-80 h-80 object-contain border rounded-xl p-4"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <p className="text-2xl font-semibold text-green-600 mb-4">
              {formatPrice(Math.max(0, (product.price || 0) - (vipEligible ? VIP_OFF : 0)))}
            </p>
            {product.description && (
              <p className="text-gray-700 mb-6">{product.description}</p>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className="bg-[hsl(var(--primary))] text-white px-6 py-2 rounded-lg shadow-button hover:brightness-95 transition disabled:opacity-50 flex items-center gap-2"
              >
                {cartLoading ? (
                  <>
                    <Spinner size="sm" variant="secondary" />
                    Adding...
                  </>
                ) : (
                  "Add to Cart"
                )}
              </button>
              <button
                onClick={() =>
                  navigate(`${shop ? `/${shop}` : ""}/addToCart`)
                }
                className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:brightness-105 transition"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Related Products */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {allProducts
              .filter(
                (p) =>
                  p._id !== product._id &&
                  p.category &&
                  product.category &&
                  p.category.toLowerCase() === product.category.toLowerCase()
              )
              .slice(0, 4)
              .map((item) => (
                <div
                  key={item._id}
                  className="cursor-pointer bg-white/90 backdrop-blur border border-gray-100 rounded-2xl p-4 shadow-card hover:shadow-lg hover:-translate-y-1.5 transition-transform"
                  onClick={() =>
                    navigate(
                      `${shop ? `/${shop}` : ""}/product/${item._id}`
                    )
                  }
                >
                  <img
                    src={item.images?.[0] || "/placeholder.jpg"}
                    alt={item.title}
                    width={112}
                    height={112}
                    loading="lazy"
                    decoding="async"
                    className="w-28 h-28 mx-auto object-contain transition-transform duration-300 hover:scale-[1.05]"
                  />
                  <p className="mt-2 text-sm font-medium text-center">
                    {item.title}
                  </p>
                  <p className="text-center text-green-600 font-semibold">
                    {formatPrice(item.price)}
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
