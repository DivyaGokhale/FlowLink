import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const CartSummary: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const s = localStorage.getItem("cart");
      return s ? JSON.parse(s) : [];
    } catch {
      return [] as CartItem[];
    }
  });
  const [gift, setGift] = useState(false);
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();

  const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress") || "{}");
  const distance = selectedAddress?.distance || 3.0;

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      setCartItems(JSON.parse(stored));
    }
    const sync = () => {
      try {
        const s = localStorage.getItem("cart");
        if (s) setCartItems(JSON.parse(s));
      } catch {}
    };
    const onVisibility = () => { if (!document.hidden) sync(); };
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("cart-updated", sync as any);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("cart-updated", sync as any);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

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
  const total = subtotal + delivery + gst;

  return (
    <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-lg shadow-card p-5 sticky top-24">
      <h3 className="text-base font-semibold mb-3">Order Summary</h3>
      {cartItems.length === 0 ? (
        <p className="text-gray-500 text-sm">Your cart is empty.</p>
      ) : (
        <>
          <div className="flex items-start gap-2 text-sm mb-3">
            <input id="gift" type="checkbox" className="mt-1" checked={gift} onChange={(e) => setGift(e.target.checked)} />
            <label htmlFor="gift">This order contains a gift</label>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Subtotal ({cartItems.reduce((n,i)=>n+i.quantity,0)} items)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery ({distance} kms)</span>
              <span>₹{delivery}</span>
            </div>
            <div className="flex justify-between">
              <span>GST ({Math.round(gstRate*100)}%)</span>
              <span>₹{gst}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Order Total</span>
              <span>₹{total}</span>
            </div>
          </div>
          <button
            onClick={() => navigate(shop ? `/${shop}/payment` : "/payment")}
            className="mt-4 w-full h-10 rounded-full bg-[hsl(var(--primary))] hover:brightness-95 text-white font-medium shadow-button"
          >
            Proceed to Buy
          </button>
          <button
            onClick={clearCart}
            className="mt-2 w-full h-9 rounded-full border border-gray-300 hover:bg-gray-50 text-sm"
          >
            Clear Cart
          </button>
          <p className="mt-3 text-[12px] text-gray-500">By placing your order, you agree to FlowLink's conditions of use & sale.</p>
        </>
      )}
    </div>
  );
};

export default CartSummary;
