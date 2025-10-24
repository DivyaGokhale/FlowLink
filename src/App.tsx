import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import ProductDetails from "./pages/ProductDetails";
import CategoryPage from "./pages/CategoryPage";
import Landingpage from "./pages/Landingpage";
import Shop from "./pages/Shop";
import ReviewPage from "./pages/ReviewPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";
import Addresses from "./pages/account/Addresses";
import LoginSecurity from "./pages/account/LoginSecurity";
import ManagePayments from "./pages/account/ManagePayments";

// Components
import AddToCart from "./components/AddToCart";
import PaymentPage from "./components/PaymentPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Context Providers
import { CartProvider } from "./components/CartContext";
import { ToastProvider } from "./components/ToastContext";
import { AuthProvider } from "./components/AuthContext";
import { AddressProvider } from "./components/AddressContext";

// ScrollToTop component is now inside the Router context
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Wrapper component to handle page transitions
const AnimatedRoute = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
  >
    {children}
  </motion.div>
);

const AppContent = () => {
  const location = useLocation();
  
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname.split('/')[1] || 'home'}>
                  {/* 🔐 Auth Routes */}
                  {/* Auth Routes */}
                  <Route path="/login" element={<AnimatedRoute><Login /></AnimatedRoute>} />
                  <Route path="/signup" element={<AnimatedRoute><Signup /></AnimatedRoute>} />
                  <Route path="/:shop/account" element={<AnimatedRoute><Login /></AnimatedRoute>} />
                  <Route path="/:shop/signup" element={<AnimatedRoute><Signup /></AnimatedRoute>} />

                  {/* Shop Routes */}
                  <Route path="/:shop" element={<AnimatedRoute><Landingpage /></AnimatedRoute>} />
                  <Route path="/:shop/checkout" element={<AnimatedRoute><Shop /></AnimatedRoute>} />

                  {/* ✅ Fixed ProductDetails routes with key */}
                  <Route
                    path="/:shop/product/:id"
                    element={<AnimatedRoute><ProductDetails /></AnimatedRoute>}
                  />
                  <Route
                    path="/product/:id"
                    element={<AnimatedRoute><ProductDetails /></AnimatedRoute>}
                  />

                  {/* 🧭 Category + Cart + Payments */}
                  <Route
                    path="/:shop/category/:category"
                    element={<AnimatedRoute><CategoryPage /></AnimatedRoute>}
                  />
                  <Route
                    path="/:shop/payment"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <PaymentPage />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  <Route path="/:shop/cart" element={<AnimatedRoute><AddToCart /></AnimatedRoute>} />
                  <Route
                    path="/:shop/review"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <ReviewPage />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />

                  {/* Orders + Profile (Shop-based) */}
                  <Route path="/:shop/orders" element={<AnimatedRoute><OrderHistory /></AnimatedRoute>} />
                  <Route
                    path="/:shop/profile"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />

                  {/* Global Routes */}
                  <Route path="/orders" element={<AnimatedRoute><OrderHistory /></AnimatedRoute>} />
                  <Route
                    path="/profile"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  
                  {/* Payment Management */}
                  <Route
                    path="/account/payments"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <ManagePayments />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  <Route
                    path="/:shop/account/payments"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <ManagePayments />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />

                  {/* Address Management */}
                  <Route
                    path="/account/addresses"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <Addresses />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  <Route
                    path="/:shop/account/addresses"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <Addresses />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  
                  {/* Login & Security */}
                  <Route
                    path="/account/login-security"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <LoginSecurity />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  <Route
                    path="/profile/payments"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <ManagePayments />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  <Route
                    path="/:shop/account/login-security"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <LoginSecurity />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  <Route path="/" element={<AnimatedRoute><Landingpage /></AnimatedRoute>} />
                  <Route path="/shop" element={<AnimatedRoute><Shop /></AnimatedRoute>} />
                  <Route
                    path="/category/:category"
                    element={<AnimatedRoute><CategoryPage /></AnimatedRoute>}
                  />
                  <Route
                    path="/payment"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <PaymentPage />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
                  <Route path="/addToCart" element={<AnimatedRoute><AddToCart /></AnimatedRoute>} />
                  <Route
                    path="/review"
                    element={
                      <AnimatedRoute>
                        <ProtectedRoute>
                          <ReviewPage />
                        </ProtectedRoute>
                      </AnimatedRoute>
                    }
                  />
        </Routes>
      </AnimatePresence>
    </main>
    <Footer />
  </>
  );
};

const App = () => {
  return (
    <Router>
      <ToastProvider>
        <CartProvider>
          <AuthProvider>
            <AddressProvider>
              <AppContent />
            </AddressProvider>
          </AuthProvider>
        </CartProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
