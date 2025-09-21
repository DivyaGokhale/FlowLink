import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";

interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  quantity: number;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState("card");
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState("");
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [totals, setTotals] = useState({ subtotal: 0, gst: 0, delivery: 50, total: 0 });

  // Load cart from localStorage
// inside useEffect in PaymentPage.tsx
useEffect(() => {
  const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
  setCartItems(storedCart);

  const distance = 3.0; // mock distance
  let subtotal = storedCart.reduce(
    (acc: number, item: Product) => acc + item.price * item.quantity,
    0
  );
  let gst = Math.round(subtotal * 0.05); // 5% GST
  let delivery = storedCart.length > 0 ? Math.round(distance * 10) : 0;
  setTotals({ subtotal, gst, delivery, total: subtotal + gst + delivery });
}, []);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleContinue = () => {
    let valid = true;
    let errorMsg = "";

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

    navigate("/review");
  };

  return (
    <>
    <Header />
    <BackButton confirmOnPayment fallbackPath="/addToCart" />
    <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cartItems.length === 0 ? (
              <p className="text-gray-500">No items in cart</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} ({item.quantity} × ₹{item.price})
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))
            )}
            <hr className="my-2" />
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee</span>
              <span>₹{totals.delivery.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST (5%)</span>
              <span>₹{totals.gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Select Payment Method</h2>

          {/* Payment options */}
          <div className="space-y-4">
            {[
              { value: "upi", label: "UPI Payment (Google Pay, PhonePe, Paytm)" },
              { value: "card", label: "Debit/Credit Card (Visa, Mastercard, RuPay)" },
              { value: "bank", label: "Bank Transfer (Direct Account Transfer)" },
              { value: "cod", label: "Cash on Delivery" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center border rounded-lg p-3 cursor-pointer"
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
                  className="mr-3"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Dynamic Inputs */}
          <div className="mt-6 space-y-4">
            {method === "upi" && (
              <input
                type="text"
                placeholder="Enter UPI ID"
                value={formData.upi || ""}
                onChange={(e) => handleChange("upi", e.target.value)}
                className="w-full border p-2 rounded"
              />
            )}
            {method === "card" && (
              <>
                <input
                  type="text"
                  placeholder="Card Number"
                  value={formData.cardNumber || ""}
                  onChange={(e) => handleChange("cardNumber", e.target.value)}
                  className="w-full border p-2 rounded"
                />
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={formData.expiry || ""}
                    onChange={(e) => handleChange("expiry", e.target.value)}
                    className="w-1/2 border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={formData.cvv || ""}
                    onChange={(e) => handleChange("cvv", e.target.value)}
                    className="w-1/2 border p-2 rounded"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={formData.cardName || ""}
                  onChange={(e) => handleChange("cardName", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </>
            )}
            {method === "bank" && (
              <>
                <input
                  type="text"
                  placeholder="Account Number"
                  value={formData.account || ""}
                  onChange={(e) => handleChange("account", e.target.value)}
                  className="w-full border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="IFSC Code"
                  value={formData.ifsc || ""}
                  onChange={(e) => handleChange("ifsc", e.target.value)}
                  className="w-full border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  value={formData.holder || ""}
                  onChange={(e) => handleChange("holder", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </>
            )}
            {method === "cod" && (
              <p className="text-gray-600 text-sm">
                You can pay in cash when your order is delivered.
              </p>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => navigate("/addToCart")}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Back to Cart
            </button>
            <button
              onClick={handleContinue}
              className="bg-green-600 text-white px-6 py-2 rounded"
            >
              Continue to Review
            </button>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default PaymentPage;
