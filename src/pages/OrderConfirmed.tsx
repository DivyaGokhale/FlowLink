import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { apiService } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { generateInvoicePDF } from "../lib/invoice";
import { getSocket } from "../lib/socket"; // Import socket functionality
import FeedbackModal from "../components/FeedbackModal";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderDetails {
  _id: string;
  orderId?: string; // Make optional as it might not be present in all responses
  userId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    phone: string;
    email?: string;
  };
  totals: {
    subtotal: number;
    gst: number;
    delivery: number;
    total: number;
  };
  payment: {
    method: string;
    status: string;
    transactionId: string;
  };
  status?: string;
  createdAt: string;
  updatedAt: string;
}

const OrderConfirmed: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { shop } = useParams<{ shop?: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add state for order status that will be updated via WebSocket
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  // Prevent back navigation after payment completion
  useEffect(() => {
    // Add a new history entry so that when user presses back, 
    // they go back to the page before the payment page
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      // When back button is pressed, push the state back so they can't go back
      window.history.pushState(null, '', window.location.href);
      // Optionally, show a message or redirect to a safe page
      if (order && order.payment.status === 'success') {
        // If payment was successful, redirect to home or orders page
        navigate(shop ? `/${shop}` : '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Cleanup function
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [order, navigate, shop]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.getOrder(orderId, user?.id || "");
        console.log('Order details response:', response); // Debug log
        
        if (response.success && response.data) {
          // Transform the API response to match our OrderDetails interface
          const orderData: OrderDetails = {
            ...response.data,
            // Use _id as orderId since that's what the API provides
            orderId: response.data._id,
            // Map shipping address with proper fallbacks
            shippingAddress: {
              name: response.data.shippingAddress?.name || 'Not provided',
              line1: response.data.shippingAddress?.line1 || 'Not provided',
              line2: response.data.shippingAddress?.line2,
              city: response.data.shippingAddress?.city || 'Not provided',
              state: response.data.shippingAddress?.state || 'Not provided',
              postalCode: response.data.shippingAddress?.postalCode || 'Not provided',
              country: response.data.shippingAddress?.country || 'India',
              phone: response.data.shippingAddress?.phone || 'Not provided',
              email: response.data.shippingAddress?.email || response.data.customerEmail || ''
            },
            // Map payment information with proper fallbacks
            payment: {
              method: response.data.payment?.method || 'unknown',
              status: response.data.payment?.status || 'pending',
              transactionId: response.data.payment?.transactionId || ''
            },
            // Include status if available
            status: response.data.status || 'ORDER_PLACED'
          };
          
          setOrder(orderData);
          // Set initial status based on the order status from the API
          let initialStatusMessage = '';
          switch(response.data.status) {
            case 'ORDER_PLACED':
              initialStatusMessage = '📦 Order Placed';
              break;
            case 'PAYMENT_CONFIRMED':
              initialStatusMessage = '✅ Payment Confirmed';
              break;
            case 'ORDER_CONFIRMED':
              initialStatusMessage = '✅ Order Confirmed';
              break;
            case 'OUT_FOR_DELIVERY':
              initialStatusMessage = '🚚 Out for Delivery';
              break;
            case 'DELIVERED':
              initialStatusMessage = '📦 Delivered';
              break;
            case 'CANCELLED':
              initialStatusMessage = '❌ Order Cancelled';
              break;
            default:
              initialStatusMessage = 'Order Placed Successfully';
          }
          setOrderStatus(initialStatusMessage);
        } else {
          setError(response.error || "Failed to load order details");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
      setError("No order ID provided");
    }
  }, [orderId, user?.id, navigate]); // Added navigate to dependency array

  // WebSocket setup for real-time order status updates
  useEffect(() => {
    if (order && orderId) {
      // Get socket instance with token from auth context
      const token = user?.token || localStorage.getItem('token');
      const socket = getSocket(token);
      socketRef.current = socket;

      // Join room for this specific order
      socket.emit('join-order-room', { orderId });

      // Listen for order placed event
      socket.on('order:placed', (data) => {
        // Only update if the event is for this order
        if (data.orderId === orderId) {
          setOrderStatus("Order placed successfully");
        }
      });

      // Listen for order status updates
      socket.on('order:status_update', (data) => {
        // Only update if the event is for this order
        if (data.orderId === orderId) {
          // Update the order status based on the received status
          let statusMessage = '';
          switch(data.status) {
            case 'ORDER_PLACED':
              statusMessage = '📦 Order Placed';
              break;
            case 'PAYMENT_CONFIRMED':
              statusMessage = '✅ Payment Confirmed';
              break;
            case 'ORDER_CONFIRMED':
              statusMessage = '✅ Order Confirmed';
              break;
            case 'OUT_FOR_DELIVERY':
              statusMessage = '🚚 Out for Delivery';
              break;
            case 'DELIVERED':
              statusMessage = '📦 Delivered';
              break;
            case 'CANCELLED':
              statusMessage = '❌ Order Cancelled';
              break;
            default:
              statusMessage = data.status;
          }
          setOrderStatus(statusMessage);
        }
      });

      // Listen for connection errors
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Clean up function to remove listeners and disconnect
      return () => {
        if (socketRef.current) {
          socketRef.current.off('order:placed');
          socketRef.current.off('order:status_update');
          socketRef.current.off('connect_error');
          socketRef.current.off('disconnect');
          // Optionally leave the order room
          socketRef.current.emit('leave-order-room', { orderId });
        }
      };
    }
  }, [order, orderId, user]); // Include user in dependency array

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "The order you're looking for doesn't exist."}</p>
            <Link
              to={shop ? `/${shop}` : "/"}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Order Confirmed Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                {order.payment.method === 'razorpay' && order.payment.status === 'success'
                  ? 'Payment Successful!'
                  : 'Thank you for your order!'}
              </h1>
              <p className="text-lg text-gray-600">
                {order.payment.method === 'razorpay'
                  ? order.payment.status === 'success'
                    ? 'Your payment has been processed and your order is confirmed.'
                    : 'Your payment is being processed. We\'ll confirm once completed.'
                  : 'Your order has been confirmed for Cash on Delivery.'}
              </p>
              <div className="flex flex-col items-center gap-2 mt-2">
                <p className="text-sm text-gray-500">
                  Order ID: <span className="font-medium">{order.orderId}</span>
                </p>
                {order.payment.method === 'razorpay' && order.payment.transactionId && (
                  <p className="text-sm text-gray-500">
                    Transaction ID: <span className="font-medium">{order.payment.transactionId}</span>
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => {
                    const doc = generateInvoicePDF(order);
                    doc.save(`FlowLink-Invoice-${order.orderId}.pdf`);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Invoice
                </button>
                <Link
                  to={shop ? `/${shop}` : "/"}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-my-6 divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <li key={item.productId} className="py-6 flex">
                        <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover object-center"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <svg
                                className="h-12 w-12 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>{item.name}</h3>
                              <p className="ml-4">{formatPrice(item.price)}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p>{formatPrice(order.totals.subtotal)}</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <p>GST</p>
                      <p>{formatPrice(order.totals.gst)}</p>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <p>Delivery</p>
                      <p>{formatPrice(order.totals.delivery)}</p>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                      <p>Total</p>
                      <p>{formatPrice(order.totals.total)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">
                  Shipping Information
                </h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.shippingAddress.name}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.shippingAddress.line1}
                      {order.shippingAddress.line2 && (
                        <>
                          <br />
                          {order.shippingAddress.line2}
                        </>
                      )}
                      <br />
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.postalCode}
                      <br />
                      {order.shippingAddress.country}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.shippingAddress.phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Payment Method
                    </h3>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {order.payment.method}
                      {order.payment.transactionId && (
                        <span className="block text-xs text-gray-500 mt-1">
                          Transaction ID: {order.payment.transactionId}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status - Updated to show real-time status */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Order Status</h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      {/* Display real-time order status */}
                      {orderStatus || 'Order Placed Successfully'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {order.payment.method === 'COD' 
                        ? 'Your order has been confirmed. Payment will be collected at the time of delivery.'
                        : order.payment.status === 'success'
                          ? 'Your payment has been processed successfully. Your order is being prepared.'
                          : 'Your order has been received and payment is being processed.'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 px-4">
                  {order.payment.method === 'razorpay' && order.payment.status === 'success' && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Payment completed with Razorpay (Transaction ID: {order.payment.transactionId})
                    </div>
                  )}
                  {order.payment.method === 'COD' && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Cash on Delivery order - Please keep {formatPrice(order.totals.total)} ready at the time of delivery
                    </div>
                  )}
                </div>
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    What's next?
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                          <svg
                            className="h-4 w-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">
                          Check your email for the complete order confirmation and details.
                          {order.payment.method === 'razorpay' && ' A payment receipt has also been sent to your email.'}
                        </p>
                      </div>
                    </li>
                    <li className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                          <svg
                            className="h-4 w-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">
                          We'll send you a shipping confirmation with tracking details when your order is on the way!
                        </p>
                      </div>
                    </li>
                    {order.payment.method === 'COD' && (
                      <li className="flex">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                            <svg
                              className="h-4 w-4 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-gray-600">
                            Please keep {formatPrice(order.totals.total)} ready for cash payment when your order arrives.
                            Our delivery partner will provide a payment receipt upon successful delivery.
                          </p>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={shop ? `/${shop}` : "/"}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Continue Shopping
              </Link>
              <Link
                to={shop ? `/${shop}/orders` : "/orders"}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmed;