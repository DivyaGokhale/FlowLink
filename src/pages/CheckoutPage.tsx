import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useAddress } from '../components/AddressContext';
import { useCart } from '../components/CartContext';
import AddressForm from '../components/AddressForm';
import { useToast } from '../components/ToastContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, Truck, CreditCard, Plus, Phone, Home, Building2 } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const { isAuthenticated } = useAuth();
  const { addresses, selectedAddress, selectAddress } = useAddress();
  const { cart, getTotalPrice } = useCart();
  const { showToast } = useToast();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const subtotal = getTotalPrice();
  const deliveryCharge = subtotal > 0 ? 50 : 0;
  const total = subtotal + deliveryCharge;

  // Auto-select default or first address
  useEffect(() => {
    if (selectedAddress) {
      setSelectedAddressId(selectedAddress.id);
    } else {
      const defaultAddr = addresses.find(a => a.isDefault);
      setSelectedAddressId(defaultAddr?.id || addresses[0]?.id || null);
    }
  }, [addresses, selectedAddress]);

  const handleProceed = () => {
    if (!selectedAddressId) {
      showToast('Please select a delivery address', 'error');
      return;
    }
    selectAddress(selectedAddressId);
    navigate(`/${shop || ''}/payment`);
  };

  // Guards
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/${shop || ''}/login`, { state: { from: 'checkout' } });
    } else if (cart.length === 0) {
      navigate(`/${shop || ''}/cart`);
    }
  }, [isAuthenticated, cart.length, navigate, shop]);

  if (!isAuthenticated || cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-blue-600" />
            Checkout
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Address + Items */}
          <div className="lg:col-span-2 space-y-8">

            {/* Delivery Address */}
            <Card className="border shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  1. Delivery Address
                </h2>
              </div>

              <div className="p-6">
                {!showAddressForm ? (
                  <>
                    {addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-6">You haven't saved any address yet</p>
                        <Button onClick={() => setShowAddressForm(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Address
                        </Button>
                      </div>
                    ) : (
                      <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
                        <div className="space-y-4">
                          {addresses.map((addr) => (
                            <Label
                              key={addr.id}
                              htmlFor={addr.id}
                              className="flex gap-4 p-5 border rounded-lg cursor-pointer hover:border-gray-400 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
                            >
                              <RadioGroupItem value={addr.id} id={addr.id} />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-lg">{addr.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {addr.type === 'home' ? <Home className="w-3 h-3 mr-1" /> : <Building2 className="w-3 h-3 mr-1" />}
                                    {addr.type}
                                  </Badge>
                                  {addr.isDefault && <Badge className="bg-blue-100 text-blue-700">Default</Badge>}
                                </div>
                                <p className="text-gray-700">
                                  {addr.line1}{addr.line2 && `, ${addr.line2}`}
                                  <br />
                                  {addr.city}, {addr.state} - {addr.postalCode}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {addr.phone}
                                </p>
                              </div>
                            </Label>
                          ))}
                        </div>
                      </RadioGroup>
                    )}

                    <Button
                      variant="outline"
                      className="w-full mt-6"
                      onClick={() => {
                        setSelectedAddressId(null);
                        setShowAddressForm(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Address
                    </Button>
                  </>
                ) : (
                  <div className="border-t -mx-6 px-6 pt-6">
                    <AddressForm
                      onSuccess={() => {
                        setShowAddressForm(false);
                        showToast('Address saved successfully', 'success');
                      }}
                      onCancel={() => setShowAddressForm(false)}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Order Items */}
            <Card className="border shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  2. Order Items ({cart.length})
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                    ) : (
                      <div className="bg-gray-200 border-2 border-dashed rounded-lg w-16 h-16 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                <Separator className="my-4" />
                <div className="text-right text-lg font-semibold">
                  Subtotal: ₹{subtotal.toFixed(2)}
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Price Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border shadow-sm">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <Truck className="w-6 h-6 text-blue-600" />
                  Price Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-base">
                  <span>Price ({cart.length} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span>Delivery Charges</span>
                  <span className="text-green-600">
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-blue-600">₹{total.toFixed(2)}</span>
                </div>

                <Button
                  size="lg"
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-lg py-6"
                  onClick={handleProceed}
                  disabled={!selectedAddressId || showAddressForm}
                >
                  Proceed to Payment
                </Button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  Secured by SSL • Your information is safe
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;