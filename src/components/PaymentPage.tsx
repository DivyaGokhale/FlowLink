import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useAddress } from "./AddressContext";
import { useCart } from "./CartContext";
import { useToast } from "./ToastContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import Spinner from "./ui/Spinner";
import { razorpayService, PaymentData } from "../lib/razorpay";
import { apiService } from "../lib/api";
import { formatPrice, getErrorMessage } from "../lib/utils";

interface Product {
  id: number;
  name: string;
  pack: string;
  price: number;
  quantity: number;
  image?: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const { token, user } = useAuth();
  const { selectedAddress, addresses } = useAddress();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { showToast } = useToast();
  
  const [method, setMethod] = useState("razorpay");
  const [formData, setFormData] = useState<any>({});
  const [totals, setTotals] = useState({ subtotal: 0, gst: 0, delivery: 50, total: 0 });
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate totals when cart or address changes
  useEffect(() => {
    console.log("PaymentPage: Cart data:", cart);
    console.log("PaymentPage: Cart length:", cart.length);
    
    const subtotal = getTotalPrice();
    console.log("PaymentPage: Subtotal calculated:", subtotal);
    
    const gst = Math.round(subtotal * 0.05); // 5% GST
    const delivery = selectedAddress?.time === "25 mins" ? 30 : 50;
    const total = subtotal + gst + delivery;
    
    console.log("PaymentPage: Final totals:", { subtotal, gst, delivery, total });
    
    setTotals({ subtotal, gst, delivery, total });
  }, [cart, selectedAddress, getTotalPrice]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleContinue = async () => {
    if (isProcessing) return;
    
    let valid = true;
    let errorMsg = "";

    // Check if cart is empty
    if (cart.length === 0) {
      valid = false;
      errorMsg = "Your cart is empty";
    }

    // Check if address is selected
    if (!selectedAddress) {
      valid = false;
      errorMsg = "Please select a delivery address";
    }

    if (!valid) {
      setError(errorMsg);
      showToast(errorMsg, "error");
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
      console.log("PaymentPage: Creating order with data:", {
        cartItems: cart,
        totals,
        selectedAddress,
        user: user?.id
      });

      // Create order first
      const orderData = {
        items: cart.map((item) => ({
          productId: String(item.id),
          name: item.name || item.title || "Unknown Product",
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: item.image || item.images?.[0] || "",
        })),
        totals,
        shippingAddress: {
          name: selectedAddress?.name || "",
          line1: selectedAddress?.line1 || "",
          line2: selectedAddress?.line2 || "",
          city: selectedAddress?.city || "",
          state: selectedAddress?.state || "",
          postalCode: selectedAddress?.postalCode || "",
          country: selectedAddress?.country || "India",
          phone: selectedAddress?.phone || "",
        },
        customerName: selectedAddress?.name || "",
        customerEmail: user?.email || selectedAddress?.email || undefined,
        payment: {
          method,
          status: method === "cod" ? "Pending" : "Pending",
          transactionId: "",
        },
      };

      console.log("PaymentPage: Order data to send:", orderData);

      // Create order in backend
      const orderResponse = await apiService.createOrder(orderData, user?.id || "");
      
      console.log("PaymentPage: Order response:", orderResponse);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.error || "Failed to create order");
      }

      const orderId = orderResponse.data?._id || orderResponse.orderId;

      if (method === "cod") {
        // For COD, just navigate to review page
        navigate(shop ? `/${shop}/review` : "/review");
        showToast("Order placed successfully!", "success");
        clearCart();
      } else {
        // For online payments, initiate Razorpay
        const paymentData: PaymentData = {
          orderId,
          amount: totals.total,
          currency: "INR",
          customerName: selectedAddress?.name || user?.name || "",
          customerEmail: user?.email || selectedAddress?.email || "",
          customerPhone: selectedAddress?.phone || "",
          description: `Order #${orderId}`,
        };

        await razorpayService.initiatePayment(
          paymentData,
          async (response) => {
            try {
              // Verify payment
              const isVerified = await razorpayService.verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (isVerified) {
                // Update order with payment details
                await apiService.verifyPayment(
                  orderId,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                  user?.id || ""
                );

                showToast("Payment successful! Order confirmed.", "success");
                clearCart();
                navigate(shop ? `/${shop}/review` : "/review");
              } else {
                throw new Error("Payment verification failed");
              }
            } catch (err) {
              showToast(getErrorMessage(err), "error");
            } finally {
              setIsProcessing(false);
            }
          },
          (error) => {
            showToast(getErrorMessage(error), "error");
            setIsProcessing(false);
          }
        );
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showToast(errorMessage, "error");
      setIsProcessing(false);
    }
  };

  return (
    <>
    <Header />
    <BackButton confirmOnPayment fallbackPath={shop ? `/${shop}/addToCart` : "/addToCart"} />
    <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center animate-fade-in-up">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">
        {/* Left: Address + Payment */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-card transition hover:shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
          <div className="space-y-3">
            {selectedAddress ? (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-green-700">{selectedAddress.type}</span>
                  {selectedAddress.isDefault && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                  <span className="text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded ml-auto">
                    {selectedAddress.time || "25 mins"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{selectedAddress.name}</p>
                  <p>{selectedAddress.line1}</p>
                  {selectedAddress.line2 && <p>{selectedAddress.line2}</p>}
                  <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                  <p>{selectedAddress.phone}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">No address selected</p>
                <button
                  onClick={() => navigate(shop ? `/${shop}/addToCart` : "/addToCart")}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Select Address
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-card transition hover:shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Payment Method</h2>

          {/* Product Preview */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Items in Cart</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cart.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name || item.title}
                    className="w-8 h-8 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.name || item.title}</p>
                    <p className="text-xs text-gray-500">{item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <span className="font-medium">{formatPrice(item.quantity * item.price)}</span>
                </div>
              ))}
              {cart.length > 3 && (
                <p className="text-xs text-gray-500">+{cart.length - 3} more items</p>
              )}
            </div>
          </div>

          {/* Payment options */}
          <div className="space-y-3">
            {[
              { value: "razorpay", label: "Online Payment (Razorpay)", icon: "💳", description: "Credit/Debit Card, UPI, Net Banking" },
              { value: "cod", label: "Cash on Delivery", icon: "💰", description: "Pay when your order is delivered" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center border rounded-lg p-3 cursor-pointer transition-all ${
                  method === opt.value
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
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
                  className="mr-3 accent-green-500"
                />
                <span className="mr-2">{opt.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium">{opt.label}</span>
                  {opt.description && (
                    <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Dynamic Inputs */}
          <div className="mt-4 space-y-3">
            {method === "upi" && (
              <div key="upi-input">
                <label className="block text-sm font-medium mb-1">UPI ID</label>
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g., user@paytm)"
                  value={formData.upi || ""}
                  onChange={(e) => handleChange("upi", e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                />
              </div>
            )}
            {method === "card" && (
              <div key="card-inputs">
                <div>
                  <label className="block text-sm font-medium mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber || ""}
                    onChange={(e) => handleChange("cardNumber", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={formData.expiry || ""}
                      onChange={(e) => handleChange("expiry", e.target.value)}
                      className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={formData.cvv || ""}
                      onChange={(e) => handleChange("cvv", e.target.value)}
                      className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="Name on card"
                    value={formData.cardName || ""}
                    onChange={(e) => handleChange("cardName", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
              </div>
            )}
            {method === "bank" && (
              <div key="bank-inputs">
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="Account number"
                    value={formData.account || ""}
                    onChange={(e) => handleChange("account", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="IFSC code"
                    value={formData.ifsc || ""}
                    onChange={(e) => handleChange("ifsc", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Account holder name"
                    value={formData.holder || ""}
                    onChange={(e) => handleChange("holder", e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
                  />
                </div>
              </div>
            )}
            {method === "cod" && (
              <div key="cod-info">
                <p className="text-gray-600 text-sm">
                  You can pay in cash when your order is delivered.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-start mt-6 gap-3">
            <button
              onClick={() => navigate(shop ? `/${shop}/addToCart` : "/addToCart")}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30 active:scale-[0.99]"
            >
              Back
            </button>
          </div>
        </div>
        </div>

        {/* Right: Sticky Order Summary */}
        <aside className="md:sticky md:top-24 h-max">
          <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{formatPrice(totals.delivery)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>{formatPrice(totals.gst)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Order Total</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
              <button
                onClick={handleContinue}
                disabled={isProcessing || cart.length === 0}
                className="mt-3 w-full h-10 rounded-full bg-[hsl(var(--primary))] hover:brightness-95 text-white font-medium shadow-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Spinner size="sm" variant="secondary" />
                    Processing...
                  </>
                ) : (
                  "Place your order"
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default PaymentPage;
