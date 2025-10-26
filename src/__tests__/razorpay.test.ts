import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RazorpayService } from '../lib/razorpay';
import type { PaymentData, RazorpayResponse } from '../types/razorpay';

// Mock window.Razorpay
const mockRazorpay = vi.fn();
mockRazorpay.prototype.open = vi.fn();

describe('RazorpayService', () => {
  let service: RazorpayService;
  
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset DOM
    document.head.innerHTML = '';
    
    // Mock fetch
    global.fetch = vi.fn();
    
    // Mock window.Razorpay
    (window as any).Razorpay = mockRazorpay;
    
    // Get service instance
    service = RazorpayService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadScript', () => {
    it('should load Razorpay script only once', async () => {
      // First load
      await service.loadScript();
      expect(document.head.querySelector('script')?.src).toContain('checkout.razorpay.com');

      // Second load - should not add another script
      await service.loadScript();
      expect(document.head.querySelectorAll('script').length).toBe(1);
    });

    it('should reject if script fails to load', async () => {
      const script = document.createElement('script');
      vi.spyOn(document, 'createElement').mockReturnValue(script);

      const loadPromise = service.loadScript();
      script.dispatchEvent(new Event('error'));

      await expect(loadPromise).rejects.toThrow('Failed to load Razorpay script');
    });
  });

  describe('initiatePayment', () => {
    const mockPaymentData: PaymentData = {
      orderId: 'test_order_123',
      amount: 1000,
      currency: 'INR',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '1234567890',
    };

    const mockSuccessResponse: RazorpayResponse = {
      razorpay_payment_id: 'pay_123',
      razorpay_order_id: 'order_123',
      razorpay_signature: 'signature_123',
    };

    beforeEach(() => {
      // Mock successful order creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ order_id: 'order_123' }),
      });

      // Mock successful payment verification
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ verified: true }),
      });
    });

    it('should create order and initialize Razorpay payment', async () => {
      const callbacks = {
        onSuccess: vi.fn(),
        onError: vi.fn(),
        onDismiss: vi.fn(),
      };

      await service.initiatePayment(mockPaymentData, callbacks);

      // Should create order
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/razorpay/create-order',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"amount":100000'), // amount in paise
        })
      );

      // Should initialize Razorpay
      expect(mockRazorpay).toHaveBeenCalledWith(
        expect.objectContaining({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: '100000',
          currency: 'INR',
          order_id: 'order_123',
        })
      );

      // Should open Razorpay modal
      expect(mockRazorpay.prototype.open).toHaveBeenCalled();
    });

    it('should handle successful payment', async () => {
      const callbacks = {
        onSuccess: vi.fn(),
        onError: vi.fn(),
      };

      await service.initiatePayment(mockPaymentData, callbacks);

      // Get the handler function passed to Razorpay
      const razorpayOptions = mockRazorpay.mock.calls[0][0];
      
      // Simulate successful payment
      await razorpayOptions.handler(mockSuccessResponse);

      // Should verify payment
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/razorpay/verify-payment',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            order_id: mockSuccessResponse.razorpay_order_id,
            payment_id: mockSuccessResponse.razorpay_payment_id,
            signature: mockSuccessResponse.razorpay_signature,
          }),
        })
      );

      // Should call onSuccess with payment response
      expect(callbacks.onSuccess).toHaveBeenCalledWith(mockSuccessResponse);
      expect(callbacks.onError).not.toHaveBeenCalled();
    });

    it('should handle payment verification failure', async () => {
      const callbacks = {
        onSuccess: vi.fn(),
        onError: vi.fn(),
      };

      // Mock failed verification
      (global.fetch as any).mockReset();
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ order_id: 'order_123' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ 
            message: 'Invalid signature',
            code: 'VERIFY_FAILED'
          }),
        });

      await service.initiatePayment(mockPaymentData, callbacks);

      // Simulate payment callback
      const razorpayOptions = mockRazorpay.mock.calls[0][0];
      await razorpayOptions.handler(mockSuccessResponse);

      // Should call onError with verification error
      expect(callbacks.onSuccess).not.toHaveBeenCalled();
      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Payment verification failed',
          step: 'verification',
          code: 'VERIFY_FAILED',
        })
      );
    });
  });

  describe('mockPayment', () => {
    const mockPaymentData: PaymentData = {
      orderId: 'test_order_123',
      amount: 1000,
    };

    it('should simulate successful payment in development', async () => {
      vi.stubEnv('MODE', 'development');
      
      const callbacks = {
        onSuccess: vi.fn(),
        onError: vi.fn(),
      };

      await service.mockPayment(mockPaymentData, callbacks);

      // Fast-forward timers
      vi.runAllTimers();

      // Should call onSuccess with mock response
      expect(callbacks.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          razorpay_payment_id: expect.stringContaining('mock_pay_'),
          razorpay_order_id: expect.stringContaining(mockPaymentData.orderId),
          razorpay_signature: 'mock_sign_valid',
        })
      );
      expect(callbacks.onError).not.toHaveBeenCalled();
    });

    it('should not process mock payment in production', async () => {
      vi.stubEnv('MODE', 'production');
      
      const callbacks = {
        onSuccess: vi.fn(),
        onError: vi.fn(),
      };

      const consoleSpy = vi.spyOn(console, 'warn');
      
      await service.mockPayment(mockPaymentData, callbacks);
      vi.runAllTimers();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Mock payment attempted in non-development environment'
      );
      expect(callbacks.onSuccess).not.toHaveBeenCalled();
      expect(callbacks.onError).not.toHaveBeenCalled();
    });
  });
});