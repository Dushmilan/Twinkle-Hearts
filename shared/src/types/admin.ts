export interface AdminStats {
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

export interface AdminOrdersResponse {
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

export interface AdminProductsResponse {
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

export interface AdminUsersResponse {
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

export interface AdminOrderDetailResponse {
  success: boolean;
  data: {
    id: string;
    customerName: string;
    customerPhone: string;
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    priceSnapshot: string;
    createdAt: string;
    updatedAt: string;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    user: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
    };
  };
}

export interface UploadResponse {
  success: boolean;
  data: {
    urls: string[];
    count: number;
  };
}

export interface UserOrdersResponse {
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
