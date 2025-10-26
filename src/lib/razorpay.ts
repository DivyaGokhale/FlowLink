import type {
  RazorpayOptions,
  RazorpayResponse,
  PaymentData,
  PaymentError,
  RazorpayInstance
} from '../types/razorpay';

class RazorpayError extends Error implements PaymentError {
  code?: string;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;

  constructor(message: string, details?: Partial<PaymentError>) {
    super(message);
    this.name = 'RazorpayError';
    Object.assign(this, details);
  }
}

export class RazorpayService {
  private keyId: string;
  private isScriptLoaded: boolean = false;
  private static instance: RazorpayService;

  private constructor() {
    this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!this.keyId) {
      console.warn('VITE_RAZORPAY_KEY_ID is not configured');
    }
  }

  static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  public async loadScript(): Promise<void> {
    if (this.isScriptLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new RazorpayError('Failed to load Razorpay script', {
          step: 'script_loading',
          source: 'RazorpayService'
        }));
      };
      document.head.appendChild(script);
    });
  }

  private async createOrder(paymentData: PaymentData): Promise<string> {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      console.log('Creating Razorpay order:', {
        url: `${apiBaseUrl}/razorpay/create-order`,
        data: {
          amount: Math.round(paymentData.amount * 100),
          currency: paymentData.currency || 'INR',
          receipt: paymentData.orderId,
        }
      });
      
      const response = await fetch(`${apiBaseUrl}/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(paymentData.amount * 100), // Convert to paise
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
        const error = await response.json().catch(() => ({}));
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        throw new RazorpayError('Failed to create Razorpay order', {
          step: 'order_creation',
          description: error.error || error.message || 'Server returned an error',
          code: error.code,
        });
      }

      const data = await response.json();
      console.log('Razorpay order creation response:', data);
      
      if (!data.order_id) {
        console.error('Invalid order response:', data);
        throw new RazorpayError('Invalid order response from server', {
          step: 'order_creation',
          description: 'Server response missing order_id',
          source: 'RazorpayService'
        });
      }
      
      return data.order_id;
    } catch (error) {
      if (error instanceof RazorpayError) throw error;
      throw new RazorpayError('Failed to create Razorpay order', {
        step: 'order_creation',
        source: 'RazorpayService',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  public async initiatePayment(
    paymentData: PaymentData,
    callbacks: {
      onSuccess: (response: RazorpayResponse) => Promise<void>;
      onError?: (error: PaymentError) => void;
      onDismiss?: () => void;
    }
  ): Promise<void> {
    if (!this.keyId) {
      throw new RazorpayError('Razorpay key is not configured', {
        step: 'initialization',
        source: 'RazorpayService',
      });
    }

    try {
      await this.loadScript();

      if (!window.Razorpay) {
        throw new RazorpayError('Razorpay not initialized', {
          step: 'initialization',
          source: 'RazorpayService',
        });
      }

      const orderId = await this.createOrder(paymentData);

      const options: RazorpayOptions = {
        key: this.keyId,
        amount: (paymentData.amount * 100).toString(),
        currency: paymentData.currency || 'INR',
        name: 'FlowLink',
        description: paymentData.description || `Order #${paymentData.orderId}`,
        order_id: orderId,
        prefill: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          contact: paymentData.customerPhone,
        },
        theme: {
          color: '#4F46E5', // Indigo color matching FlowLink theme
        },
        handler: async (response: RazorpayResponse) => {
          try {
            await this.verifyPayment(response);
            await callbacks.onSuccess(response);
          } catch (error) {
            callbacks.onError?.(error as PaymentError);
          }
        },
        modal: {
          ondismiss: () => {
            callbacks.onDismiss?.();
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      const paymentError = error instanceof RazorpayError ? error : new RazorpayError(
        'Payment initialization failed',
        {
          step: 'initialization',
          source: 'RazorpayService',
          description: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      callbacks.onError?.(paymentError);
    }
  }

  public async verifyPayment(response: RazorpayResponse): Promise<boolean> {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const verifyResponse = await fetch(`${apiBaseUrl}/razorpay/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json().catch(() => ({}));
        throw new RazorpayError('Payment verification failed', {
          step: 'verification',
          description: error.message || 'Server returned an error',
          code: error.code,
        });
      }

      const data = await verifyResponse.json();
      return data.verified === true;
    } catch (error) {
      throw new RazorpayError('Payment verification failed', {
        step: 'verification',
        source: 'RazorpayService',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Development/testing helper
  public async mockPayment(
    paymentData: PaymentData,
    callbacks: {
      onSuccess: (response: RazorpayResponse) => Promise<void>;
      onError?: (error: PaymentError) => void;
    }
  ): Promise<void> {
    if (import.meta.env.MODE !== 'development') {
      console.warn('Mock payment attempted in non-development environment');
      return;
    }

    setTimeout(async () => {
      try {
        const mockResponse: RazorpayResponse = {
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_order_id: `mock_order_${paymentData.orderId}`,
          razorpay_signature: 'mock_sign_valid',
        };
        await callbacks.onSuccess(mockResponse);
      } catch (error) {
        callbacks.onError?.(new RazorpayError('Mock payment failed', {
          step: 'mock_payment',
          source: 'RazorpayService',
          description: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }, 2000);
  }
}

// Export a singleton instance
export const razorpayService = RazorpayService.getInstance();
export default razorpayService;
