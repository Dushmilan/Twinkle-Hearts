import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api', () => ({
  api: {
    admin: {
      products: {
        list: vi.fn(),
      },
    },
  },
}));

vi.mock('../utils/toast', () => ({
  default: { error: vi.fn(), success: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/images', () => ({
  getImageSrc: vi.fn((url: string) => url ? `__RESOLVED__${url}` : ''),
}));

import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { getImageSrc } from '../utils/images';
import AdminProductsPage from '../pages/Admin/ProductsPage';

describe('AdminProductsPage image rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { role: 'ADMIN' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('should use getImageSrc() for product images', async () => {
    const relativeImagePath = '/images/products/abc-123.jpg';
    (api.admin.products.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        products: [
          {
            id: '1',
            name: 'Test Card',
            description: 'A card',
            price: 500,
            stock: 10,
            category: 'Birthday',
            images: [relativeImagePath],
            isActive: true,
            createdAt: '2026-01-01',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getImageSrc).toHaveBeenCalled();
    });

    const img = screen.getByAltText('Test Card');
    expect(img.getAttribute('src')).toContain('__RESOLVED__');
  });

  it('should render absolute image URLs unchanged via getImageSrc', async () => {
    const absoluteUrl = 'https://picsum.photos/seed/test/200/200';
    (api.admin.products.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        products: [
          {
            id: '2',
            name: 'Seed Card',
            description: 'Another card',
            price: 750,
            stock: 5,
            category: 'Birthday',
            images: [absoluteUrl],
            isActive: true,
            createdAt: '2026-01-01',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getImageSrc).toHaveBeenCalled();
    });

    const img = screen.getByAltText('Seed Card');
    expect(img.getAttribute('src')).toContain('__RESOLVED__');
  });
});
