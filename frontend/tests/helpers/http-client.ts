/**
 * Test HttpClient
 * In-memory mock implementation for frontend API tests.
 * Designed for the future HttpClient interface extraction (Phase 4, Candidate 6).
 *
 * Usage:
 * ```ts
 * const http = new TestHttpClient();
 * http.mock('/api/products', { products: [] });
 * const result = await http.get('/api/products');
 * ```
 */

export interface MockResponse {
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
}

export class TestHttpClient {
  private mocks = new Map<string, MockResponse>();
  private requests: Array<{ method: string; url: string; body?: unknown; headers: Record<string, string> }> = [];
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
  }

  mock(url: string, response: MockResponse): void {
    this.mocks.set(url, response);
  }

  mockOnce(url: string, response: MockResponse): void {
    this.mocks.set(url, response);
  }

  getRequests(): Array<{ method: string; url: string; body?: unknown; headers: Record<string, string> }> {
    return [...this.requests];
  }

  clear(): void {
    this.mocks.clear();
    this.requests = [];
    this.token = null;
  }

  async request<T>(method: string, url: string, options?: { body?: unknown; authenticated?: boolean }): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (options?.authenticated && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    this.requests.push({ method, url, body: options?.body, headers });

    const mock = this.mocks.get(url);
    if (!mock) {
      throw new Error(`No mock configured for ${method} ${url}`);
    }

    const status = mock.status ?? 200;
    if (status >= 400) {
      const err = new Error('TestHttpClient: request failed') as any;
      err.status = status;
      err.body = mock.body;
      throw err;
    }

    return mock.body as T;
  }

  get<T>(url: string): Promise<T> {
    return this.request<T>('GET', url);
  }

  post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', url, { body });
  }

  put<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', url, { body });
  }

  delete<T>(url: string): Promise<T> {
    return this.request<T>('DELETE', url);
  }
}

export const testHttp = new TestHttpClient();
