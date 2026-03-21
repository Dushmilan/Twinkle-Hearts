/**
 * API Client Helper
 * Wrapper for supertest with authentication support
 */

import request, { SuperTest, Test } from 'supertest';
import { Express } from 'express';
import { createTestApp } from './testApp.js';

export class ApiClient {
  private app: Express;
  private request: SuperTest<Test>;
  private headers: Record<string, string> = {};

  constructor(app?: Express) {
    this.app = app || createTestApp();
    this.request = request(this.app);
  }

  /**
   * Set authentication token for subsequent requests
   */
  setAuth(token: string): this {
    this.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  /**
   * Clear authentication headers
   */
  clearAuth(): this {
    delete this.headers['Authorization'];
    return this;
  }

  /**
   * Add custom header
   */
  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  /**
   * GET request
   */
  get(path: string) {
    return this.request.get(path).set(this.headers);
  }

  /**
   * POST request
   */
  post(path: string, data?: any) {
    const req = this.request.post(path).set(this.headers);
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * PUT request
   */
  put(path: string, data?: any) {
    const req = this.request.put(path).set(this.headers);
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * PATCH request
   */
  patch(path: string, data?: any) {
    const req = this.request.patch(path).set(this.headers);
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * DELETE request
   */
  delete(path: string) {
    return this.request.delete(path).set(this.headers);
  }

  /**
   * Get the underlying Express app
   */
  getApp(): Express {
    return this.app;
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(app?: Express): ApiClient {
  return new ApiClient(app);
}

export default ApiClient;
