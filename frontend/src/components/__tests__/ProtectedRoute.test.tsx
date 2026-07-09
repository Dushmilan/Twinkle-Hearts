import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from '../ProtectedRoute';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../context/AuthContext';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('should render children when authenticated', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <div>Protected</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    const loadingContainer = container.querySelector('.min-h-screen');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('should preserve location state on redirect', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page" />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <div>Protected</div>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { role: 'ADMIN' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('should render children when user is admin', () => {
    render(
      <MemoryRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });

  it('should redirect to home when user is not admin', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { role: 'CUSTOMER' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
          <Route path="/admin" element={
            <AdminRoute>
              <div>Admin Content</div>
            </AdminRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page" />} />
          <Route path="/admin" element={
            <AdminRoute>
              <div>Admin Content</div>
            </AdminRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});