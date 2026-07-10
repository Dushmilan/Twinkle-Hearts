export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  NODE_ENV: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  TAX_RATE: string;
  CORS_ORIGIN: string;
  JWT_PRIVATE_KEY: string;
  JWT_PUBLIC_KEY: string;
  GOOGLE_CLIENT_ID: string;
  WHATSAPP_BUSINESS_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_BUSINESS_NUMBER: string;
  RESEND_API_KEY: string;
  LOG_LEVEL: string;
  [key: string]: unknown;
}

export interface UserJWT {
  sub: string;
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  [key: string]: unknown;
}

export interface UserInfo {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface ValidatedCartItem {
  productId: string;
  quantity: number;
  currentPrice: number;
  frontendPrice?: number;
  productName: string;
  stockAvailable: number;
}

export type Variables = {
  user: UserInfo;
  validatedItems: ValidatedCartItem[];
  customerName: string;
  customerPhone: string;
  requestId: string;
};
