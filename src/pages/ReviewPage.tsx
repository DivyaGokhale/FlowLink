import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate, useParams } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  quantity: number;
}

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [totals, setTotals] = useState({ subtotal: 0, gst: 0, delivery: 0, total: 0 });

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const storedPayment = JSON.parse(localStorage.getItem("paymentDetails") || "{}");
    const preview = JSON.parse(localStorage.getItem("orderPreview") || "null");

    if (preview && preview.items && preview.totals) {
      // Use the snapshot saved at payment time
      const mapped = preview.items.map((it: any, idx: number) => ({
        id: idx + 1,
        name: it.name,
        pack: "",
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 0,
      }));
      setCartItems(mapped);
      setTotals(preview.totals);
      setPaymentDetails(storedPayment && storedPayment.method ? storedPayment : (preview.payment || {}));
    } else {
      // Fallback to current cart and recompute totals
      setCartItems(storedCart);
      setPaymentDetails(storedPayment);
      let subtotal = storedCart.reduce(
        (acc: number, item: Product) => acc + item.price * item.quantity,
        0
      );
      let gst = Math.round(subtotal * 0.05); // 5% GST
      let delivery = storedCart.length > 0 ? 30 : 0;
      setTotals({ subtotal, gst, delivery, total: subtotal + gst + delivery });
    }
  }, []);

  // 🔽 Action handlers
  const handleDownloadReceipt = () => {
    const receiptData = `
      Transaction ID: #TXN-${Date.now()}
      Payment Method: ${paymentDetails.method}
      Subtotal: ₹${totals.subtotal}
      GST: ₹${totals.gst}
      Delivery Fee: ₹${totals.delivery}
      Total: ₹${totals.total}
    `;
    const blob = new Blob([receiptData], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receipt.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isCOD = paymentDetails?.method === "cod";
  const statusNode = isCOD ? (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20">Pending · COD</span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Paid</span>
  );

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReceipt = () => {
    alert("📧 Receipt has been sent to your registered email!");
  };

  // Order is placed on PaymentPage; ReviewPage is now a read-only summary.

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-hero p-6 flex flex-col items-center">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Status / Summary Header */}
          {isCOD ? (
            <div className="bg-white p-6 rounded-xl shadow-card md:col-span-2 border border-gray-100">
              <h2 className="text-lg font-semibold text-[hsl(var(--primary))]">Cash on Delivery Selected</h2>
              <p className="text-gray-600 text-sm">Please keep exact change ready. You will pay on delivery.</p>
              <p className="text-2xl font-bold mt-3">₹{totals.total.toFixed(2)}</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-card md:col-span-2 border border-gray-100">
              <h2 className="text-lg font-semibold text-[hsl(var(--primary))]">Payment Successful</h2>
              <p className="text-gray-600 text-sm">Transaction completed on {new Date().toLocaleString()}</p>
              <p className="text-2xl font-bold mt-3">₹{totals.total.toFixed(2)}</p>
            </div>
          )}

          {/* Transaction Details */}
          <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
            <h3 className="font-semibold mb-3 text-[hsl(var(--foreground))]">Transaction Details</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">Transaction ID: <span className="font-medium text-gray-800">#TXN-{Date.now()}</span></p>
              <p className="text-gray-600">Payment Method: <span className="font-medium text-gray-800">{paymentDetails.method || "N/A"}</span></p>
              <p className="text-gray-600">Status: {statusNode}</p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
            <h3 className="font-semibold mb-3 text-[hsl(var(--foreground))]">Payment Summary</h3>
            <div className="divide-y divide-gray-100 rounded-lg overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{totals.subtotal}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-gray-600">GST (5%)</span>
                <span className="font-medium">₹{totals.gst}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">₹{totals.delivery}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-secondary/60">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-[hsl(var(--primary))]">₹{totals.total}</span>
              </div>
            </div>
          </div>

          {/* Items Purchased */}
          <div className="bg-white p-6 rounded-xl shadow-card md:col-span-2 border border-gray-100">
            <h3 className="font-semibold mb-3 text-[hsl(var(--foreground))]">Items Purchased</h3>
            {cartItems.length === 0 ? (
              <p className="text-sm text-gray-600">No items found</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-800">
                      {item.name} <span className="text-gray-500">({item.quantity} × ₹{item.price})</span>
                    </span>
                    <span className="font-medium">₹{item.quantity * item.price}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-xl shadow-card md:col-span-2 flex flex-wrap gap-3 sm:gap-4 justify-between items-center border border-gray-100">
              <div className="flex flex-wrap gap-3">
                <button onClick={handleDownloadReceipt} className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-full hover:brightness-95 shadow-button transition">
                  Download Receipt
                </button>
                <button onClick={handlePrint} className="px-4 py-2 bg-emerald-700 text-white rounded-full hover:brightness-95 shadow-button transition">
                  Print
                </button>
                <button onClick={handleEmailReceipt} className="px-4 py-2 bg-gray-700 text-white rounded-full hover:brightness-110 transition">
                  Email Receipt
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate(shop ? `/${shop}` : "/")} className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-full hover:brightness-95 shadow-button transition">
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      <Footer />
    </>
  );
};

export default ReviewPage;

