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
                {/* Per-shop routes */}
                <Route
                  path="/:shop"
                  element={
                    <ProtectedRoute>
                      <Landingpage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:shop/shop"
                  element={
                    <ProtectedRoute>
                      <Shop />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:shop/product/:id"
                  element={
                    <ProtectedRoute>
                      <ProductDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:shop/payment"
                  element={
                    <ProtectedRoute>
                      <PaymentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:shop/addToCart"
                  element={
                    <ProtectedRoute>
                      <AddToCart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:shop/review"
                  element={
                    <ProtectedRoute>
                      <ReviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:shop/orders"
                  element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Landingpage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop"
                  element={
                    <ProtectedRoute>
                      <Shop />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/product/:id"
                  element={
                    <ProtectedRoute>
                      <ProductDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment"
                  element={
                    <ProtectedRoute>
                      <PaymentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/addToCart"
                  element={
                    <ProtectedRoute>
                      <AddToCart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review"
                  element={
                    <ProtectedRoute>
                      <ReviewPage />
                    </ProtectedRoute>
                  }
                />
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
