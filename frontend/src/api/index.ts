import { request } from './http-client.js';
import type {
  CartSyncInput, CartSyncResponse,
  CreateOrderInput, CreateOrderResponse,
  OrderResponse,
  UserOrdersResponse,
  Address,
  WishlistItem,
  AuthResponse,
  RefreshResponse,
  ProductsResponse,
  ProductDetailResponse,
  ApiEnvelope,
  AdminStats,
  AdminOrdersResponse,
  AdminOrderDetailResponse,
  AdminProductsResponse,
  AdminUsersResponse,
  UploadResponse,
} from '@twinkle-hearts/shared';

export { ApiClientError, setTokenGetter } from './http-client.js';
export type { ApiError, RequestOptions } from './http-client.js';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface ProductListItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
}

interface OrderSummary {
  id: string;
  total: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  customerName: string;
  createdAt: string;
}

export type {
  LoginInput,
  RegisterInput,
  ProductListItem,
  OrderSummary,
};

type Api = {
  auth: {
    login: (input: LoginInput) => Promise<ApiEnvelope<AuthResponse>>;
    register: (input: RegisterInput) => Promise<ApiEnvelope<AuthResponse>>;
    logout: () => Promise<void>;
    me: () => Promise<ApiEnvelope<AuthResponse['user']>>;
    refresh: (refreshToken: string) => Promise<ApiEnvelope<RefreshResponse>>;
    updateProfile: (data: { name: string; phone: string; avatar: string }) => Promise<ApiEnvelope<AuthResponse['user']>>;
  };
  products: {
    list: (params?: { page?: number; limit?: number; search?: string; category?: string }) => Promise<ProductsResponse>;
    search: (query: string) => Promise<{ products: ProductListItem[] }>;
    get: (id: string) => Promise<ProductDetailResponse>;
  };
  cart: {
    sync: (input: CartSyncInput) => Promise<CartSyncResponse>;
  };
  orders: {
    create: (input: CreateOrderInput) => Promise<CreateOrderResponse>;
    get: (id: string) => Promise<OrderResponse>;
    list: (page?: number, limit?: number) => Promise<UserOrdersResponse>;
  };
  addresses: {
    list: () => Promise<Array<Address>>;
    create: (address: Omit<Address, 'id'>) => Promise<Address>;
    update: (id: string, address: Partial<Address>) => Promise<Address>;
    delete: (id: string) => Promise<void>;
  };
  wishlist: {
    list: () => Promise<WishlistItem[]>;
    add: (productId: string) => Promise<WishlistItem>;
    remove: (productId: string) => Promise<void>;
  };
  admin: {
    stats: () => Promise<ApiEnvelope<AdminStats>>;
    orders: (page?: number, limit?: number, status?: string) => Promise<AdminOrdersResponse>;
    orderDetail: (id: string) => Promise<AdminOrderDetailResponse>;
    updateOrderStatus: (id: string, status: string) => Promise<AdminOrderDetailResponse>;
    products: {
      list: (params?: { page?: number; limit?: number; search?: string; category?: string }) => Promise<AdminProductsResponse>;
      create: (product: {
        name: string;
        description: string;
        price: number;
        stock: number;
        category: string;
        images: string[];
        isActive?: boolean;
      }) => Promise<{ success: boolean; data: unknown }>;
      update: (id: string, product: Partial<{
        name: string;
        description: string;
        price: number;
        stock: number;
        category: string;
        images: string[];
        isActive: boolean;
      }>) => Promise<{ success: boolean; data: unknown }>;
      delete: (id: string) => Promise<{ success: boolean; message: string }>;
      upload: (formData: FormData) => Promise<UploadResponse>;
    };
    users: {
      list: (params?: { page?: number; limit?: number; search?: string }) => Promise<AdminUsersResponse>;
      updateRole: (userId: string, role: string) => Promise<{ success: boolean; data: { id: string; name: string; email: string; role: string } }>;
    };
  };
};

export const api: Api = {
  auth: {
    login: (input) => request('/api/auth/login', { method: 'POST', body: input }),
    register: (input) => request('/api/auth/register', { method: 'POST', body: input }),
    logout: () => request('/api/auth/logout', { method: 'POST', authenticated: true }),
    me: () => request('/api/auth/me', { authenticated: true }),
    refresh: (refreshToken: string) => request('/api/auth/refresh', { method: 'POST', body: { refreshToken } }),
    updateProfile: (data) => request('/api/users/profile', { method: 'PUT', body: data, authenticated: true }),
  },

  products: {
    list: (params) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.category) query.set('category', params.category);
      const qs = query.toString();
      return request(`/api/products${qs ? `?${qs}` : ''}`);
    },
    search: (query: string) => request(`/api/products/search?q=${encodeURIComponent(query)}`),
    get: (id: string) => request(`/api/products/${id}`),
  },

  cart: {
    sync: (input) => request('/api/cart/sync', { method: 'POST', body: input, authenticated: true }),
  },

  orders: {
    create: (input) => request('/api/orders/create', { method: 'POST', body: input, authenticated: true }),
    get: (id: string) => request(`/api/orders/${id}`, { authenticated: true }),
    list: (page = 1, limit = 20) => request(`/api/orders?page=${page}&limit=${limit}`, { authenticated: true }),
  },

  addresses: {
    list: () => request('/api/users/addresses', { authenticated: true }),
    create: (address) => request('/api/users/addresses', { method: 'POST', body: address, authenticated: true }),
    update: (id, address) => request(`/api/users/addresses/${id}`, { method: 'PUT', body: address, authenticated: true }),
    delete: (id) => request(`/api/users/addresses/${id}`, { method: 'DELETE', authenticated: true }),
  },

  wishlist: {
    list: () => request('/api/users/wishlist', { authenticated: true }),
    add: (productId) => request('/api/users/wishlist', { method: 'POST', body: { productId }, authenticated: true }),
    remove: (productId) => request(`/api/users/wishlist/${productId}`, { method: 'DELETE', authenticated: true }),
  },

  admin: {
    stats: () => request('/api/admin/stats', { authenticated: true }),
    orders: (page = 1, limit = 20, status?: string) => {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', String(limit));
      if (status && status !== 'all') query.set('status', status);
      return request(`/api/admin/orders?${query.toString()}`, { authenticated: true });
    },
    orderDetail: (id) => request(`/api/admin/orders/${id}`, { authenticated: true }),
    updateOrderStatus: (id, status) => request(`/api/admin/orders/${id}/status`, { method: 'PUT', body: { status }, authenticated: true }),
    products: {
      list: (params) => {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.search) query.set('search', params.search);
        if (params?.category) query.set('category', params.category);
        const qs = query.toString();
        return request(`/api/admin/products${qs ? `?${qs}` : ''}`, { authenticated: true });
      },
      create: (product) => request('/api/admin/products', { method: 'POST', body: product, authenticated: true }),
      update: (id, product) => request(`/api/admin/products/${id}`, { method: 'PUT', body: product, authenticated: true }),
      delete: (id) => request(`/api/admin/products/${id}`, { method: 'DELETE', authenticated: true }),
      upload: (formData: FormData) => {
        return request('/api/admin/products/upload', { method: 'POST', body: formData, authenticated: true });
      },
    },
    users: {
      list: (params) => {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.search) query.set('search', params.search);
        const qs = query.toString();
        return request(`/api/admin/users${qs ? `?${qs}` : ''}`, { authenticated: true });
      },
      updateRole: (userId, role) => request(`/api/admin/users/${userId}/role`, { method: 'PUT', body: { role }, authenticated: true }),
    },
  },
};
