import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductDetails from "./pages/ProductDetails";
import AddToCart from "./components/AddToCart";
import Landingpage from "./pages/Landingpage";
import { CartProvider } from "./components/CartContext";
import { ToastProvider } from "./components/ToastContext";
import PaymentPage from "./components/PaymentPage";
import ReviewPage from "./pages/ReviewPage";
import { AuthProvider } from "./components/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <>
    <ToastProvider>
      <CartProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Landingpage />
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
        </AuthProvider>
      </CartProvider>
    </ToastProvider>
    </>
  );
}

export default App;
