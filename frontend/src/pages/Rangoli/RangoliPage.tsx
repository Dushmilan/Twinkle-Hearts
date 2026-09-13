import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';
import ProductCard from '../../components/UI/ProductCard';
import type { ProductListItem as Product } from '@twinkle-hearts/shared';

export const RANGOLI_PRODUCT_TYPE = 'service';

const STEPS = [
  { title: 'Pick your design', text: 'Browse the gallery and choose the one you love.' },
  { title: 'Book in one tap', text: 'Check out. It takes less than a minute.' },
  { title: 'Artist arrives and draws', text: 'We call to fix a time, then draw it at your home.' },
];

const OCCASIONS = ['Diwali', 'Weddings', 'Pooja', 'Housewarmings'];

// Simple geometric pulli-kolam mark: dot grid with symmetric petal loops.
// Decorative only, hidden from assistive tech.
function KolamMark() {
  const dots: { x: number; y: number }[] = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      dots.push({ x: 30 + col * 35, y: 30 + row * 35 });
    }
  }

  return (
    <svg viewBox="0 0 200 200" role="img" aria-hidden="true" className="w-full h-auto">
      <rect x="8" y="8" width="184" height="184" rx="24" className="fill-white" />
      <rect
        x="8"
        y="8"
        width="184"
        height="184"
        rx="24"
        className="fill-none stroke-twinkle-mist"
        strokeWidth="2"
      />
      <path
        d="M100 22 L178 100 L100 178 L22 100 Z"
        className="fill-none stroke-twinkle-sage"
        strokeWidth="2.5"
      />
      <path
        d="M100 40 C128 72 128 128 100 160 C72 128 72 72 100 40 Z"
        className="fill-none stroke-twinkle-rose"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M40 100 C72 72 128 72 160 100 C128 128 72 128 40 100 Z"
        className="fill-none stroke-twinkle-rose"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="100" cy="100" r="7" className="fill-twinkle-rose" />
      {dots.map((dot) => (
        <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r="2.6" className="fill-twinkle-ink/60" />
      ))}
    </svg>
  );
}

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
        const data = await api.products.list({ limit: 100, productType: RANGOLI_PRODUCT_TYPE });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-left">
            <span className="section-eyebrow mb-3 inline-flex items-center gap-1.5">
              <Flame size={13} aria-hidden="true" />
              Festival special
            </span>
            <h1 className="section-heading mt-2">Rangoli Collection</h1>
            <p className="section-subheading mt-2 mx-auto lg:mx-0">
              Pick a design and book in one tap. Our artist draws it at your home.
            </p>
            <a href="#rangoli-gallery" className="btn-primary mt-6">
              Browse designs
            </a>
          </div>
          <div className="max-w-sm w-full mx-auto lg:mx-0 lg:justify-self-end">
            <KolamMark />
          </div>
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
              <h3 className="empty-state-title">No Rangoli designs yet</h3>
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
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink mb-8">
            How it works
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-4">
            {STEPS.map((step, index) => (
              <Fragment key={step.title}>
                {index > 0 && (
                  <ArrowRight
                    size={20}
                    aria-hidden="true"
                    className="text-twinkle-rose rotate-90 sm:rotate-0 sm:mt-1 shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-twinkle-ink">{step.title}</h3>
                  <p className="text-sm text-twinkle-ink/50 mt-1 max-w-[32ch]">{step.text}</p>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Occasions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink mb-6">
            Made for your occasion
          </h2>
          <div className="flex flex-wrap gap-3">
            {OCCASIONS.map((occasion) => (
              <span
                key={occasion}
                className="inline-flex items-center px-5 py-2.5 rounded-2xl border border-twinkle-mist bg-white text-sm font-semibold text-twinkle-ink/70"
              >
                {occasion}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
