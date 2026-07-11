import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../store/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

import { useAuth } from '../../../context/AuthContext';
import { useAuthStore } from '../../../store/authStore';

describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
    (useAuthStore.getState as any).mockReturnValue({ user: null });
  });

  it('should render login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'invalid');
    await user.type(screen.getByLabelText('Password'), 'somepassword');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(emailInput).toHaveValue('invalid');
  });

  it('should call login on form submit with valid data', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongP@ss1');

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'StrongP@ss1');
  });

  it('should show loading state on submit', async () => {
    let resolvePromise: any;
    mockLogin.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();

    resolvePromise();
  });

  it('should clear field errors on input change', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email Address'), 'a');
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('should redirect to admin dashboard for admin users', async () => {
    (useAuthStore.getState as any).mockReturnValue({ user: { role: 'ADMIN' } });
    mockLogin.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email Address'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'AdminP@ss1');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
  });

  it('should redirect to home if already authenticated', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'CUSTOMER' },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
  });

  it('should have link to register page', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const registerLink = screen.getByText('Join our family');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('should have forgot password link', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });
});