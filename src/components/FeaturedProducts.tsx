import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";


interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  image: string;
  desc?: string;
}

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/products.json")
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching featured products:", err);
        setLoading(false);
      });
  }, []);

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
          <Link
            to={`/product/${product.id}`}
            key={product.id}
            className="bg-white border rounded-xl shadow-sm p-4 flex flex-col items-center hover:shadow-md transition"
          >
            {/* Product Image */}
            <div className="w-32 h-32 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="max-h-28 object-contain"
              />
            </div>

            {/* Product Info */}
            <h3 className="mt-4 text-sm font-medium text-gray-800 text-center">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500">{product.pack}</p>
            <p className="mt-2 text-base font-semibold text-gray-900">
              ₹{product.price}
            </p>

            {/* Add to Cart */}
            <button className="mt-3 w-full bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 transition">
              Add to Cart
            </button>
          </Link>
        ))}
      </div>
    </section>
  );
};


export default FeaturedProducts;
