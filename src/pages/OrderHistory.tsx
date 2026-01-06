import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import Skeleton from "../components/ui/Skeleton";
import FeedbackModal from "../components/FeedbackModal";

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
  status?: string; // Add status field
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: string;
  };
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"quick" | "scheduled">("quick");
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useAuth();
  const { shop } = useParams<{ shop?: string }>();

  // Helper function to convert technical status to user-friendly label
  const getStatusLabel = (status: string | undefined): string => {
    if (!status) return 'Order Placed';
    
    const statusLabels: Record<string, string> = {
      'ORDER_PLACED': 'Order Placed',
      'PAYMENT_CONFIRMED': 'Payment Confirmed',
      'ORDER_CONFIRMED': 'Order Confirmed',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled'
    };
    
    return statusLabels[status] || status;
  };

  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
          status: o.status, // Add status field
          feedback: o.feedback, // Add feedback field
        }));
        setOrders(normalized);
      } catch (e: any) {
        setError(e?.message || "Failed to fetch orders. Please try again later.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user, isAuthenticated, shop]);

  const clearHistory = () => {
    localStorage.removeItem("orderHistory");
    setOrders([]);
  };

  const handleOpenFeedbackModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmitted = () => {
    // Refresh the orders list to reflect the new feedback
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
          status: o.status,
          feedback: o.feedback, // Add feedback field
        }));
        setOrders(normalized);
      } catch (e: any) {
        setError(e?.message || "Failed to fetch orders. Please try again later.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
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
        <main className="min-h-screen bg-gray-50 p-4 md:p-6 animate-fade-in-up">
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur border border-gray-100 shadow-card rounded-lg p-6 text-center">
            <h1 className="text-xl md:text-2xl font-semibold mb-2">Your Orders</h1>
            <p className="text-sm text-gray-700 mb-4">To place and view orders, login or signup.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(shop ? `/${shop}/account` : "/login")}
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
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-white p-4 md:p-6 animate-fade-in-up">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">My Orders</h1>
            <p className="text-sm text-gray-600">Showing orders for the last 6 months</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("quick")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "quick"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              Quick Orders
            </button>
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "scheduled"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              Scheduled Orders
            </button>
          </div>

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

          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16">
              <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-2">NO RECENT ORDERS</h2>
              <p className="text-base text-green-600 mb-6">You have not placed any order in the last 6 months</p>
              <button
                onClick={() => navigate(shop ? `/${shop}/shop` : "/shop")}
                className="px-6 py-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <>
              {/* Search bar - hidden when empty */}
              <div className="mb-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search all orders"
                  className="w-full md:w-80 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none"
                />
              </div>
              <ul className="space-y-5">
                {visible.map((order) => (
                  <li key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    {/* Header bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-gray-50 border-b border-gray-200 rounded-t-lg p-3 text-sm">
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
                                <button className="h-8 px-3 rounded-full bg-green-600 hover:bg-green-700 text-xs font-medium text-white">Buy it again</button>
                                <button onClick={() => navigate(shop ? `/${shop}/product/${it.productId}` : `/product/${it.productId}`)} className="h-8 px-3 rounded-full border border-gray-300 hover:bg-gray-50 text-xs">View item</button>
                                <button className="h-8 px-3 rounded-full border border-gray-300 hover:bg-gray-50 text-xs">View order details</button>
                                {order.status === 'DELIVERED' && !order.feedback && (
                                  <button 
                                    onClick={() => handleOpenFeedbackModal(order.id)}
                                    className="h-8 px-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-xs font-medium text-white"
                                  >
                                    Rate Order
                                  </button>
                                )}
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
            </>
          )}
        </div>
      </main>
      {feedbackModalOpen && selectedOrderId && (
        <FeedbackModal
          orderId={selectedOrderId}
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </>
  );
};

export default OrderHistory;
