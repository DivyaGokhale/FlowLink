import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductDetails from "./pages/ProductDetails";
import AddToCart from "./components/AddToCart";  // ✅ Import it
import Landingpage from "./pages/Landingpage";
import {CartProvider} from "./components/CartContext"

function App() {
  return (
    <CartProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Landingpage />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/addToCart" element={<AddToCart />} />  {/* ✅ Add this */}
      </Routes>
    </Router>
    </CartProvider>
  );
}

export default App;
