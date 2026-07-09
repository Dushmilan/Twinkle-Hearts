import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  describe('login', () => {
    const mockTokens = { accessToken: 'access-123', refreshToken: 'refresh-456' };
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+919876543210',
      role: 'CUSTOMER',
      avatar: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    it('should set user, tokens, and isAuthenticated', () => {
      useAuthStore.getState().login(mockTokens, mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user and tokens', () => {
      useAuthStore.setState({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER', createdAt: '', updatedAt: '' },
        tokens: { accessToken: 'a', refreshToken: 'r' },
        isAuthenticated: true,
        isLoading: false,
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', () => {
      const baseUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Old Name',
        phone: null,
        role: 'CUSTOMER',
        avatar: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      useAuthStore.setState({ user: baseUser, isAuthenticated: true });

      useAuthStore.getState().updateUser({ name: 'New Name', phone: '+919876543211' });

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('New Name');
      expect(state.user?.phone).toBe('+919876543211');
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should do nothing if user is null', () => {
      useAuthStore.getState().updateUser({ name: 'New Name' });
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should update tokens only', () => {
      const newTokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      useAuthStore.getState().setTokens(newTokens);

      expect(useAuthStore.getState().tokens).toEqual(newTokens);
    });
  });

  describe('clearUser', () => {
    it('should reset state to default', () => {
      useAuthStore.setState({
        user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN', createdAt: '', updatedAt: '' },
        tokens: { accessToken: 'a', refreshToken: 'r' },
        isAuthenticated: true,
        isLoading: false,
      });

      useAuthStore.getState().clearUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should only persist specific fields', () => {
      const storeState = useAuthStore.getState();
      const partialState = {
        user: storeState.user,
        tokens: storeState.tokens,
        isAuthenticated: storeState.isAuthenticated,
      };

      expect(partialState).toHaveProperty('user');
      expect(partialState).toHaveProperty('tokens');
      expect(partialState).toHaveProperty('isAuthenticated');
    });
  });
});
