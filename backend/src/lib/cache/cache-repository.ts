export interface SessionData {
  userId: string;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CacheRepository {
  getSession(sessionId: string): Promise<SessionData | null>;
  setSession(sessionId: string, data: SessionData, ttl?: number): Promise<void>;
  invalidateSession(sessionId: string): Promise<void>;

  getUserOrders(userId: string): Promise<PaginatedData<any> | null>;
  setUserOrders(userId: string, data: PaginatedData<any>, ttl?: number): Promise<void>;
  invalidateUserOrders(userId: string): Promise<void>;

  getProductCatalog(key: string): Promise<any | null>;
  setProductCatalog(key: string, data: any, ttl?: number): Promise<void>;
  invalidateProducts(): Promise<void>;

  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;

  checkRateLimit(identifier: string, max: number, ttlSeconds: number): Promise<boolean>;
}
