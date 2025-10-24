import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ChevronDown, Plus, Trash2, Edit, CreditCard, Smartphone, ShoppingBag, Store, ChevronLeft } from 'lucide-react';
import { Separator } from '../../components/ui/separator';

type PaymentMethod = {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  name: string;
  details: string;
  isDefault: boolean;
  expiry?: string;
};

const ManagePayments = () => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const goBack = () => {
    navigate(shop ? `/${shop}/profile` : '/profile');
  };
  
  // Sample data - replace with actual data from your API/state
  const [paymentMethods, setPaymentMethods] = useState<{
    cards: PaymentMethod[];
    upi: PaymentMethod[];
    wallets: PaymentMethod[];
  }>({
    cards: [
      {
        id: '1',
        type: 'card',
        name: 'VISA',
        details: '•••• •••• •••• 4242',
        expiry: '12/25',
        isDefault: true,
      },
    ],
    upi: [
      {
        id: '2',
        type: 'upi',
        name: 'UPI ID',
        details: 'user@upi',
        isDefault: false,
      },
    ],
    wallets: [],
  });

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'upi':
        return <Smartphone className="w-5 h-5 text-green-700" />;
      case 'wallet':
        return <ShoppingBag className="w-5 h-5 text-green-600" />;
      default:
        return <Store className="w-5 h-5 text-gray-600" />;
    }
  };

  const renderPaymentSection = (
    title: string,
    key: string,
    methods: PaymentMethod[],
    addButtonText: string,
    onAdd: () => void
  ) => (
    <Card className="mb-4 overflow-hidden">
      <button
        onClick={() => toggleSection(key)}
        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          {renderPaymentMethodIcon(key === 'cards' ? 'card' : key === 'upi' ? 'upi' : 'wallet')}
          <h3 className="ml-3 text-lg font-medium">{title}</h3>
          {methods.length > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              {methods.length} {methods.length === 1 ? 'method' : 'methods'}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${
            expandedSection === key ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      
      {expandedSection === key && (
        <div className="px-6 pb-4">
          {methods.length > 0 ? (
            <div className="space-y-4">
              {methods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    {renderPaymentMethodIcon(method.type)}
                    <div className="ml-3">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-500">
                        {method.details}
                        {method.expiry && ` • Expires ${method.expiry}`}
                      </div>
                    </div>
                    {method.isDefault && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!method.isDefault && (
                      <Button variant="outline" size="sm" className="text-sm">
                        Set as default
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-4">No payment methods added yet.</p>
          )}
          
          <Button
            onClick={onAdd}
            variant="outline"
            className="mt-4 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addButtonText}
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <button 
        onClick={goBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
      </button>
      
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Your Payment Options
        </h1>
        <p className="text-gray-600">
          An overview of your payment methods, settings, and subscriptions.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              As per updated payment guidelines, some saved cards may need re-verification.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Sections */}
      {renderPaymentSection(
        'Credit/Debit Cards',
        'cards',
        paymentMethods.cards,
        'Add a credit or debit card',
        () => console.log('Add card clicked')
      )}

      {renderPaymentSection(
        'UPI & Wallets',
        'upi',
        paymentMethods.upi,
        'Add UPI ID or Wallet',
        () => console.log('Add UPI/Wallet clicked')
      )}

      {renderPaymentSection(
        'Net Banking',
        'netbanking',
        [],
        'Add Net Banking',
        () => console.log('Add Net Banking clicked')
      )}
    </div>
  );
};

export default ManagePayments;
