export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
}

export interface ProductsResponse {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductDetailResponse {
  product: Product;
}
