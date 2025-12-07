import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // To get token
import { API_BASE } from '../config';

export interface Address {
  id: string;
  _id?: string;
  type: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email?: string;
  isDefault: boolean;
  time?: string;
}

interface AddressContextType {
  addresses: Address[];
  selectedAddress: Address | null;
  addAddress: (address: Omit<Address, 'id'>) => Promise<string>; // Changed to Promise
  updateAddress: (id: string, address: Partial<Omit<Address, 'id'>>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  selectAddress: (id: string) => void;
  getDefaultAddress: () => Address | null;
  setDefaultAddress: (id: string) => Promise<void>;
  loading: boolean;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to get shop slug for API context
  const getShopContext = () => {
    // 1. Try localStorage (set by AuthContext on login)
    const stored = localStorage.getItem('shopSlug');
    if (stored) return stored;

    // 2. Try URL
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const reserved = ["login", "signup", "account", "cart", "checkout", "orders"];
    if (parts.length > 0 && !reserved.includes(parts[0])) {
      return parts[0];
    }
    return '';
  };

  // Fetch addresses when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setAddresses([]);
      return;
    }

    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const shop = getShopContext();
        const res = await fetch(`${API_BASE}/customer/addresses?shop=${shop}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAddresses(data);

          // Set default selected
          if (data.length > 0) {
            const defaultAddr = data.find((a: Address) => a.isDefault) || data[0];
            setSelectedAddress(defaultAddr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [isAuthenticated, token]);

  // Sync selected address to localStorage for persistence during session (cart/checkout flow)
  useEffect(() => {
    if (selectedAddress) {
      localStorage.setItem('selectedAddressId', selectedAddress.id);
      localStorage.setItem('selectedAddress', JSON.stringify({
        type: selectedAddress.type || 'Home',
        address: `${selectedAddress.name}, ${selectedAddress.line1} ${selectedAddress.city} ${selectedAddress.postalCode}`,
        time: '25 mins'
      }));
    }
  }, [selectedAddress]);

  const addAddress = async (newAddress: Omit<Address, 'id'>) => {
    if (!token) throw new Error("Not authenticated");

    try {
      const shop = getShopContext();
      const res = await fetch(`${API_BASE}/customer/addresses?shop=${shop}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      });

      if (!res.ok) throw new Error("Failed to add address");

      const savedAddr = await res.json();

      setAddresses(prev => {
        // Logic to handle isDefault if backend didn't already
        // Backend handles distinct default, so we just append/replace
        if (savedAddr.isDefault) {
          return [...prev.map(a => ({ ...a, isDefault: false })), savedAddr];
        }
        return [...prev, savedAddr];
      });

      // If it's the first one or default, select it
      if (savedAddr.isDefault || addresses.length === 0) {
        setSelectedAddress(savedAddr);
      }

      return savedAddr.id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateAddress = async (id: string, updates: Partial<Omit<Address, 'id'>>) => {
    if (!token) throw new Error("Not authenticated");
    if (!id) throw new Error("Address ID missing");
    try {
      const shop = getShopContext();
      const res = await fetch(`${API_BASE}/customer/addresses/${id}?shop=${shop}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error("Failed to update address");
      const updatedAddr = await res.json();

      setAddresses(prev => prev.map(a => a.id === id ? updatedAddr : (updates.isDefault ? { ...a, isDefault: false } : a)));

      if (selectedAddress?.id === id || updatedAddr.isDefault) {
        setSelectedAddress(updatedAddr);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };



  const deleteAddress = async (id: string) => {
    if (!token) throw new Error("Not authenticated");
    if (!id) throw new Error("Address ID missing");
    try {
      const shop = getShopContext();
      const res = await fetch(`${API_BASE}/customer/addresses/${id}?shop=${shop}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to delete");

      setAddresses(prev => {
        const filtered = prev.filter(a => a.id !== id);
        if (selectedAddress?.id === id) {
          setSelectedAddress(filtered.find(a => a.isDefault) || filtered[0] || null);
        }
        return filtered;
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const selectAddress = (id: string) => {
    const address = addresses.find(addr => addr.id === id);
    if (address) setSelectedAddress(address);
  };

  const setDefaultAddress = async (id: string) => {
    await updateAddress(id, { isDefault: true });
  };

  const getDefaultAddress = () => {
    return addresses.find(addr => addr.isDefault) || addresses[0] || null;
  };

  const value = {
    addresses,
    selectedAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
    getDefaultAddress,
    setDefaultAddress,
    loading
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};
