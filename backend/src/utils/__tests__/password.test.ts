import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
  default: { hash: vi.fn(), compare: vi.fn() },
}));

import bcrypt from 'bcryptjs';
import { hashPassword, comparePassword, validatePasswordStrength, generateRandomPassword } from '../password.js';

describe('password utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-value' as never);

      const result = await hashPassword('MyPass123!');

      expect(bcrypt.hash).toHaveBeenCalledWith('MyPass123!', 12);
      expect(result).toBe('hashed-value');
    });
  });

  describe('comparePassword', () => {
    it('should compare password with hash', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await comparePassword('MyPass123!', 'hashed-value');

      expect(bcrypt.compare).toHaveBeenCalledWith('MyPass123!', 'hashed-value');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await comparePassword('WrongPass', 'hashed-value');

      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return valid for strong password', () => {
      const result = validatePasswordStrength('StrongP@ss1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = validatePasswordStrength('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('weakpass1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('WEAKPASS1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('WeakPass!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('WeakPass1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for very weak password', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password of specified length', () => {
      const password = generateRandomPassword(16);
      expect(password.length).toBe(16);
    });

    it('should generate password with default length 12', () => {
      const password = generateRandomPassword();
      expect(password.length).toBe(12);
    });

    it('should generate different passwords each time', () => {
      const p1 = generateRandomPassword(16);
      const p2 = generateRandomPassword(16);
      expect(p1).not.toBe(p2);
    });
  });
});
