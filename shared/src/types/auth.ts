export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  role: string;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  sessionId: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
    avatar: string | null;
  };
}
