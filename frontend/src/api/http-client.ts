const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  authenticated?: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

let tokenGetter: (() => string | null | undefined) | null = null;

export function setTokenGetter(getter: (() => string | null | undefined) | null) {
  tokenGetter = getter;
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.details = error.details;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, authenticated = false } = options;

  const url = `${API_BASE_URL}${path}`;

  const requestHeaders: Record<string, string> = {};

  if (body instanceof FormData) {
    // Don't set Content-Type for FormData — browser sets multipart boundary
    Object.assign(requestHeaders, headers);
  } else {
    requestHeaders['Content-Type'] = 'application/json';
    Object.assign(requestHeaders, headers);
  }

  if (authenticated && tokenGetter) {
    const token = tokenGetter();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body instanceof FormData) {
    config.body = body;
  } else if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError({
      status: response.status,
      message: (errorData?.error as string) || (errorData?.message as string) || `Request failed with status ${response.status}`,
      details: errorData,
    });
  }

  return response.json() as Promise<T>;
}
