// API service utility for FlowLink e-commerce app

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5001/api";

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any[];
}

export interface ProfileUpdateData {
  displayName?: string;
  phone?: string;
  email?: string;
}

export interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  mrp?: number;
  quantity?: number;
  category?: string;
  images?: string[];
  discountedPrice?: number;
  discount?: {
    id: string;
    type: string;
    amount: number;
    method: string;
  };
}

export interface Order {
  _id: string;
  id?: string;  // Alternative ID field
  orderId?: string;  // Another possible ID field
  userId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  shippingAddress: Address;
  totals: {
    subtotal: number;
    gst: number;
    delivery: number;
    total: number;
  };
  payment: {
    method: string;
    status: string;
    transactionId: string;
  };
  status?: string; // Add status field
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
  email?: string;
  label?: string;
  isDefault?: boolean;
}

class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`Making API request to: ${url}`); // Debug log
      const response = await fetch(url, config);
      
      console.log(`Response status: ${response.status}, URL: ${url}`); // Debug log
      
      // Check if the response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, read the response as text to get the actual error
        const textResponse = await response.text();
        console.error(`API Error [${endpoint}]: Non-JSON response:`, textResponse);
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}`);
      }
      
      const data = await response.json();

      // Log the raw response for debugging
      console.log(`API Response [${endpoint}]:`, data);

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      // Ensure we have a properly structured response
      if (data === null || data === undefined) {
        throw new Error('Empty response from server');
      }

      // Transform response to match ApiResponse interface
      const apiResponse: ApiResponse<T> = {
        success: data.success ?? response.ok,
        data: data.data ?? data, // If no data field, use the entire response
        message: data.message,
        error: data.error
      };

      // Validate the response has required data
      if (!apiResponse.data) {
        console.error('Invalid API response structure:', data);
        throw new Error('No data received in order response');
      }

      return apiResponse;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      // If it's a parsing error, provide more specific information
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error(`SyntaxError likely caused by HTML response instead of JSON for endpoint: ${endpoint}`);
        throw new Error(`Invalid response format from server. Endpoint: ${endpoint}`);
      }
      // If it's a network error, provide more context
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`Network error when calling ${endpoint}:`, error);
        throw new Error(`Network error: Could not reach server. Please check if the server is running on ${this.baseURL}`);
      }
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string, shop?: string): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, shop }),
    });
  }

  async register(userData: {
    name?: string;
    email: string;
    password: string;
    shop?: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async checkLock(email: string): Promise<ApiResponse> {
    return this.request('/auth/check-lock', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    return this.request('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async checkEligibility(email: string, shop?: string, token?: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ email });
    if (shop) params.set('shop', shop);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return this.request(`/auth/eligibility?${params.toString()}`, {
      method: 'GET',
      headers,
    });
  }

  // Product methods
  async getProducts(shop?: string, userId?: string): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();
    if (shop) params.set('shop', shop);

    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;

    return this.request(`/products?${params.toString()}`, {
      method: 'GET',
      headers,
    });
  }

  async getProduct(id: string, shop?: string, userId?: string): Promise<ApiResponse<Product>> {
    const params = new URLSearchParams();
    if (shop) params.set('shop', shop);

    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;

    return this.request(`/products/${id}?${params.toString()}`, {
      method: 'GET',
      headers,
    });
  }

  // Cart methods
  async addToCart(productId: string, quantity: number, userId: string): Promise<ApiResponse> {
    return this.request('/cart/add', {
      method: 'POST',
      headers: { 'x-user-id': userId },
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async getCart(userId: string): Promise<ApiResponse> {
    return this.request('/cart', {
      method: 'GET',
      headers: { 'x-user-id': userId },
    });
  }

  // Profile methods
  async updateProfile(
    userId: string,
    updates: ProfileUpdateData
  ): Promise<ApiResponse> {
    return this.request('/auth/profile', {
      method: 'PATCH',
      headers: { 'x-user-id': userId },
      body: JSON.stringify(updates),
    });
  }

  // Order methods
  async createOrder(orderData: {
    items: OrderItem[];
    totals: any;
    payment: any;
    shippingAddress: Address;
    customerEmail?: string;
    customerName?: string;
  }, userId: string): Promise<ApiResponse<Order>> {
    console.log('Creating order with data:', { ...orderData, userId });
    
    const response = await this.request<Order>('/orders', {
      method: 'POST',
      headers: { 
        'x-user-id': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData),
    });
    
    console.log('Raw order response:', response);
    
    // Transform response if needed (in case server returns just the order object)
    const formattedResponse: ApiResponse<Order> = {
      success: response.success ?? true,
      data: response.data || (response as any as Order),
      message: response.message || 'Order created successfully',
      error: response.error
    };
    
    console.log('Formatted order response:', formattedResponse);
    
    if (!formattedResponse.data) {
      console.error('Missing order data in response', response);
      throw new Error('No data received in order response');
    }
    
    return formattedResponse;
  }

  async updateOrder(orderId: string, updateData: Partial<Order>, userId?: string): Promise<ApiResponse<Order>> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;
    
    return this.request(`/orders/${orderId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData),
    });
  }

  // Add new method for updating order status
  async updateOrderStatus(orderId: string, status: string, userId?: string): Promise<ApiResponse<Order>> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;
    
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
  }

  // Add new method for submitting order feedback
  async submitOrderFeedback(orderId: string, rating: number, comment: string, userId?: string): Promise<ApiResponse<Order>> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;
    
    return this.request(`/orders/${orderId}/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rating, comment }),
    });
  }

  async getOrders(userId: string, page = 1, limit = 10, status?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    return this.request(`/orders?${params.toString()}`, {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        'x-user-id': userId,
      },
    });
  }

  async getOrder(orderId: string, userId: string): Promise<ApiResponse<Order>> {
    if (!orderId) {
      return {
        success: false,
        error: 'Order ID is required',
      };
    }

    return this.request<Order>(`/orders/${orderId}`, {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        'x-user-id': userId,
      },
    });
  }

  // Payment methods
  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    userId: string
  ): Promise<ApiResponse> {
    return this.request('/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'x-user-id': userId },
      body: JSON.stringify({ order_id: orderId, payment_id: paymentId, signature }),
    });
  }

  // Shop methods
  async getShop(slug: string, userId?: string): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;

    return this.request(`/shops/${slug}`, {
      method: 'GET',
      headers,
    });
  }

  // Offers methods
  async getOffers(shop?: string, userId?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (shop) params.set('shop', shop);

    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;

    return this.request(`/offers?${params.toString()}`, {
      method: 'GET',
      headers,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;
