import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductDetails from "./pages/ProductDetails";
import AddToCart from "./components/AddToCart"; 
import Landingpage from "./pages/Landingpage";
import {CartProvider} from "./components/CartContext"
import {ToastProvider}  from "./components/ToastContext";

function App() {
  return (
    <>
    <ToastProvider>
    <CartProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Landingpage />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/addToCart" element={<AddToCart />} />  
      </Routes>
    </Router>
    </CartProvider>
    </ToastProvider>
    </>
  );
}

export default App;
