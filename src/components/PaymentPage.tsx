import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useAddress } from "./AddressContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";

interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  quantity: number;
  image?: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const { token, user } = useAuth();
  const { selectedAddress, addresses } = useAddress();
  const [method, setMethod] = useState("upi");
  const [formData, setFormData] = useState<any>({});
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [totals, setTotals] = useState({ subtotal: 0, gst: 0, delivery: 50, total: 0 });
  const [error, setError] = useState("");

  // Load cart from localStorage and keep in sync without page refresh
  useEffect(() => {
    const computeTotals = (items: Product[]) => {
      const subtotal = items.reduce((acc: number, it: Product) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
      const gst = Math.round(subtotal * 0.05); // 5% GST
      const delivery = Math.round((selectedAddress?.time === "25 mins" ? 3.0 : 5.0) * 10);
      setTotals({ subtotal, gst, delivery, total: subtotal + gst + delivery });
    };

    const sync = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartItems(stored);
        computeTotals(stored);
      } catch {
        setCartItems([]);
        computeTotals([]);
      }
    };

    // initial
    sync();
    // update when address changes (affects delivery calc)
    computeTotals(JSON.parse(localStorage.getItem("cart") || "[]"));
    // listen for cross-component updates
    window.addEventListener("cart-updated", sync as any);
    window.addEventListener("storage", sync as any);
    const onVisibility = () => { if (!document.hidden) sync(); };
    window.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("cart-updated", sync as any);
      window.removeEventListener("storage", sync as any);
      window.removeEventListener("visibilitychange", onVisibility);
    };
  }, [selectedAddress]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleContinue = async () => {
    let valid = true;
    let errorMsg = "";

    // Check if address is selected
    if (!selectedAddress) {
      valid = false;
      errorMsg = "Please select a delivery address";
    }

    // Basic payment validation
    if (valid) {
      if (method === "upi" && !formData.upi) {
        valid = false;
        errorMsg = "Please enter UPI ID";
      }
      if (method === "card" && (!formData.cardNumber || !formData.expiry || !formData.cvv || !formData.cardName)) {
        valid = false;
        errorMsg = "Please fill all card details";
      }
      if (method === "bank" && (!formData.account || !formData.ifsc || !formData.holder)) {
        valid = false;
        errorMsg = "Please fill all bank details";
      }
    }

    if (!valid) {
      setError(errorMsg);
      return;
    }

    setError("");

    // Save payment info in localStorage for Review Page
    localStorage.setItem(
      "paymentDetails",
      JSON.stringify({ method, ...formData })
    );

    // Place order immediately after proceeding
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
      const ADMIN_ID = import.meta.env.VITE_ADMIN_USER_ID;
      // Resolve sellerId: if shop slug present, fetch mapping; else fallback to env/admin user
      let effectiveUserId = ADMIN_ID || user?.id || "";
      if (shop) {
        try {
          const sres = await fetch(`${API_BASE}/shops/${encodeURIComponent(shop)}`);
          if (sres.ok) {
            const sdata = await sres.json();
            if (sdata?.userId) effectiveUserId = String(sdata.userId);
          }
        } catch {}
      }
      if (!effectiveUserId) {
        alert("Missing shop mapping or user ID. Please configure your shop.");
        return;
      }

      const payload = {
        items: cartItems.map((it: any) => ({
          productId: String((it as any)._id || (it as any).id || ""),
          name: it.name,
          price: Number(it.price),
          quantity: Number(it.quantity),
          image: (it as any).image || ""
        })),
        totals,
        shippingAddress: {
          name: selectedAddress?.name || "",
          line1: selectedAddress?.line1 || "",
          line2: selectedAddress?.line2 || "",
          city: selectedAddress?.city || "",
          state: selectedAddress?.state || "",
          postalCode: selectedAddress?.postalCode || "",
          country: selectedAddress?.country || "India",
          phone: selectedAddress?.phone || "",
        },
        customerName: selectedAddress?.name || "",
        customerEmail: user?.email || selectedAddress?.email || undefined,
        payment: {
          method,
          status: method === "cod" ? "Pending" : "Completed",
          transactionId: `TXN-${Date.now()}`
        },
      };

      // Save snapshot for Review page display
      try {
        localStorage.setItem(
          "orderPreview",
          JSON.stringify({ items: payload.items, totals: payload.totals, payment: payload.payment })
        );
      } catch {}

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": effectiveUserId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to place order");
      }
      // Persist order locally for history
      try {
        const historyRaw = localStorage.getItem("orderHistory");
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        const orderRecord = {
          id: `ORD-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...payload,
        };
        const newHistory = [orderRecord, ...history].slice(0, 100); // cap to 100
        localStorage.setItem("orderHistory", JSON.stringify(newHistory));
      } catch {}

      // Clear cart after successful order placement and notify listeners
      localStorage.removeItem("cart");
      try { window.dispatchEvent(new Event("cart-updated")); } catch {}
    } catch (e: any) {
      alert(e?.message || "Failed to place order");
      return;
    }

    navigate(shop ? `/${shop}/review` : "/review");
  };

  return (
    <>
    <Header />
    <BackButton confirmOnPayment fallbackPath={shop ? `/${shop}/addToCart` : "/addToCart"} />
    <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center animate-fade-in-up">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">
        {/* Left: Address + Payment */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-card transition hover:shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
          <div className="space-y-3">
            {selectedAddress ? (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-green-700">{selectedAddress.type}</span>
                  {selectedAddress.isDefault && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                  <span className="text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded ml-auto">
                    {selectedAddress.time || "25 mins"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{selectedAddress.name}</p>
                  <p>{selectedAddress.line1}</p>
                  {selectedAddress.line2 && <p>{selectedAddress.line2}</p>}
                  <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                  <p>{selectedAddress.phone}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">No address selected</p>
                <button
                  onClick={() => navigate(shop ? `/${shop}/addToCart` : "/addToCart")}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Select Address
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-card transition hover:shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Payment Method</h2>

          {/* Product Preview */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Items in Cart</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cartItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} × ₹{item.price}</p>
                  </div>
                  <span className="font-medium">₹{item.quantity * item.price}</span>
                </div>
              ))}
              {cartItems.length > 3 && (
                <p className="text-xs text-gray-500">+{cartItems.length - 3} more items</p>
              )}
            </div>
          </div>

          {/* Payment options */}
          <div className="space-y-3">
            {[
              { value: "upi", label: "UPI Payment", icon: "📱" },
              { value: "card", label: "Credit/Debit Card", icon: "💳" },
              { value: "bank", label: "Net Banking", icon: "🏦" },
              { value: "cod", label: "Cash on Delivery", icon: "💰" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center border rounded-lg p-3 cursor-pointer transition-all ${
                  method === opt.value
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={opt.value}
                  checked={method === opt.value}
                  onChange={() => {
                    setMethod(opt.value);
                    setFormData({});
                    setError("");
                  }}
                  className="mr-3 accent-green-500"
                />
                <span className="mr-2">{opt.icon}</span>
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Dynamic Inputs */}
          <div className="mt-4 space-y-3">
            {method === "upi" && (
              <div key="upi-input">
                <label className="block text-sm font-medium mb-1">UPI ID</label>
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g., user@paytm)"
                  value={formData.upi || ""}
                  onChange={(e) => handleChange("upi", e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                />
              </div>
            )}
            {method === "card" && (
              <div key="card-inputs">
                <div>
                  <label className="block text-sm font-medium mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber || ""}
                    onChange={(e) => handleChange("cardNumber", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={formData.expiry || ""}
                      onChange={(e) => handleChange("expiry", e.target.value)}
                      className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={formData.cvv || ""}
                      onChange={(e) => handleChange("cvv", e.target.value)}
                      className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="Name on card"
                    value={formData.cardName || ""}
                    onChange={(e) => handleChange("cardName", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
              </div>
            )}
            {method === "bank" && (
              <div key="bank-inputs">
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="Account number"
                    value={formData.account || ""}
                    onChange={(e) => handleChange("account", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="IFSC code"
                    value={formData.ifsc || ""}
                    onChange={(e) => handleChange("ifsc", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Account holder name"
                    value={formData.holder || ""}
                    onChange={(e) => handleChange("holder", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
              </div>
            )}
            {method === "cod" && (
              <div key="cod-info">
                <p className="text-gray-600 text-sm">
                  You can pay in cash when your order is delivered.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-start mt-6 gap-3">
            <button
              onClick={() => navigate(shop ? `/${shop}/addToCart` : "/addToCart")}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30 active:scale-[0.99]"
            >
              Back
            </button>
          </div>
        </div>
        </div>

        {/* Right: Sticky Order Summary */}
        <aside className="md:sticky md:top-24 h-max">
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>₹{totals.delivery.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{totals.gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Order Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleContinue}
                className="mt-3 w-full h-10 rounded-full bg-[hsl(var(--primary))] hover:brightness-95 text-white font-medium shadow-button"
              >
                Place your order
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default PaymentPage;
