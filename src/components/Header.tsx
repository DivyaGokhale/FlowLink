import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Icons
const LocationIcon = () => (
  <svg width={20} height={20} fill="none">
    <circle cx="10" cy="7" r="5.5" stroke="#555" />
    <path
      d="M10 13.8c2.5 0 4.5-1.8 4.5-4.3 0-2.5-2-4.4-4.5-4.4s-4.5 1.9-4.5 4.4c0 2.5 2 4.3 4.5 4.3z"
      fill="#fff"
      stroke="#555"
    />
  </svg>
);

const ProfileIcon = () => (
  <svg width={23} height={23} fill="none">
    <circle cx="11.5" cy="8" r="4.5" stroke="black" />
    <rect x="4" y="15" width="15" height="6" rx="3" stroke="black" />
  </svg>
);

const CartIcon = () => (
  <svg width={23} height={23} fill="none">
    <path d="M6 6h14l-2 8H8" stroke="black" strokeWidth={2} />
    <circle cx="9" cy="20" r="2" fill="black" />
    <circle cx="17" cy="20" r="2" fill="black" />
  </svg>
);

const AlertIcon = () => (
  <svg width={23} height={23} fill="none">
    <path d="M12 6v8" stroke="black" strokeWidth={2} />
    <circle cx="12" cy="18" r="2" fill="black" />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  // ✅ Update cart count whenever storage changes
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const totalItems = cart.reduce(
        (sum: number, item: any) => sum + (item.quantity || 1),
        0
      );
      setCartCount(totalItems);
    };

    updateCartCount();

    // Listen to storage changes (other tabs / components)
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        background: "#fff",
        padding: "16px 32px",
        gap: "24px",
        boxShadow: "0 1px 0 #ededed",
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontSize: "2rem",
          fontWeight: 500,
          marginRight: "32px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        FlowLink
      </span>

      {/* Location selector */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "1rem",
          color: "#555",
          marginRight: "16px",
        }}
      >
        <LocationIcon />
        <span style={{ margin: "0 8px" }}>
          Delivery to Ratnagiri, Maharashtra
        </span>
        <span style={{ fontSize: "1rem" }}>▼</span>
      </span>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search for products like rice, sugar, oil, masale..."
        style={{
          flex: 1,
          maxWidth: "700px",
          fontSize: "1rem",
          padding: "8px 16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          marginRight: "32px",
        }}
      />

      {/* Profile, Cart, Alerts icons */}
      <nav style={{ display: "flex", alignItems: "center", gap: "36px" }}>
        {/* Profile */}
        <div style={{ textAlign: "center", cursor: "pointer" }}>
          <ProfileIcon />
          <div style={{ fontSize: "0.95rem", marginTop: "2px" }}>Profile</div>
        </div>

        {/* Cart */}
        <div
          style={{ textAlign: "center", position: "relative", cursor: "pointer" }}
          onClick={() => navigate("/addToCart")}
        >
          <CartIcon />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: 8,
                background: "#111",
                color: "#fff",
                borderRadius: "50%",
                fontSize: "0.8rem",
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {cartCount}
            </span>
          )}
          <div style={{ fontSize: "0.95rem", marginTop: "2px" }}>Cart</div>
        </div>

        {/* Alerts */}
        <div style={{ textAlign: "center", cursor: "pointer" }}>
          <AlertIcon />
          <div style={{ fontSize: "0.95rem", marginTop: "2px" }}>Alerts</div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
