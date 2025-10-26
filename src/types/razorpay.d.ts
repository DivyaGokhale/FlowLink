// Razorpay type definitions for FlowLink

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: RazorpayEvent, handler: (response: any) => void) => void;
  close: () => void;
}

export type RazorpayEvent = 'payment.success' | 'payment.failed' | 'modal:closed';

export interface RazorpayOptions {
  key: string;
  amount: number | string;
  currency: string;
  name: string;
  description: string;
  order_id: string;
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

export interface PaymentError extends Error {
  code?: string;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
}