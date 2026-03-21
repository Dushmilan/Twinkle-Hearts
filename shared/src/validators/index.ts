// Shared validators for Twinkle-Hearts

import { z } from 'zod';

// Phone number validator (Indian format)
export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^[\d\s+\-()]+$/, 'Invalid phone number format');

// Email validator
export const emailSchema = z.string().email('Invalid email address');

// Name validator
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters');

// Price validator
export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .max(999999.99, 'Price is too high');

// Quantity validator
export const quantitySchema = z
  .number()
  .int('Quantity must be a whole number')
  .positive('Quantity must be positive')
  .max(999, 'Quantity is too high');

// UUID validator
export const uuidSchema = z.string().uuid('Invalid ID format');

// Cart item validator
export const cartItemSchema = z.object({
  productId: uuidSchema,
  quantity: quantitySchema,
  price: priceSchema.optional(),
});

// Order creation validator
export const orderCreationSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  customerName: nameSchema,
  customerPhone: phoneSchema,
});

// Utility functions
export function validatePhoneNumber(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePrice(price: number): boolean {
  return priceSchema.safeParse(price).success;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '');
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
