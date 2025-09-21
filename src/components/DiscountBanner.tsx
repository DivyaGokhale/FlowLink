import React from "react";

const DiscountBanner = () => (
  <section
    style={{
      display: "flex",
      alignItems: "center",
      background: "#fff",
      padding: "40px 0",
      gap: "32px",
    }}
  >
    {/* Left section: Text & CTA */}
    <div style={{ flex: 1, minWidth: 0, paddingLeft: "56px" }}>
      <h2 style={{
        fontSize: "2.6rem",
        fontWeight: 500,
        marginBottom: "15px",
      }}>
        Get 10% OFF on your first order
      </h2>
      <div
        style={{
          fontSize: "1.5rem",
          color: "#555",
          marginBottom: "30px",
        }}
      >
        Fast Delivery to Your Doorstep
      </div>
      <button
        style={{
          background: "#e53935",
          color: "#fff",
          fontSize: "1.3rem",
          fontWeight: 400,
          border: "none",
          borderRadius: "10px",
          padding: "20px 40px",
          cursor: "pointer",
        }}
      >
        Shop Now
      </button>
    </div>

    {/* Right section: Promo image */}
    <div style={{ flexBasis: "480px", flexShrink: 0 }}>
      <img
        src="/src/assets/products/teatime-bakes.jpeg" 
        alt="Tea Time Bakes Promo"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "24px",
          boxShadow: "0 3px 16px #dfdbe8",
        }}
      />
    </div>
  </section>
);

export default DiscountBanner;
