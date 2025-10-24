import { Link, useParams } from "react-router-dom";

// Define the shape of a single product object
interface Product {
  _id: string;
  name: string;
  pack?: string;
  price: number;
  image?: string;
  category?: string;
  offers?: string[];
}

// Define props that this component will accept
interface RelatedProductsProps {
  products: Product[];
  currentProductId?: string;
  currentCategory?: string;
}

const RelatedProducts = ({
  products,
  currentProductId,
  currentCategory,
}: RelatedProductsProps) => {
  const { shop } = useParams<{ shop?: string }>();

  // ✅ Filter related products: same category, not the current one
  const related = products
    .filter(
      (p) =>
        p._id !== currentProductId &&
        (!currentCategory ||
          (p.category &&
            p.category.toLowerCase() === currentCategory.toLowerCase()))
    )
    .slice(0, 6); // show up to 6

  return (
    <section className="w-full px-6 py-10 animate-fade-in-up">
      <h2 className="text-2xl font-semibold mb-6">You may also like</h2>

      {related.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {related.map((item) => (
            <Link
              to={`${shop ? `/${shop}` : ""}/product/${item._id}`}
              key={item._id}
              className="block border border-gray-100 rounded-2xl shadow-card p-4 hover:shadow-md transition-transform hover:-translate-y-1.5 bg-white/90 backdrop-blur"
            >
              {/* Offer badge if available */}
              {item.offers && item.offers.length > 0 && (
                <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  {item.offers[0]}
                </span>
              )}

              <div className="flex justify-center mb-3">
                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="w-28 h-28 object-contain transition-transform duration-300 hover:scale-[1.05]"
                />
              </div>

              <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[36px]">
                {item.name}
              </h3>
              <p className="text-xs text-gray-500">{item.pack || "—"}</p>
              <p className="text-green-600 font-semibold mt-1">
                ₹{item.price}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No related products available</p>
      )}
    </section>
  );
};

export default RelatedProducts;
