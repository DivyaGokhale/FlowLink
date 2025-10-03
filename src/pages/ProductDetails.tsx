import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../components/ToastContext";
import BackButton from "../components/BackButton";

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/products.json`);
        const data = await res.json();
        const mapped: Product[] = (data || []).map((d: any) => ({
          _id: String(d._id || d.id),
          name: d.title || d.name || "Untitled",
          pack: d.pack,
          price: typeof d.price === "number" ? d.price : parseFloat(d.price || "0"),
          image: Array.isArray(d.images) && d.images.length > 0 ? d.images[0] : d.image,
          desc: d.description || d.desc,
        }));
        setAllProducts(mapped);
        const selected = mapped.find((p) => p._id === String(id));
        setProduct(selected || null);
      } catch (err) {
        console.error("Error loading local products.json:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addToCart = () => {
    if (!product) return;

    const storedCart: Product[] = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = storedCart.find((item) => item._id === product._id);

    let updatedCart;
    if (existing) {
      updatedCart = storedCart.map((item) =>
        item._id === product._id
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item
      );
    } else {
      updatedCart = [...storedCart, { ...product, quantity: 1 }];
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    showToast(`✅ ${product.name} added to cart`);
  };

  if (loading) {
    return <p className="text-center py-6">Loading product...</p>;
  }

  if (!product) {
    return <p className="text-center py-6 text-red-500">Product not found.</p>;
  }

  return (
    <>
      <Header />
      <BackButton />
      <div className="max-w-6xl mx-auto px-6 py-10">
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
              ₹{product.price}
            </p>
            {product.desc && (
              <p className="text-gray-700 mb-6">{product.desc}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={addToCart}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Add to Cart
              </button>
              <button
                onClick={() => navigate("/addToCart")}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
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
                  className="cursor-pointer border rounded-xl p-4 hover:shadow-md transition"
                  onClick={() => navigate(`/product/${item._id}`)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    width={112}
                    height={112}
                    loading="lazy"
                    decoding="async"
                    className="w-28 h-28 mx-auto object-contain"
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
