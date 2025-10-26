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

// Helper function to ensure we always have a valid cart array
const ensureValidCart = (cart: any): CartItem[] => {
  try {
    if (!Array.isArray(cart)) {
      console.warn('Cart is not an array, resetting to empty array');
      return [];
    }
    
    // Ensure each item has required fields
    return cart
      .filter((item: any) => item && (item.id || item._id))
      .map((item: any) => ({
        id: String(item.id || item._id || Math.random().toString(36).substr(2, 9)),
        name: item.name || item.title || 'Unknown Product',
        title: item.title || item.name,
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        image: item.image || (Array.isArray(item.images) ? item.images[0] : ''),
        images: Array.isArray(item.images) ? item.images : [],
        pack: item.pack || '',
        desc: item.desc || item.description || '',
        description: item.description || item.desc || ''
      }));
  } catch (error) {
    console.error('Error ensuring valid cart:', error);
    return [];
  }
};

// Helper function to safely get cart from localStorage
const getInitialCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem("cart");
    if (!saved) return [];
    
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      console.warn('Invalid cart data in localStorage, resetting to empty array');
      return [];
    }
    return parsed;
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => getInitialCart());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  // Ensure cart is always an array
  const safeCart = Array.isArray(cart) ? cart : [];

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (Array.isArray(cart)) {
        localStorage.setItem("cart", JSON.stringify(cart));
      } else {
        console.error('Invalid cart state, resetting to empty array');
        setCart([]);
      }
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  }, [cart]);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    try {
      // Only save if cart is a valid array
      if (Array.isArray(cart)) {
        localStorage.setItem("cart", JSON.stringify(cart));
      } else {
        console.error('Cannot save cart: cart is not an array', cart);
        // Reset to empty array if cart is invalid
        setCart([]);
      }
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  }, [cart]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure we have required fields
      if (!product || (!product.id && !product._id)) {
        throw new Error("Invalid product");
      }

      const productId = String(product.id || product._id);
      const productName = product.name || product.title || 'Unknown Product';
      const productPrice = Number(product.price) || 0;
      const productImage = product.image || (Array.isArray(product.images) ? product.images[0] : '');

      setCart((prev) => {
        // Ensure prev is an array
        const currentCart = Array.isArray(prev) ? [...prev] : [];
        
        // Check if product already in cart
        const existingItemIndex = currentCart.findIndex(item => 
          item.id === productId || item._id === productId
        );

        if (existingItemIndex >= 0) {
          // Update quantity if exists
          const updatedCart = [...currentCart];
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            quantity: (updatedCart[existingItemIndex].quantity || 0) + (quantity || 1)
          };
          return updatedCart;
        }

        // Add new item
        const newItem: CartItem = {
          id: productId,
          _id: product._id || productId,
          name: productName,
          title: product.title || productName,
          price: productPrice,
          image: productImage,
          images: Array.isArray(product.images) ? product.images : [productImage].filter(Boolean),
          pack: product.pack || '',
          description: product.description || product.desc || '',
          desc: product.desc || product.description || '',
          quantity: quantity || 1
        };

        return [...currentCart, newItem];
      });

      showToast("Item added to cart");
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError("Failed to add item to cart");
      showToast("Failed to add item to cart");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const removeFromCart = useCallback((id: number | string) => {
    setCart((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.filter((item) => item.id !== id && item._id !== id);
    });
    showToast("Item removed from cart");
  }, [showToast]);

  const updateQuantity = useCallback((id: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.map((item) =>
        (item.id === id || item._id === id) ? { ...item, quantity } : item
      );
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    showToast("Cart cleared");
  }, [showToast]);

  const getTotalPrice = useCallback(() => {
    try {
      if (!Array.isArray(cart) || cart.length === 0) return 0;
      
      return cart.reduce((total, item) => {
        const price = Number(item?.price) || 0;
        const quantity = Math.max(1, Math.floor(Number(item?.quantity)) || 1);
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('Error calculating total price:', error);
      return 0;
    }
  }, [cart]);

  const getTotalItems = useCallback(() => {
    try {
      if (!Array.isArray(cart) || cart.length === 0) return 0;
      
      return cart.reduce((total, item) => {
        return total + Math.max(1, Math.floor(Number(item?.quantity)) || 1);
      }, 0);
    } catch (error) {
      console.error('Error calculating total items:', error);
      return 0;
    }
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

  const contextValue = {
    cart: safeCart,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart: useCallback(() => {
      setCart([]);
      showToast("Cart cleared");
    }, [showToast]),
    getTotalPrice,
    getTotalItems,
    syncWithServer: useCallback(async () => {
      setError(null);
    }, []),
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for easy usage
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
