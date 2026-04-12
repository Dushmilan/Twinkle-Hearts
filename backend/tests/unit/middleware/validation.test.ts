/**
 * Unit Tests for Validation Middleware
 * Tests input validation and database verification logic
 */

import { Request, Response, NextFunction } from 'express';
import { validateOrder, validateCartSync, orderCreationSchema } from '../../../src/middleware/validation.js';
import { BadRequestError, StockUnavailableError } from '../../../src/middleware/errorHandler.js';
import { createProduct } from '../../helpers/factories.js';

// Helper to create mock request
function createMockRequest(body: any, headers: any = {}) {
  return {
    body,
    headers,
  } as Request;
}

// Helper to create mock response
function createMockResponse() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Helper to create mock next function
function createMockNext() {
  return jest.fn() as NextFunction;
}

describe('Validation Middleware', () => {
  describe('orderCreationSchema', () => {
    it('should validate correct order input', () => {
      const input = {
        items: [
          { productId: '123', quantity: 2, price: 1999 },
        ],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      expect(() => orderCreationSchema.parse(input)).not.toThrow();
    });

    it('should reject empty items array', () => {
      const input = {
        items: [],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      expect(() => orderCreationSchema.parse(input)).toThrow();
    });

    it('should reject missing customer name', () => {
      const input = {
        items: [{ productId: '123', quantity: 2 }],
        customerPhone: '+919876543210',
      };

      expect(() => orderCreationSchema.parse(input)).toThrow();
    });

    it('should reject short customer name', () => {
      const input = {
        items: [{ productId: '123', quantity: 2 }],
        customerName: 'J',
        customerPhone: '+919876543210',
      };

      expect(() => orderCreationSchema.parse(input)).toThrow();
    });

    it('should reject missing phone number', () => {
      const input = {
        items: [{ productId: '123', quantity: 2 }],
        customerName: 'John Doe',
      };

      expect(() => orderCreationSchema.parse(input)).toThrow();
    });

    it('should reject invalid quantity (zero)', () => {
      const input = {
        items: [{ productId: '123', quantity: 0 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      expect(() => orderCreationSchema.parse(input)).toThrow();
    });

    it('should reject invalid quantity (negative)', () => {
      const input = {
        items: [{ productId: '123', quantity: -1 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      expect(() => orderCreationSchema.parse(input)).toThrow();
    });
  });

  describe('validateOrder', () => {
    it('should validate order and attach validatedItems to request', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-VAL-001' });
      const req = createMockRequest({
        items: [{ productId: product.id, quantity: 2, price: 1999 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateOrder(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(req.body.validatedItems).toHaveLength(1);
      expect(req.body.validatedItems[0].productId).toBe(product.id);
      expect(req.body.validatedItems[0].currentPrice).toBe(Number(product.price));
      expect(req.body.validatedItems[0].productName).toBe(product.name);
    });

    it('should reject order with non-existent product', async () => {
      // Arrange
      const req = createMockRequest({
        items: [{ productId: 'non-existent-id', quantity: 2 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateOrder(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject order when stock is insufficient', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-VAL-002', stock: 5 });
      const req = createMockRequest({
        items: [{ productId: product.id, quantity: 10 }], // More than stock
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateOrder(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(StockUnavailableError));
    });

    it('should handle multiple products in order', async () => {
      // Arrange
      const product1 = await createProduct({ sku: 'TEST-VAL-003' });
      const product2 = await createProduct({ sku: 'TEST-VAL-004' });
      const req = createMockRequest({
        items: [
          { productId: product1.id, quantity: 1, price: Number(product1.price) },
          { productId: product2.id, quantity: 2, price: Number(product2.price) },
        ],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateOrder(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(req.body.validatedItems).toHaveLength(2);
    });

    it('should reject order with inactive product', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-VAL-005', isActive: false });
      const req = createMockRequest({
        items: [{ productId: product.id, quantity: 2 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateOrder(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should use database price, not frontend price', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-VAL-006', price: 2999 });
      const req = createMockRequest({
        items: [{ productId: product.id, quantity: 1, price: 1999 }], // Frontend says 1999
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateOrder(req, res, next);

      // Assert
      expect(req.body.validatedItems[0].currentPrice).toBe(2999); // DB price
      expect(req.body.validatedItems[0].frontendPrice).toBe(1999); // For audit
    });
  });

  describe('validateCartSync', () => {
    it('should validate cart and return current prices', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-SYNC-001' });
      const req = createMockRequest({
        items: [{ productId: product.id, quantity: 2 }],
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateCartSync(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(req.body.validatedItems).toHaveLength(1);
      expect(req.body.validatedItems[0].currentPrice).toBe(Number(product.price));
      expect(req.body.validatedItems[0].inStock).toBe(true);
    });

    it('should reject empty cart', async () => {
      // Arrange
      const req = createMockRequest({ items: [] });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateCartSync(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should mark item as out of stock when quantity exceeds stock', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-SYNC-002', stock: 3 });
      const req = createMockRequest({
        items: [{ productId: product.id, quantity: 10 }],
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateCartSync(req, res, next);

      // Assert
      expect(req.body.validatedItems[0].inStock).toBe(false);
    });

    it('should handle non-existent products in cart', async () => {
      // Arrange
      const req = createMockRequest({
        items: [{ productId: 'non-existent', quantity: 1 }],
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateCartSync(req, res, next);

      // Assert
      expect(req.body.validatedItems[0].currentPrice).toBe(0);
      expect(req.body.validatedItems[0].inStock).toBe(false);
    });

    it('should handle multiple cart items', async () => {
      // Arrange
      const product1 = await createProduct({ sku: 'TEST-SYNC-003' });
      const product2 = await createProduct({ sku: 'TEST-SYNC-004' });
      const req = createMockRequest({
        items: [
          { productId: product1.id, quantity: 1 },
          { productId: product2.id, quantity: 2 },
        ],
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await validateCartSync(req, res, next);

      // Assert
      expect(req.body.validatedItems).toHaveLength(2);
      expect(req.body.validatedItems[0].currentPrice).toBe(Number(product1.price));
      expect(req.body.validatedItems[1].currentPrice).toBe(Number(product2.price));
    });
  });
});
