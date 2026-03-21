/**
 * Test Constants
 * Centralized constants for test data to avoid hard-coded values
 */

/**
 * Password constants
 */
export const TEST_PASSWORD = 'SecurePass123!' as const;
export const TEST_PASSWORD_WEAK = '123' as const;
export const TEST_PASSWORD_ALT = 'DifferentPass456!' as const;

/**
 * Email constants
 */
export const TEST_EMAIL = 'test@example.com' as const;
export const TEST_EMAIL_ALT = 'alternate@example.com' as const;
export const TEST_EMAIL_DUPLICATE = 'duplicate@example.com' as const;
export const TEST_EMAIL_INVALID = 'invalid-email' as const;

/**
 * User constants
 */
export const TEST_USER_NAME = 'Test User' as const;
export const TEST_USER_NAME_ALT = 'Second User' as const;
export const TEST_USER_PHONE = '+919876543210' as const;
export const TEST_USER_ROLE = 'CUSTOMER' as const;
export const TEST_USER_ROLE_ADMIN = 'ADMIN' as const;

/**
 * Product constants
 */
export const TEST_PRODUCT_NAME = 'Test Product' as const;
export const TEST_PRODUCT_DESCRIPTION = 'Test product description' as const;
export const TEST_PRODUCT_PRICE = 1999 as const;
export const TEST_PRODUCT_STOCK = 50 as const;
export const TEST_PRODUCT_CATEGORY = 'Test' as const;

/**
 * Order constants
 */
export const TEST_ORDER_CUSTOMER_NAME = 'Test Customer' as const;
export const TEST_ORDER_QUANTITY_DEFAULT = 2 as const;

/**
 * Session constants
 */
export const TEST_SESSION_EXPIRY_DAYS = 7 as const;

/**
 * API response constants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

/**
 * Error message constants
 */
export const ERROR_MESSAGES = {
  WEAK_PASSWORD: 'Password must be at least 8 characters',
  INVALID_EMAIL: 'Invalid email format',
  DUPLICATE_EMAIL: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INACTIVE_USER: 'User account is inactive',
  MISSING_TOKEN: 'Refresh token is required',
  INVALID_TOKEN: 'Invalid refresh token',
} as const;
