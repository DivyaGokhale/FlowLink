// Razorpay Payment Integration for FlowLink

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentData {
  orderId: string;
  amount: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
}

class RazorpayService {
  private keyId: string;
  private isLoaded: boolean = false;

  constructor() {
    this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  }

  private async loadScript(): Promise<void> {
    if (this.isLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      document.head.appendChild(script);
    });
  }

  async createOrder(paymentData: PaymentData): Promise<string> {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount * 100, // Convert to paise
          currency: paymentData.currency || 'INR',
          receipt: paymentData.orderId,
          notes: {
            customer_name: paymentData.customerName || '',
            customer_email: paymentData.customerEmail || '',
            customer_phone: paymentData.customerPhone || '',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const data = await response.json();
      return data.order_id;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  async initiatePayment(
    paymentData: PaymentData,
    onSuccess: (response: RazorpayResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      await this.loadScript();

      if (!window.Razorpay) {
        throw new Error('Razorpay not loaded');
      }

      // Create order first
      const razorpayOrderId = await this.createOrder(paymentData);

      const options: RazorpayOptions = {
        key: this.keyId,
        amount: paymentData.amount * 100, // Convert to paise
        currency: paymentData.currency || 'INR',
        name: 'FlowLink',
        description: paymentData.description || 'Order Payment',
        order_id: razorpayOrderId,
        prefill: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          contact: paymentData.customerPhone,
        },
        theme: {
          color: '#3B82F6', // Blue color matching FlowLink theme
        },
        handler: (response: RazorpayResponse) => {
          onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            onError(new Error('Payment cancelled by user'));
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      onError(error);
    }
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_id: paymentId,
          signature: signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const data = await response.json();
      return data.verified === true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  // Mock payment for development/testing
  async initiateMockPayment(
    paymentData: PaymentData,
    onSuccess: (response: RazorpayResponse) => void,
    onError: (error: any) => void
  ): Promise<void> {
    // Simulate payment processing delay
    setTimeout(() => {
      const mockResponse: RazorpayResponse = {
        razorpay_payment_id: `mock_payment_${Date.now()}`,
        razorpay_order_id: `mock_order_${Date.now()}`,
        razorpay_signature: `mock_signature_${Date.now()}`,
      };
      onSuccess(mockResponse);
    }, 2000);
  }
}

export const razorpayService = new RazorpayService();
export default razorpayService;
