import { Link } from "react-router-dom";

// Define the shape of a single product object
interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  image: string;
  offers?: string[];
}

// Define the props that this component will accept
interface RelatedProductsProps {
  products: Product[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
  return (
    <section className="w-full px-6 py-10">
      <h2 className="text-2xl font-semibold mb-6">You may also like</h2>
      
      {/* Check if there are any products to display */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {products.map((item) => (
            <Link
              to={`/product/${item.id}`}
              key={item.id}
              className="block border rounded-lg shadow-sm p-4 hover:shadow-md transition relative text-left"
            >
              {/* Conditionally render an offer badge if available */}
              {item.offers && item.offers.length > 0 && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  {item.offers[0]}
                </span>
              )}
              
              <img
                src={item.image}
                alt={item.name}
                className="w-32 h-32 object-contain mb-3"
              />
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.pack}</p>
              <p className="text-green-600 font-bold">₹{item.price}</p>
            </Link>
          ))}
        </div>
      ) : (
        // Display a message if no related products are found
        <p className="text-gray-500">No related products available</p>
      )}
    </section>
  );
};

export default RelatedProducts;