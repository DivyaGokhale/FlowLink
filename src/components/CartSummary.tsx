import React, { useState } from "react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartSummaryProps {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const CartSummary: React.FC<CartSummaryProps> = ({ cartItems, setCartItems }) => {
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const increaseQty = (id: number) => {
    const updated = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCartItems(updated);
  };

  const decreaseQty = (id: number) => {
    let updated = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity - 1 } : item
    );
    updated = updated.filter((item) => item.quantity > 0);
    setCartItems(updated);
  };

  const removeItem = (id: number) => {
    const updated = cartItems.filter((i) => i.id !== id);
    setCartItems(updated);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // 🧮 Pricing logic
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = cartItems.length > 0 ? 25 : 0;
  const gst = subtotal > 0 ? Math.round(subtotal * 0.05) : 0; // 5% GST
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
          <div className="space-y-4 border-b pb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
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
                    onClick={() => decreaseQty(item.id)}
                    className="px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    –
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => increaseQty(item.id)}
                    className="px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Apply Coupon</label>
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
              <span>Delivery Fee (3.0 kms)</span>
              <span>₹{delivery}</span>
            </div>
            <div className="flex justify-between">
              <span>GST & Other Charges</span>
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
          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              Proceed to Payment
            </button>
            <button
              onClick={clearCart}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
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
