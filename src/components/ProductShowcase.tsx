import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  image: string;
}

const ProductShowcase: React.FC = () => {
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
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading products...</h2>;
  }

  return (
    <section style={{ width: "100%", background: "#fff", padding: "36px 0" }}>
      <h2
        style={{
          fontSize: "2.2rem",
          fontWeight: 400,
          marginLeft: "60px",
          marginBottom: "28px",
        }}
      >
        Your Go-To Items
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          padding: "0 60px",
        }}
      >
        {products.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#fff",
              boxShadow: "0 0 0 1px #ededed",
              borderRadius: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px",
              minHeight: "360px",
            }}
          >
            <Link
              to={`/product/${item.id}`}
              style={{ textDecoration: "none", color: "inherit", width: "100%" }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "contain",
                  marginBottom: "16px",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              />
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 500,
                  marginBottom: "4px",
                  textAlign: "center",
                }}
              >
                {item.name}
              </div>
            </Link>
            <div style={{ fontSize: "1rem", color: "#666", marginBottom: "8px" }}>
              {item.pack}
            </div>
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: 500,
                marginBottom: "18px",
              }}
            >
              ₹{item.price}
            </div>
            <button
              style={{
                background: "#43b02a",
                color: "#fff",
                border: "none",
                borderRadius: "7px",
                padding: "12px 0",
                fontSize: "1.1rem",
                fontWeight: 500,
                width: "100%",
                cursor: "pointer",
              }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductShowcase;
