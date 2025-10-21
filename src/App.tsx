import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductDetails from "./pages/ProductDetails";
import AddToCart from "./components/AddToCart";
import Landingpage from "./pages/Landingpage";
import { CartProvider } from "./components/CartContext";
import { ToastProvider } from "./components/ToastContext";
import PaymentPage from "./components/PaymentPage";
import Shop from "./pages/Shop";
import ReviewPage from "./pages/ReviewPage";
import { AuthProvider } from "./components/AuthContext";
import { AddressProvider } from "./components/AddressContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
    <ToastProvider>
      <CartProvider>
        <AuthProvider>
          <AddressProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/:shop/login" element={<Login />} />
                <Route path="/:shop/signup" element={<Signup />} />
                {/* Per-shop routes (public browse) */}
                <Route path="/:shop" element={<Landingpage />} />
                <Route path="/:shop/shop" element={<Shop />} />
                <Route path="/:shop/product/:id" element={<ProductDetails />} />
                <Route path="/:shop/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                <Route path="/:shop/addToCart" element={<AddToCart />} />
                <Route path="/:shop/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
                <Route path="/:shop/orders" element={<OrderHistory />} />
                <Route path="/:shop/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/" element={<Landingpage />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                <Route path="/addToCart" element={<AddToCart />} />
                <Route path="/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
              </Routes>
            </Router>
          </AddressProvider>
        </AuthProvider>
      </CartProvider>
    </ToastProvider>
    </>
  );
}

export default App;
