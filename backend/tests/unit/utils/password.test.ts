/**
 * Unit Tests for Password Utilities
 * Tests hashing, comparison, and validation
 */

import { hashPassword, comparePassword, validatePasswordStrength, generateRandomPassword } from '../../../src/utils/password.js';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const hash = await hashPassword('SecurePass123!');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('SecurePass123!');
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    it('should produce different hashes for same password', async () => {
      const hash1 = await hashPassword('SecurePass123!');
      const hash2 = await hashPassword('SecurePass123!');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(100) + '!A1';
      const hash = await hashPassword(longPassword);
      expect(hash).toBeDefined();
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
      const hash = await hashPassword(specialPassword);
      expect(hash).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hash = await hashPassword('SecurePass123!');
      const isValid = await comparePassword('WrongPassword!', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const isValid = await comparePassword('password', 'invalid-hash');
      expect(isValid).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const hash = await hashPassword('SecurePass123!');
      const isValid = await comparePassword('securepass123!', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = validatePasswordStrength('SecurePass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('securepass123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('SECUREPASS123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('SecurePassword!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('SecurePass123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accumulate multiple errors', () => {
      const result = validatePasswordStrength('abc');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3); // length, uppercase, number, special
    });

    it('should accept password with minimum requirements met', () => {
      const result = validatePasswordStrength('Abcdefg1!');
      expect(result.valid).toBe(true);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate a password of specified length', () => {
      const password = generateRandomPassword(16);
      expect(password).toHaveLength(16);
    });

    it('should generate a password with default length of 12', () => {
      const password = generateRandomPassword();
      expect(password).toHaveLength(12);
    });

    it('should contain at least one uppercase letter', () => {
      const password = generateRandomPassword();
      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it('should contain at least one lowercase letter', () => {
      const password = generateRandomPassword();
      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('should contain at least one number', () => {
      const password = generateRandomPassword();
      expect(/[0-9]/.test(password)).toBe(true);
    });

    it('should contain at least one special character', () => {
      const password = generateRandomPassword();
      expect(/[!@#$%^&*()_+]/.test(password)).toBe(true);
    });

    it('should generate different passwords on each call', () => {
      const password1 = generateRandomPassword();
      const password2 = generateRandomPassword();
      // Very unlikely to be the same
      expect(password1).not.toBe(password2);
    });

    it('should pass password strength validation', () => {
      const password = generateRandomPassword();
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(true);
    });
  });
});
