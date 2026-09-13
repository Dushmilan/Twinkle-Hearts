import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductDetailPage from '../ProductDetailPage';
import { api } from '../../../api';

vi.mock('../../../api', () => ({
  api: {
    products: {
      get: vi.fn(),
      list: vi.fn(),
    },
  },
}));

vi.mock('../../../components/UI/ProductCard', () => ({
  default: () => <div data-testid="related-card" />,
}));

vi.mock('../../../store/cartStore', () => ({
  useCartStore: (selector: (s: { addItem: unknown }) => unknown) =>
    selector({ addItem: vi.fn() }),
}));

const mockGet = api.products.get as ReturnType<typeof vi.fn>;
const mockList = api.products.list as ReturnType<typeof vi.fn>;

const baseProduct = {
  id: 'r1',
  name: 'Lotus Diwali Rangoli',
  description: 'Large doorstep lotus drawn at your home',
  price: 4500,
  images: ['lotus.jpg'],
  isActive: true,
  createdAt: '2026-09-01',
  updatedAt: '2026-09-02',
};

function renderDetail() {
  render(
    <MemoryRouter initialEntries={['/product/r1']}>
      <Routes>
        <Route path="/product/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProductDetailPage rangoli service layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ products: [] });
  });

  it('shows Book CTA instead of Add to Cart for rangoli designs', async () => {
    mockGet.mockResolvedValue({ product: { ...baseProduct, productType: 'service' } });
    renderDetail();

    expect(await screen.findByRole('button', { name: /book this design/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
  });

  it('hides the quantity stepper for rangoli designs', async () => {
    mockGet.mockResolvedValue({ product: { ...baseProduct, productType: 'service' } });
    renderDetail();

    await screen.findByRole('button', { name: /book this design/i });
    expect(screen.queryByLabelText(/increase quantity/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/decrease quantity/i)).not.toBeInTheDocument();
  });

  it('shows artist-visit copy for rangoli designs', async () => {
    mockGet.mockResolvedValue({ product: { ...baseProduct, productType: 'service' } });
    renderDetail();

    expect(await screen.findByText(/arranged over WhatsApp after booking/i)).toBeInTheDocument();
    expect(screen.getByText(/our artist draws it at your home/i)).toBeInTheDocument();
  });

  it('keeps Add to Cart and stepper for greeting cards', async () => {
    mockGet.mockResolvedValue({ product: { ...baseProduct, productType: 'card' } });
    renderDetail();

    expect(await screen.findByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/increase quantity/i)).toBeInTheDocument();
  });
});
