// API service utility for FlowLink e-commerce app

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

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
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
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
    return this.request('/orders', {
      method: 'POST',
      headers: { 'x-user-id': userId },
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(userId: string, page = 1, limit = 10, status?: string): Promise<ApiResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.set('status', status);

    return this.request(`/orders?${params.toString()}`, {
      method: 'GET',
      headers: { 'x-user-id': userId },
    });
  }

  // Payment methods
  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    userId: string
  ): Promise<ApiResponse> {
    return this.request('/payment/verify', {
      method: 'POST',
      headers: { 'x-user-id': userId },
      body: JSON.stringify({ orderId, paymentId, signature }),
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
