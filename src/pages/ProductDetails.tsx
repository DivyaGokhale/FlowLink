
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext";
import BackButton from "../components/BackButton";
import Skeleton from "../components/ui/Skeleton";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../components/AuthContext";
import { useCart } from "../components/CartContext";
import { apiService, Product } from "../lib/api";
import { formatPrice, getErrorMessage, getApiBaseUrl } from "../lib/utils";
import ProductGallery from "../components/ProductGallery";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";
import AIRecommendations from "../components/AIRecommendations";
import { motion } from "framer-motion";

const ProductDetails: React.FC = () => {
  const { id, shop } = useParams<{ id: string; shop?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { vipEligible } = useAuth();
  const { addToCart, isLoading: cartLoading } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setProduct(null);

      const mapDoc = (d: any): Product => ({
        _id: String(d._id || d.id || d.sku || d.title || Math.random().toString(36).substr(2, 9)),
        title: d.title || d.name || "Untitled",
        description: d.description || d.desc,
        price: typeof d.discountedPrice === "number" ? d.discountedPrice : parseFloat(d.price || "0"),
        images: Array.isArray(d.images) && d.images.length > 0 ? d.images : d.image ? [d.image] : [],
        quantity: typeof d.quantity === "number" ? d.quantity : undefined,
        category: d.category,
        mrp: d.mrp,
        pack: d.pack,
        brand: d.brand
      });

      let selected: Product | null = null;
      let list: Product[] = [];

      try {
        const [detailRes, listRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/products/${id}${shop ? `?shop=${encodeURIComponent(shop)}` : ""}`),
          fetch(`${getApiBaseUrl()}/products${shop ? `?shop=${encodeURIComponent(shop)}` : ""}`),
        ]);

        if (detailRes.ok) {
          const d = await detailRes.json();
          selected = mapDoc(d);
        }

        if (listRes.ok) {
          const arr = await listRes.json();
          list = Array.isArray(arr) ? arr.map(mapDoc) : [];
        }
      } catch { }

      // fallback to local json
      if ((!selected || !selected._id) || list.length === 0) {
        try {
          const resLocal = await fetch("/products.json");
          if (resLocal.ok) {
            const dataLocal = await resLocal.json();
            const mappedLocal: Product[] = (dataLocal || []).map((d: any) => ({
              ...mapDoc(d),
              _id: String(d._id || d.id || d.sku || d.title || Math.random().toString(36).substr(2, 9))
            }));

            if (!selected) {
              selected = mappedLocal.find(
                (p) =>
                  String(p._id).trim() === String(id).trim() ||
                  String((p as any).id).trim() === String(id).trim() ||
                  String((p as any).sku || '').trim() === String(id).trim() ||
                  String(p.title || '').trim() === String(id).trim()
              ) || null;
            }
            if (list.length === 0) list = mappedLocal;
          }
        } catch { }
      }

      if (!cancelled) {
        setAllProducts(list);
        setProduct(selected);
        setLoading(false);
        if (selected) fetchReviews(selected._id);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id, shop]);

  const fetchReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/reviews/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const VIP_OFF = 15;

  const handleAddToCart = async () => {
    if (!product) return;
    const vipPrice = Math.max(0, (product.price || 0) - (vipEligible ? VIP_OFF : 0));
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const displayPrice = Math.max(0, (product.price || 0) - (vipEligible ? VIP_OFF : 0));
  const hasDiscount = product.mrp && product.mrp > displayPrice;
  const discountPercent = hasDiscount ? Math.round(((product.mrp! - displayPrice) / product.mrp!) * 100) : 0;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <BackButton fallbackPath={shop ? `/${shop}` : "/shop"} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery images={product.images || []} title={product.title} />
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {product.brand && (
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                  {product.brand}
                </span>
              )}
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.title}</h1>
              {product.pack && <p className="text-gray-500 mt-1">{product.pack}</p>}
            </div>

            {/* Price Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">{formatPrice(displayPrice)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.mrp!)}</span>
                    <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              {vipEligible && (product.price || 0) > displayPrice && (
                <div className="mt-2 text-sm text-purple-700 font-medium flex items-center gap-1">
                  <span>👑 VIP Savings Applied: ₹{VIP_OFF} off</span>
                </div>
              )}

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg h-12">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 h-full hover:bg-gray-100 rounded-l-lg transition"
                  >-</button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 h-full hover:bg-gray-100 rounded-r-lg transition"
                  >+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="flex-1 h-12 bg-[hsl(var(--primary))] text-white font-semibold rounded-lg shadow-button hover:brightness-95 transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {cartLoading ? <Spinner size="sm" variant="secondary" /> : "Add to Cart"}
                </button>
              </div>
            </div>

            {/* AI Recommendations */}
            <AIRecommendations currentProduct={{
              _id: product._id,
              name: product.title,
              category: product.category,
              description: product.description
            }} />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
              <div className="text-center">
                <div className="text-2xl mb-1">🚚</div>
                <p className="text-xs text-gray-600 font-medium">Fast Delivery</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🛡️</div>
                <p className="text-xs text-gray-600 font-medium">Secure Payment</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">↩️</div>
                <p className="text-xs text-gray-600 font-medium">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {['desc', 'specs', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-[hsl(var(--primary))]' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab === 'desc' ? 'Description' : tab === 'specs' ? 'Specifications' : 'Reviews'}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--primary))]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 min-h-[300px]">
            {activeTab === 'desc' && (
              <div className="prose max-w-none text-gray-600">
                <p>{product.description || "No description available for this product."}</p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {product.brand && (
                  <div className="flex justify-between border-b border-gray-50 py-2">
                    <span className="text-gray-500">Brand</span>
                    <span className="font-medium text-gray-900">{product.brand}</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex justify-between border-b border-gray-50 py-2">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-900">{product.category}</span>
                  </div>
                )}
                {product.pack && (
                  <div className="flex justify-between border-b border-gray-50 py-2">
                    <span className="text-gray-500">Pack Size</span>
                    <span className="font-medium text-gray-900">{product.pack}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <ReviewForm productId={product._id} onReviewSubmitted={() => fetchReviews(product._id)} />
                </div>
                <div className="md:col-span-2">
                  <ReviewList reviews={reviews} loading={reviewsLoading} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {allProducts
              .filter(p => p._id !== product._id && p.category === product.category)
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item._id}
                  className="cursor-pointer bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all"
                  onClick={() => navigate(`${shop ? `/${shop}` : ""}/product/${item._id}`)}
                >
                  <div className="aspect-square mb-3 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={item.images?.[0] || "/placeholder.jpg"}
                      alt={item.title}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 h-10">{item.title}</h3>
                  <p className="mt-2 font-bold text-gray-900">{formatPrice(item.price)}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
