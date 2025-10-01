import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const CartSummary: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const navigate = useNavigate();

  const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress") || "{}");
  const distance = selectedAddress?.distance || 3.0;

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      setCartItems(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ Unified quantity updater
  const updateQuantity = (_id: string, change: number) => {
    const updatedCart = cartItems
      .map((item) =>
        item._id === _id ? { ...item, quantity: item.quantity + change } : item
      )
      .filter((item) => item.quantity > 0); // remove if 0

    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeItem = (_id: string) => {
    const updatedCart = cartItems.filter((i) => i._id !== _id);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem("cart", "[]");
  };

  // 🧮 Pricing
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const delivery = cartItems.length > 0 ? Math.round(distance * 10) : 0; // ₹10 per km
  const gstRate = subtotal > 0 ? 0.05 : 0; // example fixed 5%
  const gst = Math.round(subtotal * gstRate);
  const discountAmount = Math.round((subtotal * discount) / 100);
  const total = subtotal + delivery + gst - discountAmount;

  const applyCoupon = () => {
    if (coupon === "SAVE10") {
      setDiscount(10);
    } else {
      setDiscount(0);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      {cartItems.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          {/* Cart items */}
          <div className="space-y-4 border-b pb-4">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 object-contain border rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    ₹{item.price} × {item.quantity} = ₹
                    {item.price * item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item._id, -1)}
                    className="px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    –
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, +1)}
                    className="px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item._id)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Apply Coupon
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Enter code (e.g. SAVE10)"
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                onClick={applyCoupon}
                className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 text-sm"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Price Details */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Item Total</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee ({distance} kms)</span>
              <span>₹{delivery}</span>
            </div>
            <div className="flex justify-between">
              <span>GST ({Math.round(gstRate * 100)}%)</span>
              <span>₹{gst}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({discount}%)</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>To Pay</span>
              <span>₹{total}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-4 mt-6">
            <button
              onClick={() => navigate("/payment")}
              className="bg-green-600 text-white flex-1 py-3 rounded-lg font-medium hover:bg-green-700"
            >
              Proceed to Payment
            </button>

            <button
              onClick={clearCart}
              className="bg-red-500 text-white flex-1 py-3 rounded-lg font-medium hover:bg-red-600"
            >
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartSummary;
