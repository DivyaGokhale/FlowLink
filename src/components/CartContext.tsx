import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "./ToastContext";

// Import the global type declarations
import "../types/global.d";

interface Product {
  id?: number | string;
  _id?: string;
  name?: string;
  title?: string;
  price: number;
  image?: string;
  images?: string[];
  pack?: string;
  desc?: string;
  description?: string;
}

interface CartItem extends Product {
  quantity: number;
  id: number | string; // Ensure id is always present
}

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  syncWithServer: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Load from localStorage on first render
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cart") || "[]");
      // Normalize cart items to ensure consistent id field
      const normalizedCart = saved.map((item: any) => ({
        ...item,
        id: item.id || item._id || Math.random().toString(36).substr(2, 9),
        name: item.name || item.title || "Unknown Product",
        title: item.title || item.name,
        image: item.image || item.images?.[0],
        images: item.images,
        pack: item.pack,
        desc: item.desc || item.description,
        description: item.description || item.desc,
        quantity: item.quantity || 1
      }));
      setCart(normalizedCart);
    } catch (err) {
      console.error("Error loading cart from localStorage:", err);
      setError("Failed to load cart data");
    }
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  }, [cart]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Normalize product data
      const normalizedProduct: CartItem = {
        id: product.id || product._id || Math.random().toString(36).substr(2, 9),
        name: product.name || product.title || "Unknown Product",
        title: product.title || product.name,
        price: product.price,
        image: product.image || product.images?.[0],
        images: product.images,
        pack: product.pack,
        desc: product.desc || product.description,
        description: product.description || product.desc,
        quantity: quantity
      };

      setCart((prev) => {
        const productId = product.id || product._id;
        const existing = prev.find((item) => item.id === productId);
        if (existing) {
          return prev.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, normalizedProduct];
      });

      showToast("Item added to cart");
    } catch (err) {
      setError("Failed to add item to cart");
      showToast("Failed to add item to cart");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const removeFromCart = useCallback((id: number | string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast("Item removed from cart");
  }, [showToast]);

  const updateQuantity = useCallback((id: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    showToast("Cart cleared");
  }, [showToast]);

  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const syncWithServer = useCallback(async () => {
    // This would sync cart with server when user is logged in
    // For now, we'll just clear any errors
    setError(null);
  }, []);

  // Listen for logout event and clear cart
  useEffect(() => {
    const handleLogout = () => {
      clearCart();
    };

    window.addEventListener('userLoggedOut', handleLogout);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, [clearCart]);

  return (
    <CartContext.Provider
      value={{ 
        cart, 
        isLoading, 
        error,
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart,
        getTotalPrice,
        getTotalItems,
        syncWithServer
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ✅ Custom hook for easy usage
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
