import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useAddress } from "./AddressContext";
import { useCart } from "./CartContext";
import { useToast } from "./ToastContext";
import BackButton from "./BackButton";
import Spinner from "./ui/Spinner";
import { razorpayService } from "../lib/razorpay";
import { apiService } from "../lib/api";
import { formatPrice, getErrorMessage } from "../lib/utils";

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const { token, user } = useAuth() || {};
  const { selectedAddress } = useAddress() || {};
  const { cart = [], clearCart = () => {}, getTotalPrice = () => 0 } = useCart() || {};
  const { showToast } = useToast() || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [method, setMethod] = useState<string>("razorpay");

  // Calculate totals
  const totals = useMemo(() => {
    try {
      // Calculate subtotal directly from cart items
      const subtotal = cart.reduce((sum, item) => {
        return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1));
      }, 0);
      const gst = Math.round(subtotal * 0.05); // 5% GST
      const delivery = selectedAddress?.time === "25 mins" ? 30 : 50;
      const total = subtotal + gst + delivery;
      return { subtotal, gst, delivery, total };
    } catch {
      return { subtotal: 0, gst: 0, delivery: 0, total: 0 };
    }
  }, [cart, selectedAddress]);

  // Load Razorpay script
  useEffect(() => {
    const loadScript = async () => {
      try {
        await razorpayService.loadScript();
      } catch {
        showToast("Failed to initialize payment system", "error");
      }
    };
    loadScript();
  }, [showToast]);

  const handleContinue = async () => {
    setIsProcessing(true);
    try {
      if (!user?.id && !token) throw new Error("Please login to continue");
      if (!cart.length) throw new Error("Your cart is empty");
      if (!selectedAddress) throw new Error("Please select a shipping address");

      const items = cart.map((item: any, index) => ({
        productId: String(item?.id || item?._id || index),
        name: item?.name || item?.title || "Product",
        price: Number(item?.price) || 0,
        quantity: Number(item?.quantity) || 1,
        image: item?.image || (Array.isArray(item?.images) ? item.images[0] : ""),
      }));

      const payload = {
        items,
        totals,
        shippingAddress: selectedAddress,
        payment: { method, status: "pending", transactionId: "" },
        customerEmail: user?.email || selectedAddress?.email || "",
        customerName: selectedAddress?.name || user?.name || "Customer",
        customerPhone: selectedAddress?.phone || "",
      };

      const createResp = await apiService.createOrder(payload, user?.id || token || "");
      if (!createResp?.success || !createResp?.data?._id) {
        throw new Error(createResp?.error || createResp?.message || "Failed to create order");
      }

      const orderId = createResp.data._id;

      if (method === "cod") {
        await apiService.updateOrder(orderId, {
          payment: { method: "cod", status: "confirmed", transactionId: `COD-${orderId}` },
        }, user?.id || token || "");

        clearCart();
        localStorage.removeItem("cart");
        showToast("Order placed successfully!", "success");
        // Use navigate with replace to prevent back navigation
        navigate(shop ? `/${shop}/order-confirmed/${orderId}` : `/order-confirmed/${orderId}`, { replace: true });
      } else {
        // Razorpay online payment
        await razorpayService.initiatePayment(
          {
            orderId,
            amount: totals.total, // amount in rupees; service converts to paise
            currency: "INR",
            customerName: selectedAddress?.name || user?.name || "",
            customerEmail: user?.email || "",
            customerPhone: selectedAddress?.phone || "",
            description: `Order #${orderId}`,
          },
          {
            onSuccess: async (res) => {
              try {
                await apiService.verifyPayment(
                  res.razorpay_order_id,
                  res.razorpay_payment_id,
                  res.razorpay_signature,
                  user?.id || token || ""
                );
                await apiService.updateOrder(orderId, {
                  payment: { method: "razorpay", status: "Completed", transactionId: res.razorpay_payment_id },
                }, user?.id || token || "");
                showToast("Payment successful!", "success");
                clearCart();
                localStorage.removeItem("cart");
                // Use navigate with replace to prevent back navigation
                navigate(shop ? `/${shop}/order-confirmed/${orderId}` : `/order-confirmed/${orderId}`, { replace: true });
              } catch {
                showToast(`Payment succeeded but verification failed. Order ID: ${orderId}`, "error");
              } finally {
                setIsProcessing(false);
              }
            },
            onError: (err) => {
              setError(err.message || "Payment failed");
              showToast(err.description || "Payment failed. Please try again.", "error");
              setIsProcessing(false);
            },
            onDismiss: () => {
              setIsProcessing(false);
              showToast("Payment cancelled", "warning");
            },
          }
        );
      }
    } catch (err) {
      const msg = getErrorMessage(err) || (err instanceof Error ? err.message : "An error occurred");
      setError(msg);
      showToast(msg, "error");
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { value: "razorpay", label: "Online Payment (Razorpay)", icon: "💳", description: "Credit/Debit Card, UPI, Net Banking" },
    { value: "cod", label: "Cash on Delivery", icon: "💰", description: "Pay when your order is delivered" },
  ];

  if (!selectedAddress) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">No Delivery Address</h2>
            <p className="text-gray-600 mb-6">Please add a delivery address before proceeding to payment.</p>
            <button
              onClick={() => navigate(shop ? `/${shop}/checkout` : "/checkout")}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Checkout
            </button>
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gradient-to-br from-white to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* <BackButton fallbackPath={shop ? `/${shop}/checkout` : "/checkout"} /> */}
          <h1 className="text-3xl font-bold mb-8 text-green-800">Complete Your Payment</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Items & Payment Method */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Preview - Moved to top */}
              <div className="bg-white border border-green-100 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-green-700">Order Items</h2>
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div key={item.id || item._id || idx} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
                      <img 
                        src={item.image || "/placeholder.jpg"} 
                        alt={item.name || item.title} 
                        className="w-16 h-16 object-cover rounded-lg border border-green-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{item.name || item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <span className="font-semibold text-green-700">{formatPrice(item.quantity * item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-green-100 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-green-700">Payment Method</h2>

                {/* Payment Options */}
                <div className="space-y-3">
                  {paymentMethods.map((opt) => (
                    <label key={opt.value} className={`flex items-center border rounded-xl p-4 cursor-pointer transition-all ${
                      method === opt.value ? "border-green-500 bg-green-50 shadow-inner" : "border-green-200 hover:bg-green-50"
                    }`}>
                      <input
                        type="radio"
                        name="method"
                        value={opt.value}
                        checked={method === opt.value}
                        onChange={() => { setMethod(opt.value); setError(""); }}
                        className="mr-3 accent-green-600 w-5 h-5"
                      />
                      <span className="mr-3 text-xl">{opt.icon}</span>
                      <div className="flex-1">
                        <span className="text-base font-medium text-gray-800">{opt.label}</span>
                        {opt.description && <p className="text-sm text-gray-600 mt-1">{opt.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handleContinue}
                  disabled={isProcessing}
                  className={`w-full mt-6 py-4 px-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all transform hover:scale-[1.02] ${
                    isProcessing ? "bg-green-400 cursor-not-allowed" : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <Spinner className="w-5 h-5 mr-2" />
                      Processing Payment...
                    </div>
                  ) : `Proceed to Pay ${formatPrice(totals.total)}`}
                </button>

                {error && <p className="mt-3 text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{error}</p>}
              </div>
            </div>

            {/* Right Column: Address & Order Summary */}
            <div className="space-y-6">
              {/* Delivery Address - Moved to right column */}
              <div className="bg-white border border-green-100 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-green-700">Delivery Address</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm">{selectedAddress.type}</span>
                    {selectedAddress.isDefault && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Default</span>
                    )}
                  </div>
                  <div className="text-gray-700 space-y-2 p-4 bg-green-50 rounded-lg">
                    <p className="font-medium">{selectedAddress.name}</p>
                    <p>{selectedAddress.line1}</p>
                    {selectedAddress.line2 && <p>{selectedAddress.line2}</p>}
                    <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                    <p className="font-medium">{selectedAddress.phone}</p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg text-white">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(totals.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span>{totals.delivery === 0 ? "Free" : formatPrice(totals.delivery)}</span></div>
                  <div className="flex justify-between"><span>GST (5%)</span><span>{formatPrice(totals.gst)}</span></div>
                  <div className="border-t border-green-400 pt-3 mt-2 flex justify-between font-bold text-lg"><span>Total</span><span>{formatPrice(totals.total)}</span></div>
                </div>
              </div>

              {/* Need Help? */}
              <div className="bg-white border border-green-100 rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-green-700">Need Help?</h2>
                <div className="space-y-2 text-gray-600">
                  <p>For any queries, please contact our support team:</p>
                  <p className="font-medium">📞 +91 1234567890</p>
                  <p className="font-medium">✉️ support@flowlink.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

