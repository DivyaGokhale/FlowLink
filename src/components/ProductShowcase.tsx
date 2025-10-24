import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/ToastContext";
import { useAuth } from "./AuthContext";
import Skeleton from "./ui/Skeleton";
import { fadeIn, scaleVariants } from "../lib/animations";

interface Product {
  _id: string;
  name: string;
  category?: string;
  pack?: string;
  price: number;
  mrp?: number;
  image?: string;
  quantity?: number;
}

const ProductShowcase: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast(); // ✅ get toast function
  const { token, user } = useAuth();
  const { shop } = useParams<{ shop?: string }>();

  useEffect(() => {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";
    const load = async () => {
      try {
        setLoading(true);
        const qs = shop ? `?shop=${encodeURIComponent(shop)}` : "";
        const res = await fetch(`${baseUrl}/products${qs}`);
        const data = await res.json();
        const mapped: Product[] = (data || []).map((d: any) => ({
          _id: String(d._id || d.id),
          name: d.title || d.name || "Untitled",
          category: d.category,
          pack: d.pack,
          price: typeof d.price === "number" ? d.price : parseFloat(d.price || "0"),
          mrp: typeof d.mrp === 'number' ? d.mrp : (d.mrp ? parseFloat(d.mrp) : undefined),
          image: Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : d.image,
          quantity: typeof d.quantity === 'number' ? d.quantity : undefined,
        }));
        setProducts(mapped);
      } catch (err) {
        console.error("Error loading products from API:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user?.id, shop]);

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

  // Animation variants with proper TypeScript types
  const getFadeInVariant = (index: number) => ({
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const
      }
    })
  });

  return (
    <div className="w-full bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-normal mb-8">Your Go-To Items</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            <AnimatePresence>
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div 
                  key={i}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div 
                  key={product._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                  variants={getFadeInVariant(index)}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <Link to={`/product/${product._id}`} className="block">
                    <motion.div 
                      className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative group"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      {product.image ? (
                        <motion.img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      ) : (
                        <div className="text-gray-400">No Image</div>
                      )}
                      <motion.div 
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      />
                    </motion.div>
                    <div className="p-4">
                      <motion.h3 
                        className="font-medium text-gray-900 mb-1 line-clamp-2 h-12"
                        whileHover={{ color: '#2563eb' }}
                        transition={{ duration: 0.2 }}
                      >
                        {product.name}
                      </motion.h3>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <motion.span 
                            className="text-lg font-semibold text-gray-900"
                            whileHover={{ scale: 1.05 }}
                          >
                            ₹{product.price.toFixed(2)}
                          </motion.span>
                          {product.mrp && product.mrp > product.price && (
                            <motion.span 
                              className="ml-2 text-sm text-gray-500 line-through"
                              initial={{ opacity: 0.8 }}
                              whileHover={{ opacity: 1 }}
                            >
                              ₹{product.mrp.toFixed(2)}
                            </motion.span>
                          )}
                        </div>
                      </div>
                      {product.pack && (
                        <motion.div 
                          className="mt-1 text-sm text-gray-500"
                          initial={{ opacity: 0.8 }}
                          whileHover={{ opacity: 1 }}
                        >
                          {product.pack}
                        </motion.div>
                      )}
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!token) {
                          showToast("Please login to add items to cart");
                          return;
                        }
                        addToCart(product);
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                      whileTap={{ scale: 0.98 }}
                      initial={false}
                    >
                      Add to Cart
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;
