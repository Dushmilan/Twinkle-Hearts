import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RangoliPage from '../RangoliPage';
import { api } from '../../../api';

const mockAddItem = vi.hoisted(() => vi.fn());

vi.mock('../../../api', () => ({
  api: {
    products: {
      list: vi.fn(),
    },
  },
}));

vi.mock('../../../components/UI/ProductCard', () => ({
  default: ({ product }: { product: { id: string; name: string } }) => (
    <div data-testid={`product-${product.id}`}>{product.name}</div>
  ),
}));

vi.mock('../../../store/cartStore', () => ({
  useCartStore: (selector: (s: { addItem: unknown }) => unknown) =>
    selector({ addItem: mockAddItem }),
}));

const mockList = api.products.list as ReturnType<typeof vi.fn>;

const rangoliDesign = {
  id: 'r1',
  name: 'Lotus Diwali Rangoli',
  description: 'Large doorstep lotus',
  price: 4500,
  stock: 10,
  category: 'rangoli',
  images: ['lotus.jpg'],
};

function resolveDesigns() {
  mockList.mockResolvedValue({
    products: [rangoliDesign],
    pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
  });
}

describe('RangoliPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ products: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } });
  });

  it('fetches products filtered by rangoli category', async () => {
    render(
      <MemoryRouter>
        <RangoliPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'rangoli' })
      );
    });
  });

  it('renders dedicated hero heading', async () => {
    render(
      <MemoryRouter>
        <RangoliPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /rangoli/i })).toBeInTheDocument();
  });

  it('shows empty state when no rangoli products exist', async () => {
    render(
      <MemoryRouter>
        <RangoliPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/no rangoli designs yet/i)).toBeInTheDocument();
  });

  it('renders how-it-works steps', async () => {
    render(
      <MemoryRouter>
        <RangoliPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/pick your design/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /book in one tap/i })).toBeInTheDocument();
    expect(screen.getByText(/artist arrives and draws/i)).toBeInTheDocument();
  });

  it('renders occasion pills as static text, not links', async () => {
    render(
      <MemoryRouter>
        <RangoliPage />
      </MemoryRouter>
    );

    for (const occasion of ['Diwali', 'Weddings', 'Pooja', 'Housewarmings']) {
      const pill = await screen.findByText(occasion);
      expect(pill.closest('a')).toBeNull();
    }
  });

  it('uses no em-dashes in page copy', async () => {
    render(
      <MemoryRouter>
        <RangoliPage />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: /rangoli collection/i });
    expect(document.body.textContent).not.toContain('—');
    expect(document.body.textContent).not.toContain('–');
  });

  it('books a design with quantity 1 via Book button', async () => {
    resolveDesigns();
    render(
      <MemoryRouter>
        <RangoliPage />
      </MemoryRouter>
    );

    const bookButton = await screen.findByRole('button', { name: /book this design/i });
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'r1',
        productName: 'Lotus Diwali Rangoli',
        quantity: 1,
        price: 4500,
        image: 'lotus.jpg',
      });
    });
  });
});
