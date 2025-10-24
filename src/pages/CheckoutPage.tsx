import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useAddress } from '../components/AddressContext';
import { useCart } from '../components/CartContext';
import { useToast } from '../components/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';
import AddressForm from '../components/AddressForm';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const { isAuthenticated } = useAuth();
  const { addresses, selectedAddress, selectAddress } = useAddress();
  const { cart, getTotalPrice } = useCart();
  const { showToast } = useToast();
  
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Set initial selected address
  useEffect(() => {
    if (selectedAddress) {
      setSelectedAddressId(selectedAddress.id);
    } else if (addresses.length > 0) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [selectedAddress, addresses]);

  const handleProceedToPayment = () => {
    if (!selectedAddressId) {
      showToast('Please select or add a delivery address', 'error');
      return;
    }
    
    // Select the address before proceeding
    const address = addresses.find(addr => addr.id === selectedAddressId);
    if (address) {
      selectAddress(address);
      navigate(`/${shop || ''}/payment`);
    }
  };

  if (!isAuthenticated) {
    navigate(`/${shop || ''}/login`, { state: { from: 'checkout' } });
    return null;
  }

  if (cart.length === 0) {
    navigate(`/${shop || ''}/cart`);
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Address Selection */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
              
              {!showAddressForm ? (
                <>
                  <div className="space-y-4 mb-6">
                    {addresses.length > 0 ? (
                      addresses.map((address) => (
                        <div 
                          key={address.id}
                          className={`border rounded-lg p-4 cursor-pointer ${
                            selectedAddressId === address.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedAddressId(address.id)}
                        >
                          <div className="flex items-start">
                            <input
                              type="radio"
                              name="address"
                              checked={selectedAddressId === address.id}
                              onChange={() => setSelectedAddressId(address.id)}
                              className="mt-1 mr-3"
                            />
                            <div>
                              <p className="font-medium">{address.name}</p>
                              <p className="text-gray-600">
                                {address.line1}, {address.line2 && `${address.line2}, `}
                                {address.city}, {address.state} - {address.postalCode}
                              </p>
                              <p className="text-gray-600">Phone: {address.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No addresses found. Please add a delivery address.</p>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddressForm(true)}
                    className="w-full"
                  >
                    + Add New Address
                  </Button>
                </>
              ) : (
                <AddressForm 
                  onSuccess={() => {
                    setShowAddressForm(false);
                    showToast('Address added successfully', 'success');
                  }}
                  onCancel={() => setShowAddressForm(false)}
                />
              )}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>₹50.00</span>
                </div>
                <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
                  <span>Total</span>
                  <span>₹{(getTotalPrice() + 50).toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                onClick={handleProceedToPayment}
                disabled={!selectedAddressId}
                className="w-full mt-4"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutPage;
