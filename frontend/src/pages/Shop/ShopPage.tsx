import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { api } from '../../api.js';
import ProductCard from '../../components/UI/ProductCard';
import type { ProductListItem as Product } from '@twinkle-hearts/shared';

const CATEGORIES = [
  { key: 'all', label: 'All Cards', emoji: '✨' },
  { key: 'birthday', label: 'Birthday', emoji: '🎂' },
  { key: 'love', label: 'Love', emoji: '💕' },
  { key: 'anniversary', label: 'Anniversary', emoji: '🥂' },
  { key: 'friendship', label: 'Friendship', emoji: '🤝' },
  { key: 'festival', label: 'Festival', emoji: '🎊' },
  { key: 'sympathy', label: 'Sympathy', emoji: '🕊️' },
] as const;

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    // Get category from URL params
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categoryFromUrl !== activeCategory) {
      setActiveCategory(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const category = activeCategory === 'all' ? undefined : activeCategory;
      const data = await api.products.list({ limit: 20, category });
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart(product: Product) {
    await addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      image: product.images[0],
    });
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  return (
    <div className="bg-twinkle-canvas min-h-screen">
      {/* Page Header */}
      <section className="bg-twinkle-sky/40 border-b border-twinkle-mist/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-twinkle-ink mb-4">
              Browse Our Collection
            </h1>
            <p className="font-body text-lg text-twinkle-ink/70">
              Beautiful greeting cards for every occasion
            </p>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="bg-white border-b border-twinkle-mist/50 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`category-pill whitespace-nowrap ${
                  activeCategory === cat.key ? 'category-pill-active' : ''
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-twinkle-ink">
                {activeCategory === 'all' ? 'All Greeting Cards' : `${CATEGORIES.find(c => c.key === activeCategory)?.label} Cards`}
              </h2>
              <p className="text-twinkle-ink/70 mt-1">
                {products.length} card{products.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="skeleton-card-image" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton-card-line" />
                    <div className="skeleton-card-line-short" />
                    <div className="flex justify-between items-center">
                      <div className="skeleton-card-line w-16 h-6" />
                      <div className="skeleton-card-line w-20 h-8 rounded-pill" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-twinkle-ink/50 mb-4">{error}</p>
              <button onClick={fetchProducts} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <EnvelopeIcon />
                  </div>
                  <h3 className="empty-state-title">No cards in this category yet</h3>
                  <p className="empty-state-text">Check back soon — we're always adding new designs!</p>
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="btn-ghost mt-6"
                  >
                    View all cards
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-fade-up opacity-0"
                      style={{ animationDelay: `${Math.min(index * 60, 420)}ms`, animationFillMode: 'forwards' }}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EnvelopeIcon() {
  return (
    <svg className="w-full h-full" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="16" width="48" height="32" rx="4" />
      <path d="M8 20l24 16 24-16" />
    </svg>
  );
}
