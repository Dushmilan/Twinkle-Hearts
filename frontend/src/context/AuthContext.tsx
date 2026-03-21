import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore, authAPI, User } from '../store/authStore';
import toastService from '../utils/toast';

interface AuthContextType {
  user: User | null;
  tokens: { accessToken: string; refreshToken: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    updateUser: storeUpdateUser,
    setTokens,
    clearUser,
  } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (tokens?.refreshToken) {
        try {
          const newTokens = await authAPI.refreshToken(tokens.refreshToken);
          setTokens(newTokens);
          const currentUser = await authAPI.getCurrentUser(newTokens.accessToken);
          storeLogin(newTokens, currentUser);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          clearUser();
        }
      } else {
        clearUser();
      }
    };

    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const loadingToast = toastService.loading('Signing in...');
    try {
      const result = await authAPI.login(email, password);
      storeLogin(result, result.user);
      toastService.dismiss(loadingToast);
      toastService.success('Welcome back!');
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    const loadingToast = toastService.loading('Creating account...');
    try {
      const result = await authAPI.register(email, password, name, phone);
      storeLogin(result, result.user);
      toastService.dismiss(loadingToast);
      toastService.success('Account created successfully!');
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    if (tokens?.accessToken) {
      await authAPI.logout(tokens.accessToken);
    }
    storeLogout();
    toastService.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    storeUpdateUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
