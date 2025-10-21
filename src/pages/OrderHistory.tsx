import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import Skeleton from "../components/ui/Skeleton";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useAuth();
  const { shop } = useParams<{ shop?: string }>();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setOrders([]);
      setError(null);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      const ADMIN_ID = (import.meta as any).env?.VITE_ADMIN_USER_ID;
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5001/api";
      let effectiveUserId = ADMIN_ID || user?.id || "";
      // If a shop slug exists, resolve mapped owner
      if (shop) {
        try {
          const sres = await fetch(`${API_BASE}/shops/${encodeURIComponent(shop)}`);
          if (sres.ok) {
            const sdata = await sres.json();
            if (sdata?.userId) effectiveUserId = String(sdata.userId);
          }
        } catch {}
      }

      try {
        if (!effectiveUserId) throw new Error("Missing user ID");
        const res = await fetch(`${API_BASE}/orders`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": effectiveUserId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.orders || []);
        const normalized: OrderRecord[] = list.map((o: any) => ({
          id: String(o.id || o._id || o.orderId || `ORD-${Date.now()}`),
          createdAt: (o.createdAt || o.created_at || new Date().toISOString()) as string,
          items: (o.items || []).map((it: any) => ({
            productId: String(it.productId || it.id || it._id || ""),
            name: String(it.name || "Item"),
            price: Number(it.price || 0),
            quantity: Number(it.quantity || 1),
            image: it.image || "",
          })),
          totals: o.totals || {
            subtotal: Number(o.subtotal || 0),
            gst: Number(o.gst || 0),
            delivery: Number(o.delivery || 0),
            total: Number(o.total || 0),
          },
          payment: o.payment || {
            method: String(o.paymentMethod || "unknown"),
            status: String(o.paymentStatus || "Completed"),
            transactionId: String(o.transactionId || ""),
          },
        }));
        setOrders(normalized);
      } catch (e: any) {
        setError(e?.message || "Failed to fetch orders. Showing local data if available.");
        try {
          const raw = localStorage.getItem("orderHistory");
          const parsed: OrderRecord[] = raw ? JSON.parse(raw) : [];
          setOrders(parsed);
        } catch {
          setOrders([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user, isAuthenticated]);

  const clearHistory = () => {
    localStorage.removeItem("orderHistory");
    setOrders([]);
  };

  const visible = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (o.id.toLowerCase().includes(q)) return true;
    return o.items.some((it) => it.name.toLowerCase().includes(q));
  });

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 p-4 md:p-6 animate-fade-in-up">
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur border border-gray-100 shadow-card rounded-lg p-6 text-center">
            <h1 className="text-xl md:text-2xl font-semibold mb-2">Your Orders</h1>
            <p className="text-sm text-gray-700 mb-4">To place and view orders, login or signup.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(shop ? `/${shop}/login` : "/login")}
                className="h-10 px-4 rounded-full bg-[hsl(var(--primary))] text-white shadow-button hover:brightness-95"
              >
                Login
              </button>
              <button
                onClick={() => navigate(shop ? `/${shop}/signup` : "/signup")}
                className="h-10 px-4 rounded-full border border-gray-300 hover:bg-gray-50"
              >
                Signup
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 p-4 md:p-6 animate-fade-in-up">
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur border border-gray-100 shadow-card rounded-lg p-4 md:p-6">
          {loading && (
            <div className="mb-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-5 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <h1 className="text-xl md:text-2xl font-semibold">Your Orders</h1>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all orders"
                className="flex-1 md:w-80 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none"
              />
              <button
                className="px-3 py-2 text-sm rounded border hidden md:inline-block"
                onClick={() => navigate(shop ? `/${shop}` : "/")}
              >
                Continue Shopping
              </button>
              {orders.length > 0 && (
                <button
                  className="px-3 py-2 text-sm rounded border text-red-600 border-red-300 hover:bg-red-50"
                  onClick={clearHistory}
                >
                  Clear History
                </button>
              )}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="text-gray-600">No past orders found.</p>
          ) : (
            <ul className="space-y-5">
              {visible.map((order) => (
                <li key={order.id} className="bg-white border rounded-lg shadow-sm">
                  {/* Header bar */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-gray-50 border-b rounded-t-lg p-3 text-sm">
                    <div>
                      <span className="text-gray-500">Ordered on</span>
                      <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total</span>
                      <div className="font-medium">₹{order.totals.total.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Ship to</span>
                      <div className="font-medium">—</div>
                    </div>
                    <div className="md:text-right">
                      <span className="text-gray-500">Order #</span>
                      <div className="font-medium break-all">{order.id}</div>
                    </div>
                  </div>
                  {/* Items */}
                  <div className="p-4">
                    <div className="space-y-4">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                          <img src={it.image || "/favicon.ico"} alt={it.name} className="w-16 h-16 object-contain border rounded" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium line-clamp-2">{it.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Qty: {it.quantity}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button className="h-8 px-3 rounded-full bg-[hsl(var(--primary))] hover:brightness-95 text-xs font-medium text-white shadow-button">Buy it again</button>
                              <button onClick={() => navigate(shop ? `/${shop}/product/${it.productId}` : `/product/${it.productId}`)} className="h-8 px-3 rounded-full border border-gray-300 hover:bg-gray-50 text-xs">View item</button>
                              <button className="h-8 px-3 rounded-full border border-gray-300 hover:bg-gray-50 text-xs">View order details</button>
                            </div>
                          </div>
                          <div className="text-sm font-semibold">₹{Number(it.price) * Number(it.quantity)}</div>
                        </div>
                      ))}
                    </div>
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
