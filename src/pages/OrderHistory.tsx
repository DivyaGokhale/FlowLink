import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderRecord {
  id: string;
  createdAt: string; // ISO
  items: OrderItem[];
  totals: { subtotal: number; gst: number; delivery: number; total: number };
  payment: { method: string; status: string; transactionId: string };
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("orderHistory");
      const parsed: OrderRecord[] = raw ? JSON.parse(raw) : [];
      setOrders(parsed);
    } catch {
      setOrders([]);
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("orderHistory");
    setOrders([]);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-5xl mx-auto bg-white shadow rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl md:text-2xl font-semibold">Order History</h1>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 text-sm rounded border"
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </button>
              {orders.length > 0 && (
                <button
                  className="px-3 py-2 text-sm rounded border text-red-600 border-red-300"
                  onClick={clearHistory}
                >
                  Clear History
                </button>
              )}
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-600">No past orders found.</p>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => (
                <li key={order.id} className="border rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="font-medium">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-semibold">₹{order.totals.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment</p>
                      <p className="font-medium">{order.payment.method.toUpperCase()} · {order.payment.status}</p>
                    </div>
                  </div>
                  <div className="mt-3 border-t pt-3 space-y-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>
                          {it.name} ({it.quantity} × ₹{Number(it.price)})
                        </span>
                        <span>₹{Number(it.price) * Number(it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderHistory;
