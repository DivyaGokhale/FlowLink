import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Address {
  id: string;
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
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  getDefaultAddress: () => Address | null;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Load addresses from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('userAddresses');
    if (stored) {
      try {
        const parsedAddresses = JSON.parse(stored);
        setAddresses(parsedAddresses);

        // Set selected address (default or first one)
        const selectedId = localStorage.getItem('selectedAddressId');
        if (selectedId) {
          const found = parsedAddresses.find((addr: Address) => addr.id === selectedId);
          if (found) setSelectedAddress(found);
        } else if (parsedAddresses.length > 0) {
          const defaultAddr = parsedAddresses.find((addr: Address) => addr.isDefault) || parsedAddresses[0];
          setSelectedAddress(defaultAddr);
          localStorage.setItem('selectedAddressId', defaultAddr.id);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    }
  }, []);

  // Save addresses to localStorage whenever addresses change
  useEffect(() => {
    if (addresses.length > 0) {
      localStorage.setItem('userAddresses', JSON.stringify(addresses));
    }
  }, [addresses]);

  // Save selected address ID to localStorage
  useEffect(() => {
    if (selectedAddress) {
      localStorage.setItem('selectedAddressId', selectedAddress.id);
      // Also save to the format expected by PaymentPage
      localStorage.setItem('selectedAddress', JSON.stringify({
        type: selectedAddress.type,
        address: `${selectedAddress.name}, ${selectedAddress.line1}${selectedAddress.line2 ? ', ' + selectedAddress.line2 : ''}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postalCode}`,
        time: selectedAddress.time || '25 mins',
        distance: 3.0 // Default distance for delivery calculation
      }));
    }
  }, [selectedAddress]);

  const addAddress = (newAddress: Omit<Address, 'id'>) => {
    const id = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const address: Address = {
      ...newAddress,
      id,
    };

    setAddresses(prev => {
      // If this is the first address or marked as default, set as default
      if (prev.length === 0 || address.isDefault) {
        const updated = prev.map(addr => ({ ...addr, isDefault: false }));
        return [...updated, { ...address, isDefault: true }];
      }
      return [...prev, address];
    });
  };

  const updateAddress = (id: string, updates: Partial<Address>) => {
    setAddresses(prev => prev.map(addr =>
      addr.id === id ? { ...addr, ...updates } : addr
    ));
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => {
      const filtered = prev.filter(addr => addr.id !== id);
      // If deleted address was selected, select another one
      if (selectedAddress?.id === id) {
        const newSelected = filtered.find(addr => addr.isDefault) || filtered[0] || null;
        setSelectedAddress(newSelected);
      }
      return filtered;
    });
  };

  const selectAddress = (id: string) => {
    const address = addresses.find(addr => addr.id === id);
    if (address) {
      setSelectedAddress(address);
    }
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
