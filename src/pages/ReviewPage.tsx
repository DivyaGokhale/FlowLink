import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  quantity: number;
}

const ReviewPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [totals, setTotals] = useState({ subtotal: 0, gst: 0, delivery: 0, total: 0 });

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);

    const storedPayment = JSON.parse(localStorage.getItem("paymentDetails") || "{}");
    setPaymentDetails(storedPayment);

    // totals
    let subtotal = storedCart.reduce(
      (acc: number, item: Product) => acc + item.price * item.quantity,
      0
    );
    let gst = Math.round(subtotal * 0.05); // 5% GST
    let delivery = storedCart.length > 0 ? 30 : 0;
    setTotals({ subtotal, gst, delivery, total: subtotal + gst + delivery });
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

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReceipt = () => {
    alert("📧 Receipt has been sent to your registered email!");
  };

  return (
    <>
      <Header />
      <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Status */}
          <div className="bg-white p-6 rounded shadow-md md:col-span-2">
            <h2 className="text-lg font-semibold text-green-600">✓ Payment Successful</h2>
            <p className="text-gray-600 text-sm">
              Transaction completed on {new Date().toLocaleString()}
            </p>
            <p className="text-2xl font-bold mt-2">₹{totals.total.toFixed(2)}</p>
          </div>

          {/* Transaction Details */}
          <div className="bg-white p-6 rounded shadow-md">
            <h3 className="font-semibold mb-3">Transaction Details</h3>
            <p>Transaction ID: #TXN-{Date.now()}</p>
            <p>Payment Method: {paymentDetails.method || "N/A"}</p>
            <p>Status: Completed</p>
          </div>

          {/* Payment Summary */}
          <div className="bg-white p-6 rounded shadow-md">
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <p>Subtotal: ₹{totals.subtotal}</p>
            <p>GST: ₹{totals.gst}</p>
            <p>Delivery Fee: ₹{totals.delivery}</p>
            <p className="font-bold mt-2">Total: ₹{totals.total}</p>
          </div>

          {/* Items Purchased */}
          <div className="bg-white p-6 rounded shadow-md md:col-span-2">
            <h3 className="font-semibold mb-3">Items Purchased</h3>
            {cartItems.length === 0 ? (
              <p>No items found</p>
            ) : (
              <ul className="space-y-2">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.name} ({item.quantity} × ₹{item.price})
                    </span>
                    <span>₹{item.quantity * item.price}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded shadow-md md:col-span-2 flex flex-wrap gap-4">
            <button
              onClick={handleDownloadReceipt}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Download Receipt
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Print
            </button>
            <button
              onClick={handleEmailReceipt}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Email Receipt
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ReviewPage;
