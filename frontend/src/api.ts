const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  authenticated?: boolean;
}

interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

let tokenGetter: (() => string | null | undefined) | null = null;

export function setTokenGetter(getter: () => string | null | undefined) {
  tokenGetter = getter;
}

class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.details = error.details;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, authenticated = false } = options;

  const url = `${API_BASE_URL}${path}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (authenticated && tokenGetter) {
    const token = tokenGetter();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError({
      status: response.status,
      message: (errorData?.error as string) || (errorData?.message as string) || `Request failed with status ${response.status}`,
      details: errorData,
    });
  }

  return response.json() as Promise<T>;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

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

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
  };
  sessionId: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
    avatar: string | null;
  };
}

interface ProductListItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category?: string;
  images: string[];
  createdAt: string;
}

interface ProductsResponse {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  images: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface ProductDetailResponse {
  product: ProductDetail;
}

interface CreateOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  customerName: string;
  customerPhone: string;
}

interface CreateOrderResponse {
  orderId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  whatsappDeepLink: string;
  createdAt: string;
}

interface CartSyncInput {
  items: Array<{
    productId: string;
    quantity: number;
    price?: number;
  }>;
}

interface CartSyncResponse {
  items: Array<{
    productId: string;
    quantity: number;
    currentPrice: number;
    inStock: boolean;
    productName?: string;
    stockAvailable?: number;
  }>;
  syncedAt: string;
}

interface Address {
  id: string;
  label: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    sku: string;
    category: string;
    description: string;
  };
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

interface OrderResponse {
  order: OrderSummary;
}

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: Array<{
    id: string;
    total: number;
    user: { name: string; email: string };
    createdAt: string;
  }>;
}

interface AdminOrdersResponse {
  data: {
    orders: Array<{
      id: string;
      total: number;
      items: Array<unknown>;
      user: { name: string; email: string };
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface AdminProductsResponse {
  data: {
    products: Array<{
      id: string;
      name: string;
      price: number;
      stock: number;
      category: string;
      isActive: boolean;
      images: string[];
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface AdminUsersResponse {
  data: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface UploadResponse {
  success: boolean;
  data: {
    urls: string[];
    count: number;
  };
}

interface UserOrdersResponse {
  success: boolean;
  data: {
    orders: Array<{
      id: string;
      total: number;
      customerName: string;
      status: string;
      items: Array<unknown>;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

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
    orders: (page?: number, limit?: number) => Promise<AdminOrdersResponse>;
    products: {
      list: (params?: { page?: number; limit?: number; search?: string; category?: string }) => Promise<AdminProductsResponse>;
      create: (product: {
        name: string;
        description: string;
        price: number;
        stock: number;
        sku: string;
        category: string;
        images: string[];
        isActive?: boolean;
      }) => Promise<{ success: boolean; data: unknown }>;
      update: (id: string, product: Partial<{
        name: string;
        description: string;
        price: number;
        stock: number;
        sku: string;
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
    orders: (page = 1, limit = 20) => request(`/api/admin/orders?page=${page}&limit=${limit}`, { authenticated: true }),
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
        const token = tokenGetter?.();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(`${API_BASE_URL}/api/admin/products/upload`, {
          method: 'POST',
          headers,
          body: formData,
        }).then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new ApiClientError({
              status: res.status,
              message: err.error || 'Upload failed',
              details: err,
            });
          }
          return res.json() as Promise<UploadResponse>;
        });
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

export { ApiClientError };
export type { ApiError, RequestOptions };
