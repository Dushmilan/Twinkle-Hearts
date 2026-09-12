import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';
import ProductCard from '../../components/UI/ProductCard';
import type { ProductListItem as Product } from '@twinkle-hearts/shared';

export const RANGOLI_CATEGORY = 'rangoli';

const STEPS = [
  { n: '1', title: 'Pick your design', text: 'Browse the gallery and choose the one you love.' },
  { n: '2', title: 'Book in one tap', text: 'Check out — it takes less than a minute.' },
  { n: '3', title: 'Artist arrives and draws', text: 'We call to fix a time, then draw it at your home.' },
];

const OCCASIONS = ['Diwali', 'Weddings', 'Pooja', 'Housewarmings'];

export default function RangoliPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function fetchRangoli() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.products.list({ limit: 100, category: RANGOLI_CATEGORY });
        if (!cancelled) setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRangoli();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBook = useCallback(
    async (product: Product) => {
      await addItem({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        image: product.images[0],
      });
      navigate('/cart');
    },
    [addItem, navigate]
  );

  return (
    <div className="bg-twinkle-canvas min-h-screen">
      <section className="bg-gradient-to-br from-white via-twinkle-canvas to-twinkle-sage/20 border-b border-twinkle-mist/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <span className="section-eyebrow mb-3 inline-flex">🪔 Festival special</span>
          <h1 className="section-heading mt-2">Rangoli Collection</h1>
          <p className="section-subheading mt-2 mx-auto">
            Pick a design, book in one tap — our artist draws it at your home.
          </p>
          <a href="#rangoli-gallery" className="btn-primary mt-6">
            Browse designs
          </a>
        </div>
      </section>

      <section id="rangoli-gallery" aria-label="Rangoli designs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink">
              Designs
            </h2>
            {!loading && !error && products.length > 0 && (
              <p className="text-twinkle-ink/60 text-sm">
                {products.length} design{products.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton-card-image" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton-card-line" />
                    <div className="skeleton-card-line-short" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-twinkle-ink/60 mb-4">{error}</p>
              <Link to="/shop" className="btn-primary">
                Browse All Cards
              </Link>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h3 className="empty-state-title">No Rangoli cards yet</h3>
              <p className="empty-state-text">
                We are adding festive Rangoli designs. Check back soon or browse our full collection.
              </p>
              <Link to="/shop" className="btn-primary text-sm mt-6">
                Browse All Cards
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-2">
                  <ProductCard product={product} onAddToCart={handleBook} />
                  <button onClick={() => handleBook(product)} className="btn-primary w-full text-sm">
                    Book this design
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-label="How it works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink mb-6">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <div key={step.n} className="card p-6">
                <div className="w-9 h-9 rounded-full bg-twinkle-ink text-white flex items-center justify-center font-display font-bold mb-3">
                  {step.n}
                </div>
                <h3 className="font-semibold text-sm text-twinkle-ink">{step.title}</h3>
                <p className="text-sm text-twinkle-ink/50 mt-1">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Occasions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink mb-6">
            Made for your occasion
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {OCCASIONS.map((occasion) => (
              <a
                key={occasion}
                href="#rangoli-gallery"
                className="card p-5 text-center font-semibold text-sm text-twinkle-ink/70 hover:text-twinkle-rose hover:shadow-lg transition-all"
              >
                {occasion}
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
